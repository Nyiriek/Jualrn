from rest_framework import serializers
from .models import User, Assignment, Subject
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description']
        
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']
        # role is optional in the form, we’ll set it in the view

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AssignmentSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer()
    assigned_to = UserSerializer()
    created_by = UserSerializer()

    class Meta:
        model = Assignment
        fields = '__all__'

# --- Add this custom JWT serializer for login ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims (appear inside JWT, not directly in response)
        token['role'] = user.role
        token['firstName'] = user.first_name
        token['lastName'] = user.last_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Extra fields in login response (what your frontend expects)
        data['role'] = self.user.role
        data['firstName'] = self.user.first_name
        data['lastName'] = self.user.last_name
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'profile_picture']
        read_only_fields = ['role'] 