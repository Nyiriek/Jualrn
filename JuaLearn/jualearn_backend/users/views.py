from rest_framework import viewsets, permissions
from .models import Assignment, Subject, User
from .serializers import AssignmentSerializer, SubjectSerializer, MyTokenObtainPairSerializer
from .permissions import IsTeacherOrReadOnly
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer, UserProfileSerializer, UserRegisterSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model
User = get_user_model()

# --------- ASSIGNMENT ---------
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Assignment.objects.filter(assigned_to=user)
        elif user.role == 'teacher':
            return Assignment.objects.filter(created_by=user)
        elif user.role == 'admin':
            return Assignment.objects.all()
        return Assignment.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'teacher':
            serializer.save(created_by=self.request.user)
        elif self.request.user.role == 'admin':
            serializer.save()
        else:
            serializer.save()

# --------- SUBJECT ---------
class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = SubjectSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Only admin or teachers can create/edit/delete subjects
        return [IsTeacherOrReadOnly()]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role'):
            if user.role == 'teacher':
                return Subject.objects.filter(assignment__created_by=user).distinct()
            elif user.role == 'admin':
                return Subject.objects.all()
            elif user.role == 'student':
                return Subject.objects.all()
        return Subject.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role in ['teacher', 'admin']:
            serializer.save()
        else:
            raise permissions.PermissionDenied("Not authorized.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'admin':
            instance.delete()
        elif user.role == 'teacher':
            if Assignment.objects.filter(subject=instance, created_by=user).exists():
                instance.delete()
            else:
                raise permissions.PermissionDenied("You can only delete subjects you are associated with.")
        else:
            raise permissions.PermissionDenied("Not authorized.")

# --------- AUTH/JWT ---------
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# --------- REGISTRATION ---------
from rest_framework import generics

class RegisterStudentView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    def perform_create(self, serializer):
        serializer.save(role='student')

class RegisterTeacherView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    def perform_create(self, serializer):
        serializer.save(role='teacher')

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
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


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

# ---------- ADMIN LOGIN ENDPOINT ----------
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if user is not None and (getattr(user, "role", None) == "admin" or user.is_staff or user.is_superuser):
            refresh = RefreshToken.for_user(user)
            return Response({
                "username": user.username,
                "email": user.email,
                "role": "admin",
                "firstName": user.first_name,
                "lastName": user.last_name,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })
        return Response({"detail": "Invalid credentials or not an admin."}, status=status.HTTP_401_UNAUTHORIZED)
