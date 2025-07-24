import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_student_list_view(teacher_client, admin_client):
    url = reverse('students-list')
    response = teacher_client.get(url)
    assert response.status_code == 200
    response = admin_client.get(url)
    assert response.status_code == 200

@pytest.mark.django_db
def test_assignment_creation_and_publish(teacher_client, subject):
    create_url = reverse('assignments-list')
    data = {
        "title": "New Assignment",
        "subject": subject.id,
        "due_date": "2025-12-31"
    }
    # Create assignment
    response = teacher_client.post(create_url, data)
    assert response.status_code == 201
    assignment_id = response.data['id']

    # Publish assignment
    publish_url = reverse('assignments-publish', kwargs={'pk': assignment_id})
    response = teacher_client.post(publish_url)
    assert response.status_code == 200
    assert 'students notified' in response.data['detail'].lower()

@pytest.mark.django_db
def test_quiz_creation_and_publish(teacher_client, subject):
    create_url = reverse('quiz-list')
    data = {
        "title": "New Quiz",
        "subject": subject.id,
        "due_date": "2025-12-31"
    }
    # Create quiz
    response = teacher_client.post(create_url, data)
    assert response.status_code == 201
    quiz_id = response.data['id']

    # Publish quiz
    publish_url = reverse('quiz-publish', kwargs={'pk': quiz_id})
    response = teacher_client.post(publish_url)
    assert response.status_code == 200
    assert 'students notified' in response.data['detail'].lower()
