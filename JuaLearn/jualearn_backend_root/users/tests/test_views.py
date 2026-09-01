import pytest
import json
from io import BytesIO
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from PIL import Image
from users.models import Assignment, Enrollment, LearningResource, Notification, Quiz, QuizChoice, QuizQuestion
from users.utils import grade_quiz

@pytest.mark.django_db
def test_student_list_view(teacher_client, admin_client):
    url = reverse('students-list')
    response = teacher_client.get(url)
    assert response.status_code == 200, response.data
    response = admin_client.get(url)
    assert response.status_code == 200


@pytest.mark.django_db
def test_user_profile_picture_is_saved_and_returned_on_reload(student_user):
    client = APIClient()
    client.force_authenticate(user=student_user)
    image_bytes = BytesIO()
    Image.new('RGB', (2, 2), color='navy').save(image_bytes, format='PNG')
    image = SimpleUploadedFile('avatar.png', image_bytes.getvalue(), content_type='image/png')
    response = client.patch(reverse('my-profile'), {'profile_picture': image}, format='multipart')

    assert response.status_code == 200, response.data
    assert response.data['profile_picture']
    reload_response = client.get(reverse('my-profile'))
    assert reload_response.status_code == 200
    assert reload_response.data['profile_picture'] == response.data['profile_picture']

    login_response = client.post('/api/token/', {'username': student_user.username, 'password': 'testpass123'}, format='json')
    assert login_response.status_code == 200, login_response.data
    assert response.data['profile_picture'].endswith(login_response.data['profilePicture'])

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
def test_teacher_course_publication_notifies_administrators(teacher_client, teacher_user, subject):
    admin = get_user_model().objects.create_user(username='admin-course', password='testpass123', role='admin')
    student = get_user_model().objects.create_user(username='student-course', password='testpass123', role='student')
    response = teacher_client.post(reverse('subject-publish', kwargs={'pk': subject.id}))
    assert response.status_code == 200
    notification = Notification.objects.get(recipient=admin, type='teacher_course_published')
    assert subject.name in notification.title
    assert teacher_user.username in notification.message
    student_notification = Notification.objects.get(recipient=student, type='subject_published')
    assert teacher_user.username in student_notification.message

    student_client = APIClient()
    student_client.force_authenticate(user=student)
    course_response = student_client.get(reverse('subject-detail', kwargs={'pk': subject.id}))
    assert course_response.status_code == 200
    assert course_response.data['teacher_name'] == teacher_user.username


@pytest.mark.django_db
def test_admin_can_upload_a_course_package_with_connected_content():
    package = {
        'courses': [{
            'name': 'Uploaded Biology',
            'description': 'A complete uploaded course.',
            'content': 'Course overview.',
            'published': True,
            'resources': [{
                'title': 'Cell reading', 'topic': 'Cells', 'resource_type': 'reading',
                'content': 'Cell content.',
            }],
            'lessons': [{'title': 'Cell structure', 'content': 'Lesson content.'}],
            'quizzes': [{
                'title': 'Cells check', 'due_date': '2026-12-31', 'published': True,
                'questions': [{'text': 'What controls a cell?', 'type': 'multiple-choice', 'choices': [
                    {'text': 'Nucleus', 'is_correct': True}, {'text': 'Wall', 'is_correct': False},
                ]}],
            }],
            'assignments': [{'title': 'Cells assignment', 'description': 'Explain a cell.', 'due_date': '2026-12-31'}],
        }],
    }
    upload = SimpleUploadedFile('course-package.json', json.dumps(package).encode(), content_type='application/json')
    admin = get_user_model().objects.create_user(username='course-admin', password='testpass123', role='admin')
    client = APIClient()
    client.force_authenticate(user=admin)
    response = client.post(reverse('bulk-upload'), {'file': upload}, format='multipart')

    assert response.status_code == 201
    from users.models import Subject, Lesson
    subject = Subject.objects.get(name='Uploaded Biology')
    assert subject.published is True
    assert subject.resources.filter(title='Cell reading').exists()
    assert Lesson.objects.filter(subject=subject, title='Cell structure').exists()
    quiz = Quiz.objects.get(subject=subject, title='Cells check')
    assert quiz.questions.count() == 1
    assert QuizChoice.objects.filter(question__quiz=quiz, is_correct=True).exists()
    assert Assignment.objects.filter(subject=subject, title='Cells assignment').exists()

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


@pytest.mark.django_db
def test_teacher_can_generate_questions_from_course_content(teacher_client, subject):
    resource = LearningResource.objects.create(
        title='Unit guide',
        description='Explain energy changes in reactions.',
        content='Unit lesson guide\nFocus: energy changes in chemical reactions.\nTopics: exothermic reactions, endothermic reactions.\nLearning activities: interpret an energy profile diagram.',
        created_by=subject.created_by,
    )
    subject.resources.add(resource)
    quiz = Quiz.objects.create(
        title='Energy check', subject=subject, created_by=subject.created_by, due_date='2026-12-31'
    )
    response = teacher_client.post(
        reverse('quiz-generate-from-course', kwargs={'pk': quiz.id}), {'limit': 3}, format='json'
    )
    assert response.status_code == 201
    assert len(response.data['questions']) == 3
    assert any(question['type'] == 'short-answer' for question in response.data['questions'])
    assert any(question['choices'] for question in response.data['questions'])


@pytest.mark.django_db
def test_teacher_can_add_a_questionnaire_question_with_answer_repository(teacher_client, teacher_user, subject):
    quiz = Quiz.objects.create(title='Written reflection', subject=subject, created_by=teacher_user, due_date='2026-12-31')
    response = teacher_client.post(
        f'/api/quizzes/{quiz.id}/questions/',
        {'text': 'Explain why the result changed.', 'type': 'short-answer', 'answer_key': 'Because the conditions changed.'},
        format='json',
    )
    assert response.status_code == 201
    assert response.data['type'] == 'short-answer'
    assert response.data['answer_key'] == 'Because the conditions changed.'


@pytest.mark.django_db
def test_teacher_can_generate_assignment_from_course_content(teacher_client, subject):
    resource = LearningResource.objects.create(
        title='Unit guide',
        description='Explain energy changes in reactions.',
        content='Unit lesson guide\nFocus: energy changes in chemical reactions.\nTopics: exothermic reactions, endothermic reactions.\nLearning activities: interpret an energy profile diagram.',
        created_by=subject.created_by,
    )
    subject.resources.add(resource)
    response = teacher_client.post(
        reverse('assignments-generate-from-course'), {'subject_id': subject.id}, format='json'
    )
    assert response.status_code == 200
    assert 'Unit guide' in response.data['title']
    assert 'Learning goal:' in response.data['description']


@pytest.mark.django_db
def test_automatic_quiz_grading_uses_choice_and_written_answer_key(teacher_user, student_user, subject):
    quiz = Quiz.objects.create(
        title='Auto-marked quiz', subject=subject, created_by=teacher_user, due_date='2026-12-31'
    )
    multiple_choice = QuizQuestion.objects.create(quiz=quiz, text='Choose the correct option.')
    correct_choice = QuizChoice.objects.create(question=multiple_choice, text='Correct', is_correct=True)
    written = QuizQuestion.objects.create(
        quiz=quiz,
        text='Write the key idea.',
        type='short-answer',
        answer_key='Energy changes in chemical reactions\nEnergy change',
    )

    result = grade_quiz(student_user, quiz, [
        {'question_id': multiple_choice.id, 'choice_id': correct_choice.id},
        {'question_id': written.id, 'answer_text': 'Energy changes in chemical reactions'},
    ])

    assert result.grade == 100
    assert result.pending_review_count == 0
    assert all(answer['is_correct'] for answer in result.answer_results)

    wrong_result = grade_quiz(student_user, quiz, [
        {'question_id': multiple_choice.id, 'choice_id': None},
        {'question_id': written.id, 'answer_text': 'An unrelated answer'},
    ])
    assert wrong_result.grade == 0
    assert not any(answer['is_correct'] for answer in wrong_result.answer_results)


@pytest.mark.django_db
def test_student_only_receives_correctness_after_quiz_submission(teacher_user, student_user, subject):
    Enrollment.objects.create(student=student_user, subject=subject)
    quiz = Quiz.objects.create(
        title='Private answer key', subject=subject, created_by=teacher_user,
        due_date='2026-12-31', published=True,
    )
    question = QuizQuestion.objects.create(
        quiz=quiz, text='Write the key phrase.', type='short-answer', answer_key='Correct phrase'
    )
    choice_question = QuizQuestion.objects.create(quiz=quiz, text='Choose correctly.')
    correct_choice = QuizChoice.objects.create(question=choice_question, text='Correct', is_correct=True)
    QuizChoice.objects.create(question=choice_question, text='Wrong', is_correct=False)
    client = APIClient()
    client.force_authenticate(user=student_user)

    question_response = client.get(f'/api/quizzes/{quiz.id}/questions/')
    assert question_response.status_code == 200
    assert 'answer_key' not in question_response.data[0]
    assert 'is_correct' not in question_response.data[1]['choices'][0]

    submit_response = client.post(f'/api/quizzes/{quiz.id}/submit/', {
        'answers': [
            {'question_id': question.id, 'answer_text': 'Wrong phrase'},
            {'question_id': choice_question.id, 'choice_id': correct_choice.id},
        ],
    }, format='json')
    assert submit_response.status_code == 200
    assert submit_response.data['grade'] == 50
    assert submit_response.data['answer_results'][0]['is_correct'] is False
    assert submit_response.data['answer_results'][1]['is_correct'] is True

    grade_response = client.get('/api/student/grades/quizzes/')
    assert grade_response.status_code == 200
    assert grade_response.data[0]['title'] == 'Private answer key'
    assert grade_response.data[0]['subject']['name'] == 'Mathematics'
    assert grade_response.data[0]['due_date'] == '2026-12-31'


@pytest.mark.django_db
def test_teacher_gradebook_shows_and_can_override_submitted_quiz(teacher_client, teacher_user, student_user, subject):
    quiz = Quiz.objects.create(
        title='Teacher gradebook quiz', subject=subject, created_by=teacher_user, due_date='2026-12-31'
    )
    question = QuizQuestion.objects.create(quiz=quiz, text='Choose correctly.')
    correct_choice = QuizChoice.objects.create(question=question, text='Correct', is_correct=True)
    result = grade_quiz(student_user, quiz, [{'question_id': question.id, 'choice_id': correct_choice.id}])

    response = teacher_client.get('/api/quiz-results/gradebook/')
    assert response.status_code == 200
    assert response.data[0]['id'] == result.id
    assert response.data[0]['grade'] == 100
    assert response.data[0]['student']['full_name'] == ''

    override_response = teacher_client.patch(
        f'/api/quiz-results/{result.id}/override-grade/', {'grade': 85}, format='json'
    )
    assert override_response.status_code == 200
    assert override_response.data['grade'] == 85
    assert override_response.data['is_teacher_adjusted'] is True


@pytest.mark.django_db
def test_teacher_can_grade_submitted_assignment_and_student_receives_final_grade(teacher_client, teacher_user, student_user, subject):
    assignment = Assignment.objects.create(
        title='Written work', subject=subject, created_by=teacher_user, assigned_to=student_user,
        due_date='2026-12-31', published=True, submission_text='Student response', submitted_at=timezone.now(),
    )
    response = teacher_client.patch(
        f'/api/assignments/{assignment.id}/grade-submission/', {'grade': 72}, format='json'
    )
    assert response.status_code == 200
    assert response.data['grade'] == 72
    assignment.refresh_from_db()
    assert assignment.grade == 72


@pytest.mark.django_db
def test_students_can_share_forum_posts_and_replies(student_user):
    first_student = APIClient()
    first_student.force_authenticate(user=student_user)
    post_response = first_student.post('/api/forum-posts/', {
        'title': 'How do I solve this equation?',
        'body': 'Can someone explain the first step?',
        'post_type': 'question',
    }, format='json')
    assert post_response.status_code == 201

    second_student = get_user_model().objects.create_user(
        username='student2', password='testpass123', role='student', first_name='Second'
    )
    second_client = APIClient()
    second_client.force_authenticate(user=second_student)
    reply_response = second_client.post('/api/forum-comments/', {
        'post': post_response.data['id'], 'body': 'Start by collecting the like terms.',
    }, format='json')
    assert reply_response.status_code == 201

    forum_response = first_student.get('/api/forum-posts/')
    assert forum_response.status_code == 200
    assert forum_response.data[0]['author']['display_name'] == 'student1'
    assert forum_response.data[0]['comments'][0]['body'] == 'Start by collecting the like terms.'
    assert forum_response.data[0]['comments'][0]['author']['display_name'] == 'Second'

    feedback_response = first_student.post('/api/feedback-posts/', {
        'title': 'Add more practice examples',
        'body': 'Extra worked examples would help before each quiz.',
        'feedback_type': 'suggestion',
    }, format='json')
    assert feedback_response.status_code == 201
    assert first_student.get('/api/forum-posts/').data[0]['title'] == 'How do I solve this equation?'
    assert first_student.get('/api/feedback-posts/').data[0]['title'] == 'Add more practice examples'
