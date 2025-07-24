from rest_framework import serializers
from .models import User, Assignment, Subject, Notification, Quiz, Enrollment, QuizResult, Lesson, QuizChoice, QuizQuestion, StudentAnswer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name',
            'institution', 'years_of_experience', 'phone_number'
        ]
        
class TeacherRegisterSerializer(serializers.ModelSerializer):
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
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role = 'teacher'
        user.save()
        return user

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'created_by', 'published']
        read_only_fields = ['created_by']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ['created_by', 'grade']
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

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = '__all__'
        read_only_fields = ['created_by']
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
        data['role'] = self.user.role
        data['firstName'] = self.user.first_name
        data['lastName'] = self.user.last_name
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

    class Meta:
        model = QuizResult
        fields = ['id', 'student', 'quiz', 'grade']
        read_only_fields = ['id', 'student', 'quiz', 'grade']
        
class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

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
    class Meta:
        model = QuizChoice
        fields = ['id', 'text', 'is_correct']
        
class QuizQuestionSerializer(serializers.ModelSerializer):
    choices = QuizChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ['id', 'text', 'type', 'choices']
        
class QuizAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()