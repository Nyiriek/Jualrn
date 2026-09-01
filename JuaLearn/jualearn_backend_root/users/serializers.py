from rest_framework import serializers
from .models import User, Assignment, Subject, Notification, Quiz, Enrollment, QuizResult, Lesson, QuizChoice, QuizQuestion, StudentAnswer, AIConversation, AIMessage, LearningResource, ForumPost, ForumComment, FeedbackPost, FeedbackComment
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.password_validation import validate_password
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name',
            'institution', 'years_of_experience', 'phone_number', 'profile_picture'
        ]


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class ForumAuthorSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'display_name', 'role']

    def get_display_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ForumCommentSerializer(serializers.ModelSerializer):
    author = ForumAuthorSerializer(read_only=True)

    class Meta:
        model = ForumComment
        fields = ['id', 'post', 'author', 'body', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']


class ForumPostSerializer(serializers.ModelSerializer):
    author = ForumAuthorSerializer(read_only=True)
    comments = ForumCommentSerializer(many=True, read_only=True)

    class Meta:
        model = ForumPost
        fields = ['id', 'author', 'title', 'body', 'post_type', 'comments', 'created_at', 'updated_at']
        read_only_fields = ['author', 'comments', 'created_at', 'updated_at']


class FeedbackCommentSerializer(serializers.ModelSerializer):
    author = ForumAuthorSerializer(read_only=True)

    class Meta:
        model = FeedbackComment
        fields = ['id', 'post', 'author', 'body', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']


class FeedbackPostSerializer(serializers.ModelSerializer):
    author = ForumAuthorSerializer(read_only=True)
    comments = FeedbackCommentSerializer(many=True, read_only=True)

    class Meta:
        model = FeedbackPost
        fields = ['id', 'author', 'title', 'body', 'feedback_type', 'comments', 'created_at', 'updated_at']
        read_only_fields = ['author', 'comments', 'created_at', 'updated_at']
        
class TeacherRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'institution', 'years_of_experience', 'phone_number',
            'password', 'password2'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn’t match."})
        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({"email": "An account already uses this email address."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role = 'teacher'
        # Verification is currently optional; retain the flag for when the
        # code-based flow is re-enabled from the environment.
        user.email_verified = not settings.EMAIL_VERIFICATION_REQUIRED
        user.save()
        return user

class LearningResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = ['id', 'title', 'subject_area', 'topic', 'resource_type', 'description', 'content', 'source', 'source_reference', 'source_url', 'created_by', 'is_published', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class SubjectSerializer(serializers.ModelSerializer):
    resources = LearningResourceSerializer(many=True, read_only=True)
    teacher_name = serializers.SerializerMethodField()
    resource_ids = serializers.PrimaryKeyRelatedField(
        queryset=LearningResource.objects.all(), many=True, required=False, write_only=True, source='resources'
    )

    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'content', 'created_by', 'teacher_name', 'published', 'resources', 'resource_ids']
        read_only_fields = ['created_by']

    def get_teacher_name(self, obj):
        if not obj.created_by:
            return ''
        return f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip() or obj.created_by.username


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account already uses this email address.')
        return value
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.email_verified = not settings.EMAIL_VERIFICATION_REQUIRED
        user.save()
        return user

class AssignmentSerializer(serializers.ModelSerializer):
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='student'), required=False, allow_null=True)

    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'subject', 'created_by', 'assigned_to', 'due_date', 'created_at', 'grade', 'published', 'submission_text', 'submitted_at']
        read_only_fields = ['created_by', 'created_at', 'submitted_at']
        extra_kwargs = {
            'assigned_to': {'required': False, 'allow_null': True}
        }

    def validate(self, attrs):
        if not attrs.get('title'):
            raise serializers.ValidationError({"title": "This field is required."})
        if not attrs.get('subject'):
            raise serializers.ValidationError({"subject": "This field is required."})
        if not attrs.get('due_date'):
            raise serializers.ValidationError({"due_date": "This field is required."})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['subject'] = SubjectSerializer(instance.subject).data
        data['assigned_to'] = StudentSerializer(instance.assigned_to).data if instance.assigned_to else None
        return data

class QuizSerializer(serializers.ModelSerializer):
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='student'), required=False, allow_null=True)
    resources = LearningResourceSerializer(many=True, read_only=True)
    resource_ids = serializers.PrimaryKeyRelatedField(
        queryset=LearningResource.objects.all(), many=True, required=False, write_only=True, source='resources'
    )
    student_result = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'subject', 'created_by', 'assigned_to', 'due_date', 'created_at', 'published', 'resources', 'resource_ids', 'student_result']
        read_only_fields = ['created_by', 'created_at']
        extra_kwargs = {
            'assigned_to': {'required': False, 'allow_null': True}
        }


    def validate(self, attrs):
        if not attrs.get('title'):
            raise serializers.ValidationError({"title": "This field is required."})
        if not attrs.get('subject'):
            raise serializers.ValidationError({"subject": "This field is required."})
        if not attrs.get('due_date'):
            raise serializers.ValidationError({"due_date": "This field is required."})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['subject'] = SubjectSerializer(instance.subject).data
        data['assigned_to'] = StudentSerializer(instance.assigned_to).data if instance.assigned_to else None
        return data

    def get_student_result(self, instance):
        user = getattr(self.context.get('request'), 'user', None)
        if not user or getattr(user, 'role', None) != 'student':
            return None
        result = QuizResult.objects.filter(student=user, quiz=instance).first()
        if not result or result.grade is None:
            return None
        return {'grade': result.grade, 'submitted_at': result.submitted_at}
    
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['firstName'] = user.first_name
        token['lastName'] = user.last_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if settings.EMAIL_VERIFICATION_REQUIRED and self.user.role in {'student', 'teacher'} and not self.user.email_verified:
            raise AuthenticationFailed('Please verify your email before signing in. Check your inbox or request a new verification code.')
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['role'] = self.user.role
        data['firstName'] = self.user.first_name
        data['lastName'] = self.user.last_name
        # This keeps the avatar available after logout and the next login.
        data['profilePicture'] = self.user.profile_picture.url if self.user.profile_picture else None
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'profile_picture']
        read_only_fields = ['role']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'url', 'created_at', 'is_read', 'type']

class QuizResultSerializer(serializers.ModelSerializer):
    quiz = serializers.StringRelatedField()
    quiz_id = serializers.PrimaryKeyRelatedField(queryset=Quiz.objects.all(), source='quiz', write_only=True)

    class Meta:
        model = QuizResult
        fields = ['id', 'student', 'quiz', 'quiz_id', 'grade', 'submitted_at']
        read_only_fields = ['id', 'student', 'quiz', 'submitted_at']
        
class QuizResultSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)
    quiz = serializers.StringRelatedField(read_only=True)
    title = serializers.CharField(source='quiz.title', read_only=True)
    subject = SubjectSerializer(source='quiz.subject', read_only=True)
    due_date = serializers.DateField(source='quiz.due_date', read_only=True)
    submitted_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = QuizResult
        fields = ['id', 'student', 'quiz', 'title', 'subject', 'due_date', 'grade', 'submitted_at']
        read_only_fields = ['id', 'student', 'quiz', 'grade']


class TeacherQuizResultSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    course = serializers.CharField(source='quiz.subject.name', read_only=True)
    answers = serializers.SerializerMethodField()

    class Meta:
        model = QuizResult
        fields = [
            'id', 'student', 'quiz_title', 'course', 'grade', 'submitted_at',
            'is_teacher_adjusted', 'answers',
        ]
        read_only_fields = fields

    def get_answers(self, result):
        from .utils import matches_answer_key

        submitted_answers = StudentAnswer.objects.filter(
            student=result.student,
            question__quiz=result.quiz,
        ).select_related('question', 'selected_choice').prefetch_related('question__choices')
        review = []
        for answer in submitted_answers:
            question = answer.question
            if question.type == 'short-answer':
                is_correct = bool(question.answer_key.strip()) and matches_answer_key(answer.answer_text, question.answer_key)
                correct_answer = question.answer_key
                submitted_answer = answer.answer_text
            else:
                is_correct = bool(answer.selected_choice and answer.selected_choice.is_correct)
                correct_answer = ' / '.join(question.choices.filter(is_correct=True).values_list('text', flat=True))
                submitted_answer = answer.selected_choice.text if answer.selected_choice else ''
            review.append({
                'question_id': question.id,
                'question_text': question.text,
                'submitted_answer': submitted_answer,
                'correct_answer': correct_answer,
                'is_correct': is_correct,
            })
        return review
        
class EnrollmentSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        write_only=True,
        source='subject'
    )

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'subject', 'subject_id', 'enrolled_at']

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'subject', 'title', 'content', 'created_by', 'date_created']
        read_only_fields = ['created_by', 'date_created']
        

class QuizChoiceSerializer(serializers.ModelSerializer):
    def get_fields(self):
        fields = super().get_fields()
        user = getattr(self.context.get('request'), 'user', None)
        if not user or getattr(user, 'role', None) == 'student':
            fields.pop('is_correct', None)
        return fields

    class Meta:
        model = QuizChoice
        fields = ['id', 'text', 'is_correct']
        
class QuizQuestionSerializer(serializers.ModelSerializer):
    choices = QuizChoiceSerializer(many=True, read_only=True)

    def get_fields(self):
        fields = super().get_fields()
        user = getattr(self.context.get('request'), 'user', None)
        if not user or getattr(user, 'role', None) == 'student':
            fields.pop('answer_key', None)
        return fields

    class Meta:
        model = QuizQuestion
        fields = ['id', 'text', 'type', 'answer_key', 'choices']
        
class QuizAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField(required=False)
    answer_text = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)

    def validate(self, attrs):
        if not attrs.get('choice_id') and not attrs.get('answer_text', '').strip():
            raise serializers.ValidationError('Provide a selected choice or a written answer.')
        return attrs


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'created_at']


class AIConversationSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = [
            'id', 'title', 'subject', 'subject_name', 'lesson', 'lesson_title',
            'context_type', 'context_id', 'created_at', 'updated_at', 'messages',
        ]


class AIChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(trim_whitespace=True, max_length=1200)
    conversation_id = serializers.IntegerField(required=False)
    subject_id = serializers.IntegerField(required=False)
    lesson_id = serializers.IntegerField(required=False)
    context_type = serializers.ChoiceField(
        choices=['subject', 'lesson', 'quiz', 'assignment'], required=False, allow_blank=True
    )
    context_id = serializers.IntegerField(required=False)
    client_message_id = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError('Please enter a question for Jua Companion.')
        return value.strip()
