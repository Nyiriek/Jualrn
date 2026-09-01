from unittest.mock import patch

import pytest
import requests
from rest_framework.test import APIClient

from users.models import AIConversation, Enrollment, Subject


@pytest.fixture
def student_client(student_user):
    client = APIClient()
    client.force_authenticate(user=student_user)
    return client


@pytest.mark.django_db
def test_companion_requires_authentication():
    response = APIClient().post('/api/ai-companion/chat/', {'message': 'Explain fractions.'}, format='json')
    assert response.status_code == 401


@pytest.mark.django_db
def test_companion_creates_private_conversation(student_client):
    response = student_client.post('/api/ai-companion/chat/', {
        'message': 'Explain fractions in simple words.',
        'client_message_id': 'question-one',
    }, format='json')
    assert response.status_code == 200
    assert response.data['conversation']['title'].startswith('Explain fractions')
    assert response.data['message']['role'] == 'assistant'
    assert AIConversation.objects.count() == 1


@pytest.mark.django_db
def test_companion_gives_course_aware_study_steps_without_live_ai(student_client, student_user, teacher_user, monkeypatch):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    subject = Subject.objects.create(
        name='Energy changes', published=True, created_by=teacher_user,
        content='Exothermic reactions release energy. Endothermic reactions take in energy.',
    )
    Enrollment.objects.create(student=student_user, subject=subject)
    response = student_client.post('/api/ai-companion/chat/', {
        'message': 'Help me understand this topic.', 'subject_id': subject.id,
    }, format='json')

    assert response.status_code == 200
    assert 'small study steps' in response.data['message']['content']
    assert 'OpenAI API key' not in response.data['message']['content']


@pytest.mark.django_db
def test_companion_rejects_invalid_message(student_client):
    response = student_client.post('/api/ai-companion/chat/', {'message': ' '}, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_conversations_are_private(student_client, student_user, teacher_user):
    conversation = AIConversation.objects.create(user=student_user, title='Private study')
    other_client = APIClient()
    other_client.force_authenticate(user=teacher_user)
    response = other_client.get(f'/api/ai-companion/conversations/{conversation.id}/')
    assert response.status_code == 404
    assert student_client.delete(f'/api/ai-companion/conversations/{conversation.id}/').status_code == 204


@pytest.mark.django_db
def test_student_cannot_use_unenrolled_subject(student_client, teacher_user):
    subject = Subject.objects.create(name='Private course', published=True, created_by=teacher_user)
    response = student_client.post('/api/ai-companion/chat/', {
        'message': 'Help me with this course.', 'subject_id': subject.id,
    }, format='json')
    assert response.status_code == 404


@pytest.mark.django_db
def test_provider_failure_falls_back_without_exposing_provider_details(student_client, monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'test-key')
    with patch('users.ai_companion._provider_reply', side_effect=requests.Timeout()):
        response = student_client.post('/api/ai-companion/chat/', {'message': 'Explain this topic.'}, format='json')
    assert response.status_code == 200
    assert 'Live AI is temporarily unavailable' in response.data['message']['content']
    assert 'test-key' not in response.data['message']['content']
