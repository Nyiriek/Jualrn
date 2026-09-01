from rest_framework import viewsets, permissions, status, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db import transaction
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import action, api_view, permission_classes
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Assignment, Subject, User, Notification, Quiz, Enrollment, QuizResult, Lesson, QuizQuestion, QuizChoice, LearningResource, ForumPost, ForumComment, FeedbackPost, FeedbackComment, EmailVerificationToken
from .serializers import (
    AssignmentSerializer, SubjectSerializer, MyTokenObtainPairSerializer,
    UserSerializer, UserProfileSerializer, UserRegisterSerializer, StudentSerializer, TeacherRegisterSerializer,
    NotificationSerializer, QuizSerializer, EnrollmentSerializer, QuizResultSerializer, TeacherQuizResultSerializer, LessonSerializer, QuizQuestionSerializer, QuizChoiceSerializer, LearningResourceSerializer, ForumPostSerializer, ForumCommentSerializer, FeedbackPostSerializer, FeedbackCommentSerializer)
from rest_framework import generics
from .permissions import IsAdminTeacherOrReadOnlyForStudent
from .utils import grade_quiz 
from .quiz_generation import build_question_drafts
from .assignment_generation import build_assignment_draft
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.utils import timezone
from datetime import date, timedelta
import json
import os
import secrets
from .email_verification import VerificationEmailDeliveryError, create_and_send_verification


User = get_user_model()

class TeacherRegisterView(generics.CreateAPIView):
    serializer_class = TeacherRegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Teacher registration validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                self.perform_create(serializer)
        except VerificationEmailDeliveryError:
            return Response(
                {'detail': 'We could not send your verification code. Please try again shortly.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = serializer.save()
        create_and_send_verification(user)

# --------- STUDENT LIST VIEW ---------
class StudentListViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role='student')


class ForumPostViewSet(viewsets.ModelViewSet):
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ForumPost.objects.select_related('author').prefetch_related('comments__author')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            raise PermissionDenied('You can only edit your own forum posts.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied('You can only delete your own forum posts.')
        instance.delete()


class ForumCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ForumCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ForumComment.objects.select_related('author', 'post')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            raise PermissionDenied('You can only edit your own forum comments.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied('You can only delete your own forum comments.')
        instance.delete()


class FeedbackPostViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FeedbackPost.objects.select_related('author').prefetch_related('comments__author')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            raise PermissionDenied('You can only edit your own feedback posts.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied('You can only delete your own feedback posts.')
        instance.delete()


class FeedbackCommentViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FeedbackComment.objects.select_related('author', 'post')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            raise PermissionDenied('You can only edit your own feedback replies.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied('You can only delete your own feedback replies.')
        instance.delete()

# --------- ASSIGNMENT ---------
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Assignment.objects.filter(assigned_to=user, published=True)
        elif user.role == 'teacher':
            return Assignment.objects.filter(created_by=user, assigned_to__isnull=True)
        elif user.role == 'admin':
            return Assignment.objects.all()
        return Assignment.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied("Only teachers or admins can create assignments.")

        validated_data = serializer.validated_data
        title = validated_data['title']
        subject = validated_data['subject']
        due_date = validated_data['due_date']
        description = validated_data.get('description', '')
        assigned_to = validated_data.get('assigned_to')

        # Create base assignment
        base_assignment = Assignment.objects.create(
            title=title,
            description=description,
            subject=subject,
            due_date=due_date,
            created_by=self.request.user,
            assigned_to=None,
            grade=None,
            published=False
        )

        # Bulk create for enrolled students
        enrolled_students = [assigned_to.id] if assigned_to else Enrollment.objects.filter(subject=subject).values_list('student', flat=True)
        assignments = [
            Assignment(
                title=base_assignment.title,
                description=base_assignment.description,
                subject=base_assignment.subject,
                created_by=base_assignment.created_by,
                due_date=base_assignment.due_date,
                assigned_to_id=student_id,
                grade=None,
                published=False
            ) for student_id in enrolled_students
        ]
        Assignment.objects.bulk_create(assignments)

        # Inject base_assignment into serializer._instance
        serializer.instance = base_assignment

        # Notifications are sent only when published, not on create

    def perform_update(self, serializer):
        assignment = serializer.save()
        Assignment.objects.filter(created_by=assignment.created_by, title=assignment.title, subject=assignment.subject).exclude(id=assignment.id).update(
            title=assignment.title, description=assignment.description, due_date=assignment.due_date, published=assignment.published
        )

    def perform_destroy(self, instance):
        if instance.assigned_to:
            Notification.objects.create(recipient=instance.assigned_to, title=f"Assignment Deleted: {instance.title}", message=f"Your assignment in {instance.subject.name} was deleted.", url="", type="assignment_delete")
        instance.delete()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def generate_from_course(self, request):
        if request.user.role != 'teacher':
            raise PermissionDenied('Only teachers can generate assignments from course material.')
        subject_id = request.data.get('subject_id')
        subject = get_object_or_404(Subject, id=subject_id, created_by=request.user)
        resources = list(subject.resources.all())
        lessons = list(Lesson.objects.filter(subject=subject).order_by('date_created'))
        draft = build_assignment_draft(subject, resources, lessons)
        return Response(draft)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        assignment = self.get_object()
        user = request.user
        if user.role != 'teacher' or assignment.created_by != user:
            return Response({'detail': 'Not authorized to publish this assignment.'}, status=403)
        assignment.published = True
        assignment.save()
        Assignment.objects.filter(created_by=assignment.created_by, title=assignment.title, subject=assignment.subject).exclude(id=assignment.id).update(published=True)

        enrolled_students = Enrollment.objects.filter(subject=assignment.subject).values_list('student', flat=True)
        notifications = [
            Notification(
                recipient_id=student_id,
                title=f"Assignment Published: {assignment.title}",
                message=f"A new assignment '{assignment.title}' has been published in {assignment.subject.name}.",
                url=f"/student/assignments/{assignment.id}/",
                type="assignment_published"
            )
            for student_id in enrolled_students
        ]
        Notification.objects.bulk_create(notifications)
        return Response({'detail': 'Assignment published and students notified.'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def student_work(self, request):
        if request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied("Only teachers can view student work.")
        queryset = Assignment.objects.filter(created_by=request.user, assigned_to__isnull=False) if request.user.role == 'teacher' else Assignment.objects.filter(assigned_to__isnull=False)
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=True, methods=['patch'], url_path='grade-submission', permission_classes=[IsAuthenticated])
    def grade_submission(self, request, pk=None):
        if request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied('Only teachers and administrators can grade submissions.')
        filters = {'id': pk, 'assigned_to__isnull': False}
        if request.user.role == 'teacher':
            filters['created_by'] = request.user
        assignment = get_object_or_404(Assignment, **filters)
        if not assignment.submitted_at:
            return Response({'detail': 'This assignment has not been submitted yet.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            grade = int(request.data.get('grade'))
        except (TypeError, ValueError):
            return Response({'grade': 'Enter a whole-number grade from 0 to 100.'}, status=status.HTTP_400_BAD_REQUEST)
        if grade < 0 or grade > 100:
            return Response({'grade': 'Enter a whole-number grade from 0 to 100.'}, status=status.HTTP_400_BAD_REQUEST)

        assignment.grade = grade
        assignment.save(update_fields=['grade'])
        Notification.objects.create(
            recipient=assignment.assigned_to,
            title=f'Assignment Graded: {assignment.title}',
            message=f'Your teacher graded your assignment. Your final grade is {grade}%.',
            url='/student/grades',
            type='assignment_graded',
        )
        return Response(self.get_serializer(assignment).data)

        
# --------- SUBJECT ---------
class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Subject.objects.filter(
                Q(created_by=user) | Q(created_by__role='admin', published=True)
            )
        elif user.role == 'admin':
            return Subject.objects.all()
        elif user.role == 'student':
            return Subject.objects.filter(published=True)
        return Subject.objects.none()

    def perform_create(self, serializer):
        subject = serializer.save(created_by=self.request.user)
        
        students = User.objects.filter(role='student')
        notifications = [
            Notification(
                recipient=student,
                title=f"New Subject Added: {subject.name}",
                message=f"A new subject '{subject.name}' has been added. Check it out!",
                url=f"/student/subject/{subject.id}/",
                type="subject"
            )
            for student in students
        ]
        Notification.objects.bulk_create(notifications)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        subject = self.get_object()
        user = request.user

        if user.role != 'teacher' or subject.created_by != user:
            return Response({'detail': 'Not authorized to publish this subject.'}, status=403)

        was_published = subject.published
        subject.published = True
        subject.save()
        teacher_name = f"{user.first_name} {user.last_name}".strip() or user.username

        students = User.objects.filter(role='student')
        notifications = [
            Notification(
                recipient=student,
                title=f"Course Published: {subject.name}",
                message=f"{teacher_name} published '{subject.name}'. The course is now open for enrollment.",
                url=f"/student/subject/{subject.id}",
                type="subject_published"
            )
            for student in students
        ]
        Notification.objects.bulk_create(notifications)

        if not was_published:
            admin_notifications = [
                Notification(
                    recipient=admin,
                    title=f"Teacher Course Published: {subject.name}",
                    message=f"{teacher_name} published the course '{subject.name}'. Review its content, lessons, quizzes, and assignments.",
                    url="/admin",
                    type="teacher_course_published",
                )
                for admin in User.objects.filter(role='admin')
            ]
            Notification.objects.bulk_create(admin_notifications)

        return Response({'detail': 'Subject published and students notified.'})


class PublicCourseListView(APIView):
    """A read-only catalogue for landing-page visitors.

    Only published courses are shown. Assessments, enrolments and user details
    deliberately remain behind authenticated role-specific endpoints.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        courses = Subject.objects.filter(published=True).select_related('created_by').prefetch_related('resources')
        return Response(SubjectSerializer(courses, many=True, context={'request': request}).data)


class PublicCourseDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        course = get_object_or_404(
            Subject.objects.filter(published=True).select_related('created_by').prefetch_related('resources'),
            pk=pk,
        )
        data = SubjectSerializer(course, context={'request': request}).data
        data['lessons'] = LessonSerializer(
            Lesson.objects.filter(subject=course).order_by('date_created'), many=True, context={'request': request}
        ).data
        return Response(data)


class LearningResourceViewSet(viewsets.ModelViewSet):
    serializer_class = LearningResourceSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]

    def get_queryset(self):
        user = self.request.user
        queryset = LearningResource.objects.all()
        if user.role == 'teacher':
            queryset = queryset.filter(Q(is_published=True) | Q(created_by=user))
        elif user.role == 'student':
            queryset = queryset.filter(is_published=True)

        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search) | Q(subject_area__icontains=search))
        resource_type = self.request.query_params.get('type', '').strip()
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        subject_area = self.request.query_params.get('subject', '').strip()
        if subject_area:
            queryset = queryset.filter(subject_area__iexact=subject_area)
        topic = self.request.query_params.get('topic', '').strip()
        if topic:
            queryset = queryset.filter(topic__iexact=topic)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        resource = self.get_object()
        if self.request.user.role == 'teacher' and resource.created_by != self.request.user:
            raise PermissionDenied('You can only edit resources you added.')
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role == 'teacher' and instance.created_by != self.request.user:
            raise PermissionDenied('You can only delete resources you added.')
        instance.delete()

# --------- QUIZ ---------

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            enrolled_subject_ids = Enrollment.objects.filter(student=user).values_list('subject_id', flat=True)
            return Quiz.objects.filter(subject_id__in=enrolled_subject_ids, published=True)
        elif user.role == 'teacher':
            return Quiz.objects.filter(created_by=user)
        elif user.role == 'admin':
            return Quiz.objects.all()
        return Quiz.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Quiz creation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        if self.request.user.role != 'teacher':
            raise PermissionDenied("Only teachers can create quizzes.")
        # Save quiz as unpublished initially
        quiz = serializer.save(created_by=self.request.user, assigned_to=None, published=False)

        enrolled_students = Enrollment.objects.filter(subject=quiz.subject).values_list('student', flat=True)
        quiz_results = [QuizResult(student_id=student_id, quiz=quiz) for student_id in enrolled_students]
        QuizResult.objects.bulk_create(quiz_results)

        # Notifications will be sent on publish, not on create

    def perform_update(self, serializer):
        quiz = serializer.save()
        Notification.objects.create(
            recipient=quiz.created_by,
            title=f"Quiz Updated: {quiz.title}",
            message=f"A quiz in {quiz.subject.name} was updated.",
            url=f"/teacher/quizzes/{quiz.id}/",
            type="quiz_update"
        )

    def perform_destroy(self, instance):
        enrolled_students = Enrollment.objects.filter(subject=instance.subject).values_list('student', flat=True)
        for student_id in enrolled_students:
            Notification.objects.create(
                recipient_id=student_id,
                title=f"Quiz Deleted: {instance.title}",
                message=f"A quiz in {instance.subject.name} was deleted.",
                url="",
                type="quiz_delete"
            )
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def generate_from_course(self, request, pk=None):
        quiz = self.get_object()
        if request.user.role != 'teacher' or quiz.created_by != request.user:
            raise PermissionDenied('Only the course teacher can generate quiz questions.')

        try:
            limit = max(1, min(int(request.data.get('limit', 6)), 12))
        except (TypeError, ValueError):
            limit = 6

        resources = quiz.resources.all()
        if not resources.exists():
            resources = quiz.subject.resources.all()
        drafts = build_question_drafts(quiz.subject, resources, Lesson.objects.filter(subject=quiz.subject), limit=limit)
        if not drafts:
            return Response({'detail': 'Add course content, linked resources, or lessons before generating questions.'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for draft in drafts:
            question = QuizQuestion.objects.create(
                quiz=quiz,
                text=draft['text'],
                type=draft['type'],
                answer_key=draft.get('answer_key', ''),
            )
            for index, choice_text in enumerate(draft['choices']):
                QuizChoice.objects.create(question=question, text=choice_text, is_correct=index == draft['correct_index'])
            created.append(question)
        return Response({
            'detail': f'{len(created)} questions generated from the course material. Review them before publishing.',
            'questions': QuizQuestionSerializer(created, many=True).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        quiz = self.get_object()
        user = request.user
        if user.role != 'teacher' or quiz.created_by != user:
            return Response({'detail': 'Not authorized to publish this quiz.'}, status=403)
        quiz.published = True
        quiz.save()

        enrolled_students = Enrollment.objects.filter(subject=quiz.subject).values_list('student', flat=True)
        notifications = [
            Notification(
                recipient_id=student_id,
                title=f"Quiz Published: {quiz.title}",
                message=f"A new quiz '{quiz.title}' has been published in {quiz.subject.name}.",
                url=f"/student/quizzes/{quiz.id}/",
                type="quiz_published"
            )
            for student_id in enrolled_students
        ]
        Notification.objects.bulk_create(notifications)
        return Response({'detail': 'Quiz published and students notified.'})

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def questions(self, request, pk=None):
        quiz = self.get_object()
        if request.method == 'POST':
            if request.user.role != 'teacher' or quiz.created_by != request.user:
                raise PermissionDenied('Only the course teacher can add quiz questions.')
            serializer = QuizQuestionSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save(quiz=quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        questions = quiz.questions.all()
        serializer = QuizQuestionSerializer(questions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        student = request.user
        if student.role != 'student':
            raise PermissionDenied("Only students can submit quizzes.")
        answers = request.data.get('answers', [])
        if not quiz.questions.exists():
            return Response({'detail': 'This quiz has no questions yet.'}, status=status.HTTP_400_BAD_REQUEST)
        quiz_result = grade_quiz(student, quiz, answers)

        pending_review_count = getattr(quiz_result, 'pending_review_count', 0)

        # Notify teacher about submission to grade or review.
        Notification.objects.create(
            recipient=quiz.created_by,
            title=f"Quiz {'Review Needed' if pending_review_count else 'Auto-graded'}: {quiz.title}",
            message=(
                f"{student.username} submitted '{quiz.title}'. {pending_review_count} written response(s) need review."
                if pending_review_count else f"{student.username} submitted '{quiz.title}' and it was graded automatically."
            ),
            url=f"/teacher/quizzes/{quiz.id}/results",
            type="quiz_submitted",
        )

        # Notify the student of their automatic score.
        Notification.objects.create(
            recipient=student,
            title=f"Quiz {'Score' if not pending_review_count else 'Auto-score'}: {quiz.title}",
            message=(
                f"Your automatic score in {quiz.subject.name}: {quiz_result.grade}%. {pending_review_count} response(s) still need teacher review."
                if pending_review_count else f"Your quiz in {quiz.subject.name} was graded automatically. Your score: {quiz_result.grade}%"
            ),
            url=f"/student/quizzes/{quiz.id}/results",
            type="quiz_graded",
        )

        return Response({
            'grade': quiz_result.grade,
            'auto_graded': True,
            'pending_review_count': pending_review_count,
            'answer_results': getattr(quiz_result, 'answer_results', []),
        }, status=status.HTTP_200_OK)


# --------- NOTIFICATIONS ---------
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        print(f"[NotificationViewSet] User: {user}, role: {getattr(user, 'role', None)}")
        return Notification.objects.filter(recipient=user)

    def perform_update(self, serializer):
        serializer.save()

# --------- AUTH/JWT ---------
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# ---------- ADMIN LOGIN ----------
class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        print(f"[AdminLoginView] Authenticated user: {user}, role: {getattr(user, 'role', None) if user else None}")
        if user is not None and (getattr(user, "role", None) == "admin" or user.is_staff or user.is_superuser):
            refresh = RefreshToken.for_user(user)
            return Response({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": "admin",
                "firstName": user.first_name,
                "lastName": user.last_name,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })
        return Response({"detail": "Invalid credentials or not an admin."}, status=status.HTTP_401_UNAUTHORIZED)

# --------- REGISTRATION ---------
class RegisterStudentView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                self.perform_create(serializer)
        except VerificationEmailDeliveryError:
            return Response(
                {'detail': 'We could not send your verification code. Please try again shortly.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = serializer.save(role='student')
        create_and_send_verification(user)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip()
        code = str(request.data.get('code', '')).strip()
        record = EmailVerificationToken.objects.select_related('user').filter(user__email__iexact=email, used_at__isnull=True).first()
        if not record or record.expires_at <= timezone.now():
            return Response({'detail': 'This verification code is invalid or has expired. Request a new code to continue.'}, status=status.HTTP_400_BAD_REQUEST)
        if record.attempts >= 5:
            record.used_at = timezone.now()
            record.save(update_fields=['used_at'])
            return Response({'detail': 'Too many incorrect attempts. Request a new verification code.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(code) != 4 or not code.isdigit() or not secrets.compare_digest(record.token, code):
            record.attempts += 1
            record.save(update_fields=['attempts'])
            return Response({'detail': 'The verification code is incorrect. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        record.user.email_verified = True
        record.user.save(update_fields=['email_verified'])
        record.used_at = timezone.now()
        record.save(update_fields=['used_at'])
        return Response({'detail': 'Your email has been verified. You can now sign in.'})


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip()
        user = User.objects.filter(email__iexact=email, role__in=['student', 'teacher'], email_verified=False).first()
        if user:
            try:
                create_and_send_verification(user)
            except VerificationEmailDeliveryError:
                return Response({'detail': 'We could not send the verification email right now. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        # Keep this response neutral so addresses cannot be used to discover accounts.
        return Response({'detail': 'If an unverified account uses this email, a new verification code has been sent.'})

# --------- USER MANAGEMENT ---------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

# --------- PROFILE ---------
class MyProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

# --------- SEARCH ---------
class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.GET.get("q", "")
        subjects = Subject.objects.filter(name__icontains=q)
        assignments = Assignment.objects.filter(title__icontains=q)
        data = []
        data.extend([
            {"id": s.id, "name": s.name, "type": "Subject"}
            for s in subjects
        ])
        data.extend([
            {"id": a.id, "title": a.title, "type": "Assignment"}
            for a in assignments
        ])
        return Response({"results": data})


# --------- ENROLLMENT ---------
class EnrollmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Enrollment.objects.filter(student=user)
        elif user.role == 'teacher':
            # teacher can see enrollments for subjects they created
            subjects = Subject.objects.filter(created_by=user)
            return Enrollment.objects.filter(subject__in=subjects)
        elif user.role == 'admin':
            return Enrollment.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise PermissionDenied("Only students can enroll.")
        enrollment = serializer.save(student=self.request.user)

        teacher = enrollment.subject.created_by
        if teacher is not None:
            Notification.objects.create(
                recipient=teacher,
                title=f"New Enrollment: {enrollment.student.username}",
                message=f"{enrollment.student.username} enrolled in {enrollment.subject.name}.",
                url=f"/teacher/enrollments/{enrollment.id}/",
                type="enrollment",
            )
        else:
            pass

        return enrollment


# ------------Quiz Result------------
class QuizResultViewSet(viewsets.ModelViewSet):
    queryset = QuizResult.objects.all()
    serializer_class = QuizResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return QuizResult.objects.filter(student=user)
        elif user.role == 'teacher':
            return QuizResult.objects.filter(quiz__created_by=user)
        elif user.role == 'admin':
            return QuizResult.objects.all()
        return QuizResult.objects.none()

    def perform_create(self, serializer):
        # Only allow students to create their own quiz results or teachers/admins to create for any student
        if self.request.user.role == 'student':
            serializer.save(student=self.request.user)
        elif self.request.user.role in ['teacher', 'admin']:
            serializer.save()
        else:
            raise PermissionDenied("Not authorized.")

    @action(detail=False, methods=['get'], url_path='gradebook')
    def gradebook(self, request):
        if request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied('Only teachers and administrators can view the gradebook.')
        results = self.get_queryset().filter(grade__isnull=False).select_related(
            'student', 'quiz__subject'
        ).order_by('-submitted_at')
        return Response(TeacherQuizResultSerializer(results, many=True, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='override-grade')
    def override_grade(self, request, pk=None):
        result = self.get_object()
        if request.user.role == 'teacher' and result.quiz.created_by != request.user:
            raise PermissionDenied('You can only adjust results for quizzes you created.')
        try:
            grade = int(request.data.get('grade'))
        except (TypeError, ValueError):
            return Response({'grade': 'Enter a whole-number grade from 0 to 100.'}, status=status.HTTP_400_BAD_REQUEST)
        if grade < 0 or grade > 100:
            return Response({'grade': 'Enter a whole-number grade from 0 to 100.'}, status=status.HTTP_400_BAD_REQUEST)

        result.grade = grade
        result.is_teacher_adjusted = True
        result.save(update_fields=['grade', 'is_teacher_adjusted'])
        Notification.objects.create(
            recipient=result.student,
            title=f'Quiz Grade Updated: {result.quiz.title}',
            message=f'Your teacher updated your quiz grade to {grade}%.',
            url='/student/quizzes/',
            type='quiz_grade_updated',
        )
        return Response(TeacherQuizResultSerializer(result, context={'request': request}).data)
        

# --------- STUDENT ASSIGNMENT AND QUIZ GRADES ---------
class StudentAssignmentGradesView(generics.ListAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Only assignments assigned to the student with a grade (not null)
        return Assignment.objects.filter(assigned_to=user).exclude(grade__isnull=True)


class StudentQuizGradesView(generics.ListAPIView):
    serializer_class = QuizResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return QuizResult.objects.filter(student=user).exclude(grade__isnull=True)


# --------- SUBMIT QUIZ ---------
class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        student = request.user
        quiz = Quiz.objects.get(id=quiz_id)
        answers = request.data.get('answers', [])

        quiz_result = grade_quiz(student, quiz, answers)
        pending_review_count = getattr(quiz_result, 'pending_review_count', 0)
        pending_review_count = getattr(quiz_result, 'pending_review_count', 0)

        serializer = QuizResultSerializer(quiz_result)
        return Response(serializer.data)
    

# --------- STUDENT QUIZ VIEW ---------
class StudentQuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for students to see quizzes they are enrolled in.
    """
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'student':
            return Quiz.objects.none()
        enrolled_subject_ids = Enrollment.objects.filter(student=user).values_list('subject_id', flat=True)
        return Quiz.objects.filter(subject_id__in=enrolled_subject_ids)
    

class StudentEnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Enrollment.objects.filter(student=user).select_related('subject')
        return Enrollment.objects.none()
    
    
# --------- ENROLLED STUDENTS---------
class EnrolledStudentsList(generics.ListAPIView):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        subject_id = self.kwargs['subject_id']
        subject = get_object_or_404(Subject, id=subject_id)
        # Only allow teachers who created the subject or admins to view the enrolled students
        user = self.request.user
        if user.role == 'teacher' and subject.created_by != user:
            return User.objects.none()
        if user.role not in ['teacher', 'admin']:
            return User.objects.none()

        enrolled_students = Enrollment.objects.filter(subject=subject).select_related('student').values_list('student', flat=True)
        return User.objects.filter(id__in=enrolled_students)
    


# --------- LESSONS ---------
class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]

    def perform_create(self, serializer):
        if self.request.user.role not in ['teacher', 'admin']:
            raise PermissionDenied("Only teachers can create lessons.")
        subject = serializer.validated_data['subject']
        if self.request.user.role == 'teacher' and subject.created_by != self.request.user:
            raise PermissionDenied("You can only add lessons to courses you created.")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        subject = serializer.validated_data.get('subject', serializer.instance.subject)
        if self.request.user.role == 'teacher' and subject.created_by != self.request.user:
            raise PermissionDenied("You can only move lessons to courses you created.")
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return Lesson.objects.filter(created_by=user)
        elif user.role == 'student':
            enrolled_subjects = Enrollment.objects.filter(student=user).values_list('subject', flat=True)
            return Lesson.objects.filter(subject__in=enrolled_subjects)
        elif user.role == 'admin':
            return Lesson.objects.all()
        return Lesson.objects.none()


# --------- BULK UPLOAD ENDPOINT ---------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_upload(request):
    """Import a course package uploaded by an administrator.

    A package is a JSON file containing a ``courses`` array.  Each course can
    include its overview, resources, lessons, quizzes/questions and
    assignments.  Re-uploading a course with the same name updates that course
    and its matching learning items, so an administrator can correct content
    without creating duplicates.
    """
    if request.user.role != 'admin':
        raise PermissionDenied('Only administrators can upload course packages.')

    upload = request.FILES.get('file')
    if upload is None:
        return Response({'detail': 'Choose a JSON course package to upload.'}, status=status.HTTP_400_BAD_REQUEST)
    if upload.size > 5 * 1024 * 1024:
        return Response({'detail': 'The upload must be 5 MB or smaller.'}, status=status.HTTP_400_BAD_REQUEST)
    if not upload.name.lower().endswith('.json'):
        return Response({'detail': 'Upload a .json course package.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        package = json.loads(upload.read().decode('utf-8-sig'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return Response({'detail': 'The selected file is not valid UTF-8 JSON.'}, status=status.HTTP_400_BAD_REQUEST)

    courses = package.get('courses') if isinstance(package, dict) else None
    if not isinstance(courses, list) or not courses:
        return Response({'detail': 'The JSON package must contain a non-empty "courses" list.'}, status=status.HTTP_400_BAD_REQUEST)

    def package_date(value):
        if not value:
            return date.today() + timedelta(days=30)
        try:
            return date.fromisoformat(str(value))
        except ValueError as exc:
            raise ValueError('Use due dates in YYYY-MM-DD format.') from exc

    counts = {'courses': 0, 'resources': 0, 'lessons': 0, 'quizzes': 0, 'questions': 0, 'assignments': 0}
    try:
        with transaction.atomic():
            for course_data in courses:
                if not isinstance(course_data, dict) or not str(course_data.get('name', '')).strip():
                    raise ValueError('Every course needs a name.')
                name = str(course_data['name']).strip()
                subject, _ = Subject.objects.update_or_create(
                    name=name,
                    defaults={
                        'description': str(course_data.get('description', '')),
                        'content': str(course_data.get('content', '')),
                        'published': bool(course_data.get('published', False)),
                        'created_by': request.user,
                    },
                )
                counts['courses'] += 1

                for resource_data in course_data.get('resources', []):
                    title = str(resource_data.get('title', '')).strip()
                    if not title:
                        raise ValueError(f'Resource titles are required in {name}.')
                    resource, _ = LearningResource.objects.update_or_create(
                        title=title,
                        subject_area=str(resource_data.get('subject_area', name)),
                        topic=str(resource_data.get('topic', '')),
                        defaults={
                            'resource_type': resource_data.get('resource_type', 'reading'),
                            'description': str(resource_data.get('description', '')),
                            'content': str(resource_data.get('content', '')),
                            'source': str(resource_data.get('source', '')),
                            'source_reference': str(resource_data.get('source_reference', '')),
                            'source_url': str(resource_data.get('source_url', '')),
                            'is_published': bool(resource_data.get('is_published', True)),
                            'created_by': request.user,
                        },
                    )
                    subject.resources.add(resource)
                    counts['resources'] += 1

                for lesson_data in course_data.get('lessons', []):
                    title = str(lesson_data.get('title', '')).strip()
                    if not title:
                        raise ValueError(f'Lesson titles are required in {name}.')
                    Lesson.objects.update_or_create(
                        subject=subject,
                        title=title,
                        defaults={'content': str(lesson_data.get('content', '')), 'created_by': request.user},
                    )
                    counts['lessons'] += 1

                for quiz_data in course_data.get('quizzes', []):
                    title = str(quiz_data.get('title', '')).strip()
                    if not title:
                        raise ValueError(f'Quiz titles are required in {name}.')
                    quiz, _ = Quiz.objects.update_or_create(
                        subject=subject,
                        title=title,
                        defaults={
                            'description': str(quiz_data.get('description', '')),
                            'due_date': package_date(quiz_data.get('due_date')),
                            'published': bool(quiz_data.get('published', False)),
                            'created_by': request.user,
                            'assigned_to': None,
                        },
                    )
                    if 'questions' in quiz_data:
                        quiz.questions.all().delete()
                        for question_data in quiz_data.get('questions') or []:
                            text = str(question_data.get('text', '')).strip()
                            if not text:
                                raise ValueError(f'Quiz questions need text in {title}.')
                            question = QuizQuestion.objects.create(
                                quiz=quiz,
                                text=text,
                                type=question_data.get('type', 'multiple-choice'),
                                answer_key=str(question_data.get('answer_key', '')),
                            )
                            for choice_data in question_data.get('choices', []):
                                choice_text = str(choice_data.get('text', '')).strip()
                                if choice_text:
                                    QuizChoice.objects.create(question=question, text=choice_text, is_correct=bool(choice_data.get('is_correct', False)))
                            counts['questions'] += 1
                    counts['quizzes'] += 1

                for assignment_data in course_data.get('assignments', []):
                    title = str(assignment_data.get('title', '')).strip()
                    if not title:
                        raise ValueError(f'Assignment titles are required in {name}.')
                    Assignment.objects.update_or_create(
                        subject=subject,
                        title=title,
                        assigned_to=None,
                        defaults={
                            'description': str(assignment_data.get('description', '')),
                            'due_date': package_date(assignment_data.get('due_date')),
                            'published': bool(assignment_data.get('published', False)),
                            'created_by': request.user,
                        },
                    )
                    counts['assignments'] += 1
    except (TypeError, ValueError) as exc:
        return Response({'detail': f'Upload could not be imported: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

    summary = ', '.join(f'{value} {key}' for key, value in counts.items() if value)
    return Response({'detail': f'Course package imported: {summary}.', 'counts': counts}, status=status.HTTP_201_CREATED)


# --------- ASSIGNMENT SUBMISSION ---------
class SubmitAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, assignment_id):
        student = request.user
        assignment = get_object_or_404(Assignment, id=assignment_id, assigned_to=student)

        assignment.submission_text = request.data.get('submission_text', '')
        assignment.submitted_at = timezone.now()
        assignment.save(update_fields=['submission_text', 'submitted_at'])

        Notification.objects.create(
            recipient=assignment.created_by,
            title=f"Assignment Submitted: {assignment.title}",
            message=f"{student.username} has submitted the assignment.",
            url=f"/teacher/assignments/{assignment.id}/grade",
            type="assignment_submitted"
        )
        return Response({"detail": "Assignment submitted successfully.", "submitted_at": assignment.submitted_at}, status=status.HTTP_200_OK)
    
    
# --------- SUBMIT QUIZ VIEW ---------
class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        student = request.user
        quiz = get_object_or_404(Quiz, id=quiz_id)
        answers = request.data.get('answers', [])
        from .utils import grade_quiz
        quiz_result = grade_quiz(student, quiz, answers)
        pending_review_count = getattr(quiz_result, 'pending_review_count', 0)

        Notification.objects.create(
            recipient=quiz.created_by,
            title=f"Quiz Submitted: {quiz.title}",
            message=f"{student.username} has submitted the quiz.",
            url=f"/teacher/quizzes/{quiz.id}/grade",
            type="quiz_submitted"
        )
        return Response({
            'grade': quiz_result.grade,
            'auto_graded': True,
            'pending_review_count': pending_review_count,
            'answer_results': getattr(quiz_result, 'answer_results', []),
        }, status=status.HTTP_200_OK)
    
    
# --- QuizQuestion Viewset for managing questions within a quiz ---
class QuizQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizQuestionSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]

    def get_queryset(self):
        quiz_id = self.kwargs.get('quiz_pk')
        quiz = get_object_or_404(Quiz, id=quiz_id)
        user = self.request.user
        if user.role == 'teacher' and quiz.created_by != user:
            return QuizQuestion.objects.none()
        if user.role == 'student' and (not quiz.published or not Enrollment.objects.filter(student=user, subject=quiz.subject).exists()):
            return QuizQuestion.objects.none()
        return QuizQuestion.objects.filter(quiz_id=quiz_id)

    def perform_create(self, serializer):
        quiz_id = self.kwargs.get('quiz_pk')
        quiz = get_object_or_404(Quiz, id=quiz_id)
        if self.request.user.role != 'teacher' or quiz.created_by != self.request.user:
            raise PermissionDenied("Only the course teacher can edit quiz questions.")
        serializer.save(quiz=quiz)



# --- QuizChoice Viewset for managing choices within a question ---
class QuizChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = QuizChoiceSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]

    def get_queryset(self):
        question_id = self.kwargs.get('question_pk')
        question = get_object_or_404(QuizQuestion, id=question_id)
        quiz = question.quiz
        user = self.request.user
        if user.role == 'teacher' and quiz.created_by != user:
            return QuizChoice.objects.none()
        if user.role == 'student' and (not quiz.published or not Enrollment.objects.filter(student=user, subject=quiz.subject).exists()):
            return QuizChoice.objects.none()
        return QuizChoice.objects.filter(question_id=question_id)

    def perform_create(self, serializer):
        question_id = self.kwargs.get('question_pk')
        question = get_object_or_404(QuizQuestion, id=question_id)
        if self.request.user.role != 'teacher' or question.quiz.created_by != self.request.user:
            raise PermissionDenied("Only the course teacher can edit quiz choices.")
        serializer.save(question_id=question_id)

# --- SubmitAssignmentView for students submitting assignments ---
class SubmitAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, assignment_id):
        student = request.user
        assignment = get_object_or_404(Assignment, id=assignment_id, assigned_to=student)

        assignment.submission_text = request.data.get('submission_text', '')
        assignment.submitted_at = timezone.now()
        assignment.save(update_fields=['submission_text', 'submitted_at'])

        Notification.objects.create(
            recipient=assignment.created_by,
            title=f"Assignment Submitted: {assignment.title}",
            message=f"{student.username} has submitted the assignment.",
            url=f"/teacher/assignments/{assignment.id}/grade",
            type="assignment_submitted"
        )
        return Response({"detail": "Assignment submitted successfully.", "submitted_at": assignment.submitted_at}, status=status.HTTP_200_OK)

# --- SubmitQuizView for students submitting quiz answers and grading ---
class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        student = request.user
        quiz = get_object_or_404(Quiz, id=quiz_id)
        answers = request.data.get('answers', [])

        quiz_result = grade_quiz(student, quiz, answers)

        Notification.objects.create(
            recipient=quiz.created_by,
            title=f"Quiz Submitted: {quiz.title}",
            message=f"{student.username} has submitted the quiz.",
            url=f"/teacher/quizzes/{quiz.id}/grade",
            type="quiz_submitted"
        )
        return Response({'grade': quiz_result.grade}, status=status.HTTP_200_OK)
