import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from users.models import Subject  # Adjust path if needed

User = get_user_model()

@pytest.fixture
def teacher_user(db):
    return User.objects.create_user(
        username='teacher1',
        password='testpass123',
        role='teacher'
    )

@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        username='student1',
        password='testpass123',
        role='student'
    )

@pytest.fixture
def subject(teacher_user):
    return Subject.objects.create(
        name='Mathematics',
        created_by=teacher_user
    )

@pytest.fixture
def teacher_client(teacher_user):
    client = APIClient()
    client.force_authenticate(user=teacher_user)
    return client

@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client
