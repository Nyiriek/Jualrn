"""Email ownership verification for student and teacher registrations."""

import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailVerificationToken


class VerificationEmailDeliveryError(Exception):
    """Raised when an account code cannot be sent to the user's inbox."""


def create_and_send_verification(user):
    """Send a one-time 4-digit code without exposing it through the API."""
    EmailVerificationToken.objects.filter(user=user, used_at__isnull=True).delete()
    # The code is globally unique while active. Retrying a collision preserves
    # the model's uniqueness guarantee without weakening the user-facing flow.
    record = None
    for _ in range(12):
        code = f'{secrets.randbelow(10_000):04d}'
        if not EmailVerificationToken.objects.filter(token=code).exists():
            record = EmailVerificationToken.objects.create(
                user=user,
                token=code,
                expires_at=timezone.now() + timedelta(hours=getattr(settings, 'EMAIL_VERIFICATION_HOURS', 24)),
            )
            break
    if record is None:
        raise RuntimeError('Could not create an email verification code. Please try again.')
    subject = 'Your JuaLearn verification code'
    message = (
        f'Hello {user.first_name or user.username},\n\n'
        'Welcome to JuaLearn. Enter this code on the verification screen to activate your account:\n\n'
        f'{record.token}\n\n'
        f'This 4-digit code expires in {settings.EMAIL_VERIFICATION_HOURS} hours. Do not share it. If you did not create this account, you can ignore this email.'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
    except Exception as exc:
        raise VerificationEmailDeliveryError('The verification email could not be delivered.') from exc
    return record
