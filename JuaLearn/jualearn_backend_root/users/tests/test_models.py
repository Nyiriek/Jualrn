import pytest
from users.models import User, Subject, Assignment, Quiz

@pytest.mark.django_db
def test_user_creation():
    user = User.objects.create_user(
        username="testuser", email="test@example.com", password="testpass", role="student"
    )
    assert user.username == "testuser"
    assert user.role == "student"
    assert user.check_password("testpass")

@pytest.mark.django_db
def test_subject_creation(teacher_user):
    subject = Subject.objects.create(name="Physics", created_by=teacher_user)
    assert subject.name == "Physics"
    assert subject.created_by == teacher_user
    assert not subject.published

@pytest.mark.django_db
def test_assignment_creation(teacher_user, student_user, subject):
    assignment = Assignment.objects.create(
        title="Test Assignment",
        subject=subject,
        created_by=teacher_user,
        assigned_to=student_user,
        due_date="2025-12-31"
    )
    assert assignment.title == "Test Assignment"
    assert assignment.subject == subject
    assert assignment.assigned_to == student_user
    assert not assignment.published

@pytest.mark.django_db
def test_quiz_creation(teacher_user, subject):
    quiz = Quiz.objects.create(
        title="Test Quiz",
        subject=subject,
        created_by=teacher_user,
        due_date="2025-12-31"
    )
    assert quiz.title == "Test Quiz"
    assert quiz.subject == subject
    assert not quiz.published
