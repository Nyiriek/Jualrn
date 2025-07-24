from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    AssignmentViewSet, SubjectViewSet, UserViewSet, QuizResultViewSet,
    RegisterStudentView, TeacherRegisterView,
    MeView, MyProfileView, SearchView,
    AdminLoginView, NotificationViewSet, QuizViewSet, StudentListViewSet, EnrollmentViewSet, StudentAssignmentGradesView, StudentQuizGradesView,
    SubmitQuizView, StudentQuizViewSet, StudentEnrollmentViewSet, EnrolledStudentsList, LessonViewSet, bulk_upload, SubmitAssignmentView,
    QuizQuestionViewSet, QuizChoiceViewSet
)

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'users', UserViewSet)
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'students', StudentListViewSet, basename='students')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollments')
router.register(r'quiz-results', QuizResultViewSet, basename='quiz-results')
router.register(r'student/quizzes', StudentQuizViewSet, basename='student-quizzes')
router.register(r'student/enrollments', StudentEnrollmentViewSet, basename='student-enrollments')
router.register(r'quiz-questions', QuizQuestionViewSet, basename='quiz-questions')
router.register(r'lessons', LessonViewSet)

quizzes_router = routers.NestedSimpleRouter(router, r'quizzes', lookup='quiz')
quizzes_router.register(r'questions', QuizQuestionViewSet, basename='quiz-questions')

questions_router = routers.NestedSimpleRouter(quizzes_router, r'questions', lookup='question')
questions_router.register(r'choices', QuizChoiceViewSet, basename='quiz-question-choices')


urlpatterns = [
    path('', include(router.urls)),
    path('register/student/', RegisterStudentView.as_view(), name='register-student'),
    path('register/teacher/', TeacherRegisterView.as_view(), name='register-teacher'),
    path('me/', MeView.as_view(), name='me'),
    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('search/', SearchView.as_view(), name="search"),
    path('auth/admin-login/', AdminLoginView.as_view(), name='admin_login'),
    path('api/', include(router.urls)),
    path('student/grades/assignments/', StudentAssignmentGradesView.as_view(), name='student-assignment-grades'),
    path('student/grades/quizzes/', StudentQuizGradesView.as_view(), name='student-quiz-grades'),
    path('quizzes/<int:quiz_id>/submit/', SubmitQuizView.as_view(), name='submit-quiz'),
      path('assignments/<int:assignment_id>/submit/', SubmitAssignmentView.as_view(), name='submit-assignment'),
    path('subjects/<int:subject_id>/enrolled_students/', EnrolledStudentsList.as_view(), name='enrolled-students'),
    path('bulk-upload/', bulk_upload, name='bulk-upload'),
]

urlpatterns += router.urls
urlpatterns += quizzes_router.urls
urlpatterns += questions_router.urls