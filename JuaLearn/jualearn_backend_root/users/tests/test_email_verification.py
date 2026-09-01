from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from datetime import timedelta
import pytest
from rest_framework.test import APIClient

from users.email_verification import VerificationEmailDeliveryError, create_and_send_verification
from users.models import EmailVerificationToken


@pytest.mark.django_db
@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_VERIFICATION_REQUIRED=True)
def test_email_verification_is_required_before_student_login():
    user = get_user_model().objects.create_user(
        username='new-learner', email='learner@example.com', password='secure-pass-123',
        role='student', email_verified=False,
    )
    record = create_and_send_verification(user)
    assert len(record.token) == 4
    assert record.token.isdigit()
    client = APIClient()

    blocked = client.post('/api/token/', {'username': 'new-learner', 'password': 'secure-pass-123'}, format='json')
    assert blocked.status_code == 401
    assert 'verify your email' in blocked.data['detail'].lower()

    verified = client.post('/api/auth/verify-email/', {'email': user.email, 'code': record.token}, format='json')
    assert verified.status_code == 200
    user.refresh_from_db()
    record.refresh_from_db()
    assert user.email_verified is True
    assert record.used_at is not None

    signed_in = client.post('/api/token/', {'username': 'new-learner', 'password': 'secure-pass-123'}, format='json')
    assert signed_in.status_code == 200
    assert signed_in.data['access']


@pytest.mark.django_db
def test_expired_verification_code_is_rejected():
    user = get_user_model().objects.create_user(username='expired-code', email='expired@example.com', password='secure-pass-123', role='teacher', email_verified=False)
    record = EmailVerificationToken.objects.create(user=user, token='1234', expires_at=timezone.now() - timedelta(minutes=1))
    response = APIClient().post('/api/auth/verify-email/', {'email': user.email, 'code': record.token}, format='json')
    assert response.status_code == 400
    user.refresh_from_db()
    assert user.email_verified is False


@pytest.mark.django_db
@override_settings(EMAIL_VERIFICATION_REQUIRED=True)
def test_registration_does_not_create_an_account_when_code_delivery_fails(monkeypatch):
    monkeypatch.setattr(
        'users.views.create_and_send_verification',
        lambda user: (_ for _ in ()).throw(VerificationEmailDeliveryError()),
    )

    response = APIClient().post('/api/register/student/', {
        'username': 'unreachable@example.com',
        'email': 'unreachable@example.com',
        'password': 'secure-pass-123',
        'first_name': 'Unreachable',
        'last_name': 'Student',
        'role': 'student',
    }, format='json')

    assert response.status_code == 503
    assert 'could not send' in response.data['detail'].lower()
    assert not get_user_model().objects.filter(email='unreachable@example.com').exists()


@pytest.mark.django_db
@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_VERIFICATION_REQUIRED=True)
def test_teacher_registration_verification_and_login_flow():
    client = APIClient()
    registration = client.post('/api/register/teacher/', {
        'username': 'teacher@example.com',
        'email': 'teacher@example.com',
        'first_name': 'Test',
        'last_name': 'Teacher',
        'institution': 'Jua Academy',
        'years_of_experience': 2,
        'phone_number': '0700000000',
        'password': 'secure-pass-123',
        'password2': 'secure-pass-123',
        'role': 'teacher',
    }, format='json')

    assert registration.status_code == 201
    user = get_user_model().objects.get(email='teacher@example.com')
    record = EmailVerificationToken.objects.get(user=user)

    blocked = client.post('/api/token/', {'username': user.username, 'password': 'secure-pass-123'}, format='json')
    assert blocked.status_code == 401

    verified = client.post('/api/auth/verify-email/', {'email': user.email, 'code': record.token}, format='json')
    assert verified.status_code == 200

    signed_in = client.post('/api/token/', {'username': user.username, 'password': 'secure-pass-123'}, format='json')
    assert signed_in.status_code == 200
    assert signed_in.data['role'] == 'teacher'


@pytest.mark.django_db
def test_standard_student_registration_can_sign_in_without_email_verification():
    client = APIClient()
    registration = client.post('/api/register/student/', {
        'username': 'standard-student@example.com',
        'email': 'standard-student@example.com',
        'password': 'secure-pass-123',
        'first_name': 'Standard',
        'last_name': 'Student',
        'role': 'student',
    }, format='json')

    assert registration.status_code == 201
    user = get_user_model().objects.get(email='standard-student@example.com')
    assert user.email_verified is True
    assert not EmailVerificationToken.objects.filter(user=user).exists()

    signed_in = client.post('/api/token/', {'username': user.username, 'password': 'secure-pass-123'}, format='json')
    assert signed_in.status_code == 200
    assert signed_in.data['role'] == 'student'
