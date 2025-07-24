from rest_framework import viewsets, permissions, status, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Q
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import action, api_view, permission_classes
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Assignment, Subject, User, Notification, Quiz, Enrollment, QuizResult, Lesson, QuizQuestion, QuizChoice
from .serializers import (
    AssignmentSerializer, SubjectSerializer, MyTokenObtainPairSerializer,
    UserSerializer, UserProfileSerializer, UserRegisterSerializer, StudentSerializer, TeacherRegisterSerializer,
    NotificationSerializer, QuizSerializer, EnrollmentSerializer, QuizResultSerializer, LessonSerializer, QuizQuestionSerializer, QuizChoiceSerializer)
from rest_framework import generics
from .permissions import IsAdminTeacherOrReadOnlyForStudent
from .utils import grade_quiz 
from django.shortcuts import get_object_or_404
from django.conf import settings
import json
import os


User = get_user_model()

class TeacherRegisterView(generics.CreateAPIView):
    serializer_class = TeacherRegisterSerializer
    permission_classes = [IsAdminTeacherOrReadOnlyForStudent]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Teacher registration validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# --------- STUDENT LIST VIEW ---------
class StudentListViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role='student')

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
            return Assignment.objects.filter(created_by=user)
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

        # Create base assignment
        base_assignment = Assignment.objects.create(
            title=title,
            subject=subject,
            due_date=due_date,
            created_by=self.request.user,
            assigned_to=None,
            grade=None,
            published=False
        )

        # Bulk create for enrolled students
        enrolled_students = Enrollment.objects.filter(subject=subject).values_list('student', flat=True)
        assignments = [
            Assignment(
                title=base_assignment.title,
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
        Notification.objects.create(
            recipient=assignment.assigned_to,
            title=f"Assignment Updated: {assignment.title}",
            message=f"Your assignment in {assignment.subject.name} was updated.",
            url=f"/student/assignments/{assignment.id}/",
            type="assignment_update"
        )

    def perform_destroy(self, instance):
        Notification.objects.create(
            recipient=instance.assigned_to,
            title=f"Assignment Deleted: {instance.title}",
            message=f"Your assignment in {instance.subject.name} was deleted.",
            url="",
            type="assignment_delete"
        )
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        assignment = self.get_object()
        user = request.user
        if user.role != 'teacher' or assignment.created_by != user:
            return Response({'detail': 'Not authorized to publish this assignment.'}, status=403)
        assignment.published = True
        assignment.save()

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

        subject.published = True
        subject.save()

        students = User.objects.filter(role='student')
        notifications = [
            Notification(
                recipient=student,
                title=f"Course Published: {subject.name}",
                message=f"The course '{subject.name}' is now published and open for enrollment.",
                url=f"/student/subject/{subject.id}",
                type="subject_published"
            )
            for student in students
        ]
        Notification.objects.bulk_create(notifications)

        return Response({'detail': 'Subject published and students notified.'})

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

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def questions(self, request, pk=None):
        quiz = self.get_object()
        questions = quiz.questions.all()
        serializer = QuizQuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        student = request.user
        if student.role != 'student':
            raise PermissionDenied("Only students can submit quizzes.")
        answers = request.data.get('answers', [])
        quiz_result = grade_quiz(student, quiz, answers)

        # Notify teacher about submission to grade
        Notification.objects.create(
            recipient=quiz.created_by,
            title=f"Quiz Submitted: {quiz.title}",
            message=f"{student.username} submitted the quiz '{quiz.title}'. Please grade it.",
            url=f"/teacher/quizzes/{quiz.id}/results",
            type="quiz_submitted",
        )

        # Notify student of their graded quiz
        Notification.objects.create(
            recipient=student,
            title=f"Quiz Graded: {quiz.title}",
            message=f"Your quiz in {quiz.subject.name} has been graded. Your score: {quiz_result.grade}%",
            url=f"/student/quizzes/{quiz.id}/results",
            type="quiz_graded",
        )

        return Response({'grade': quiz_result.grade}, status=status.HTTP_200_OK)


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

    def perform_create(self, serializer):
        serializer.save(role='student')

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
        elif user.role in ['teacher', 'admin']:
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
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

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
@permission_classes([IsAdminUser])
def bulk_upload(request):
    base_path = getattr(settings, 'CONTENT_FOLDER', None)
    if base_path is None:
        return Response({"detail": "Content folder path not configured."}, status=400)

    try:
        with open(os.path.join(base_path, 'subjects.json'), 'r') as f:
            subjects_data = json.load(f)
        with open(os.path.join(base_path, 'lessons.json'), 'r') as f:
            lessons_data = json.load(f)
        with open(os.path.join(base_path, 'quizzes.json'), 'r') as f:
            quizzes_data = json.load(f)

        from .models import Subject, Lesson, Quiz, QuizQuestion, QuizChoice

        created_subjects = {}

        # Create Subjects
        for subj in subjects_data:
            subject_obj, _ = Subject.objects.get_or_create(
                name=subj['name'],
                defaults={
                    'description': subj.get('description', ''),
                    'created_by': request.user
                }
            )
            created_subjects[subj['name']] = subject_obj

        # Create Lessons
        for lesson in lessons_data:
            subj_obj = created_subjects.get(lesson['subjectName'])
            if subj_obj:
                Lesson.objects.get_or_create(
                    subject=subj_obj,
                    title=lesson['title'],
                    defaults={
                        'content': lesson['content'],
                        'created_by': request.user
                    }
                )

        # Create Quizzes and their Questions + Choices
        for quiz in quizzes_data:
            subj_obj = created_subjects.get(quiz['subjectName'])
            if not subj_obj:
                continue

            quiz_obj, _ = Quiz.objects.get_or_create(
                title=quiz['title'],
                subject=subj_obj,
                defaults={
                    'description': quiz.get('description', ''),
                    'due_date': quiz.get('due_date'),
                    'created_by': request.user,
                }
            )
            quiz_obj.questions.all().delete()

            for q in quiz.get('questions', []):
                question_obj = QuizQuestion.objects.create(
                    quiz=quiz_obj,
                    text=q['text'],
                    type=q.get('type', 'multiple-choice'),
                )
                for choice in q.get('choices', []):
                    QuizChoice.objects.create(
                        question=question_obj,
                        text=choice['text'],
                        is_correct=choice.get('is_correct', False),
                    )

        return Response({"detail": "Bulk upload successful."}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"detail": f"Bulk upload failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


# --------- ASSIGNMENT SUBMISSION ---------
class SubmitAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, assignment_id):
        student = request.user
        assignment = get_object_or_404(Assignment, id=assignment_id, assigned_to=student)

        # Save submission info here if you want

        Notification.objects.create(
            recipient=assignment.created_by,
            title=f"Assignment Submitted: {assignment.title}",
            message=f"{student.username} has submitted the assignment.",
            url=f"/teacher/assignments/{assignment.id}/grade",
            type="assignment_submitted"
        )
        return Response({"detail": "Assignment submitted successfully."}, status=status.HTTP_200_OK)
    
    
# --------- SUBMIT QUIZ VIEW ---------
class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        student = request.user
        quiz = get_object_or_404(Quiz, id=quiz_id)
        answers = request.data.get('answers', [])
        from .utils import grade_quiz
        quiz_result = grade_quiz(student, quiz, answers)

        Notification.objects.create(
            recipient=quiz.created_by,
            title=f"Quiz Submitted: {quiz.title}",
            message=f"{student.username} has submitted the quiz.",
            url=f"/teacher/quizzes/{quiz.id}/grade",
            type="quiz_submitted"
        )
        return Response({'grade': quiz_result.grade}, status=status.HTTP_200_OK)
    
    
# --- QuizQuestion Viewset for managing questions within a quiz ---
class QuizQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizQuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        quiz_id = self.kwargs.get('quiz_pk')
        return QuizQuestion.objects.filter(quiz_id=quiz_id)

    def perform_create(self, serializer):
        quiz_id = self.kwargs.get('quiz_pk')
        quiz = get_object_or_404(Quiz, id=quiz_id)
        serializer.save(quiz=quiz)



# --- QuizChoice Viewset for managing choices within a question ---
class QuizChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = QuizChoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        question_id = self.kwargs.get('question_pk')
        return QuizChoice.objects.filter(question_id=question_id)

    def perform_create(self, serializer):
        question_id = self.kwargs.get('question_pk')
        serializer.save(question_id=question_id)

# --- SubmitAssignmentView for students submitting assignments ---
class SubmitAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, assignment_id):
        student = request.user
        assignment = get_object_or_404(Assignment, id=assignment_id, assigned_to=student)

        # Optional: Add logic to save submission data here

        Notification.objects.create(
            recipient=assignment.created_by,
            title=f"Assignment Submitted: {assignment.title}",
            message=f"{student.username} has submitted the assignment.",
            url=f"/teacher/assignments/{assignment.id}/grade",
            type="assignment_submitted"
        )
        return Response({"detail": "Assignment submitted successfully."}, status=status.HTTP_200_OK)

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