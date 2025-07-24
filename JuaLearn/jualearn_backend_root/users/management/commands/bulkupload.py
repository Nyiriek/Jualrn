import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model
from users.models import Subject, Lesson, Quiz, QuizQuestion, QuizChoice

User = get_user_model()

class Command(BaseCommand):
    help = 'Bulk upload subjects, lessons, quizzes from JSON files'

    def handle(self, *args, **options):
        base_path = getattr(settings, 'CONTENT_FOLDER', None)
        if not base_path:
            self.stdout.write(self.style.ERROR('CONTENT_FOLDER not set in settings'))
            return

        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('No superuser found. Please create a superuser first.'))
            return
        admin_id = admin_user.id

        try:
            with open(os.path.join(base_path, 'subjects.json'), 'r') as f:
                subjects_data = json.load(f)
            with open(os.path.join(base_path, 'lessons.json'), 'r') as f:
                lessons_data = json.load(f)
            with open(os.path.join(base_path, 'quizzes.json'), 'r') as f:
                quizzes_data = json.load(f)

            created_subjects = {}

            for subj in subjects_data:
                subject_obj, created = Subject.objects.get_or_create(
                    name=subj['name'],
                    defaults={
                        'description': subj.get('description', ''),
                        'created_by_id': admin_id,
                    }
                )
                created_subjects[subj['name']] = subject_obj
                self.stdout.write(self.style.SUCCESS(f"Subject: {subject_obj.name} {'created' if created else 'exists'}"))

            for lesson in lessons_data:
                subj_obj = created_subjects.get(lesson['subjectName'])
                if subj_obj is None:
                    self.stdout.write(self.style.ERROR(f"Subject not found for lesson: {lesson['title']} with subjectName: {lesson['subjectName']}"))
                    continue
                lesson_obj, created = Lesson.objects.get_or_create(
                    subject=subj_obj,
                    title=lesson['title'],
                    defaults={'content': lesson['content'], 'created_by_id': admin_id}
                )
                self.stdout.write(self.style.SUCCESS(f"Lesson: {lesson_obj.title} {'created' if created else 'exists'}"))

            for quiz in quizzes_data:
                subj_obj = created_subjects.get(quiz['subjectName'])
                if subj_obj is None:
                    self.stdout.write(self.style.ERROR(f"Subject not found for quiz: {quiz['title']} with subjectName: {quiz['subjectName']}"))
                    continue

                quiz_obj, created = Quiz.objects.get_or_create(
                    title=quiz['title'],
                    subject=subj_obj,
                    defaults={
                        'description': quiz.get('description', ''),
                        'due_date': quiz.get('due_date'),
                        'created_by_id': admin_id,
                    }
                )
                if not created:
                    quiz_obj.questions.all().delete()

                self.stdout.write(self.style.SUCCESS(f"Quiz: {quiz_obj.title} {'created' if created else 'exists'}"))

                for q in quiz.get('questions', []):
                    question_obj = QuizQuestion.objects.create(
                        quiz=quiz_obj,
                        text=q['text'],
                        type=q.get('type', 'multiple-choice'),
                    )
                    for choice in q.get('choices', []):
                        QuizChoice.objects.create(
                            question=question_obj,
                            text=choice['text'],
                            is_correct=choice.get('is_correct', False),
                        )
                    self.stdout.write(self.style.SUCCESS(f"  Question: {q['text']} created"))

            self.stdout.write(self.style.SUCCESS('Bulk upload complete!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Bulk upload failed: {e}'))
