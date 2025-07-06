from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (
    AssignmentViewSet, SubjectViewSet, UserViewSet,
    RegisterStudentView, RegisterTeacherView,
    MeView, MyProfileView, SearchView
)

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/student/', RegisterStudentView.as_view(), name='register-student'),
    path('register/teacher/', RegisterTeacherView.as_view(), name='register-teacher'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('search/', SearchView.as_view(), name="search"),
    path('auth/admin-login/', TokenObtainPairView.as_view(), name='admin-login'),
]
