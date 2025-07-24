import pytest
from users.serializers import AssignmentSerializer, QuizSerializer, SubjectSerializer
from users.models import Subject, User
from rest_framework.exceptions import ValidationError

@pytest.mark.django_db
def test_subject_serializer_valid(teacher_user):
    data = {'name': 'Math', 'description': 'Math course', 'created_by': teacher_user.id}
    serializer = SubjectSerializer(data=data)
    assert serializer.is_valid()

@pytest.mark.django_db
def test_assignment_serializer_validation(subject, teacher_user):
    data = {'title': '', 'subject': subject.id, 'due_date': '2025-12-31'}
    serializer = AssignmentSerializer(data=data)
    with pytest.raises(ValidationError):
        serializer.is_valid(raise_exception=True)

    valid_data = {'title': 'Assignment 1', 'subject': subject.id, 'due_date': '2025-12-31'}
    serializer = AssignmentSerializer(data=valid_data)
    assert serializer.is_valid()

@pytest.mark.django_db
def test_quiz_serializer_validation(subject, teacher_user):
    data = {'title': '', 'subject': subject.id, 'due_date': '2025-12-31'}
    serializer = QuizSerializer(data=data)
    with pytest.raises(ValidationError):
        serializer.is_valid(raise_exception=True)

    valid_data = {'title': 'Quiz 1', 'subject': subject.id, 'due_date': '2025-12-31'}
    serializer = QuizSerializer(data=valid_data)
    assert serializer.is_valid()
