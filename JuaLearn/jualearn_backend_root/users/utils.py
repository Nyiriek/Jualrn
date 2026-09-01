import re

from django.utils import timezone

from .models import QuizChoice, QuizQuestion, QuizResult, StudentAnswer


def normalise_answer(value):
    """Make answer-key matching case and punctuation insensitive."""
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', (value or '').casefold())).strip()


def matches_answer_key(answer, answer_key):
    submitted = normalise_answer(answer)
    accepted_answers = [normalise_answer(item) for item in (answer_key or '').splitlines()]
    accepted_answers = [item for item in accepted_answers if item]
    if not submitted or not accepted_answers:
        return False

    return submitted in accepted_answers


def grade_quiz(student, quiz, answers):
    """Save answers and calculate the automatic score from the quiz answer key."""
    questions = list(quiz.questions.prefetch_related('choices'))
    answer_by_question = {
        item.get('question_id'): item
        for item in answers
        if isinstance(item, dict) and item.get('question_id')
    }
    correct_count = 0
    total_questions = len(questions)
    pending_review_count = 0
    answer_results = []

    for question in questions:
        answer = answer_by_question.get(question.id, {})
        if question.type == 'short-answer':
            answer_text = str(answer.get('answer_text', '')).strip()
            StudentAnswer.objects.update_or_create(
                student=student,
                question=question,
                defaults={'selected_choice': None, 'answer_text': answer_text},
            )
            if question.answer_key.strip():
                is_correct = matches_answer_key(answer_text, question.answer_key)
                if is_correct:
                    correct_count += 1
            else:
                pending_review_count += 1
                is_correct = False
            answer_results.append({
                'question_id': question.id,
                'question_text': question.text,
                'answer_text': answer_text,
                'correct_answer': question.answer_key,
                'is_correct': is_correct,
                'needs_review': not bool(question.answer_key.strip()),
            })
            continue

        choice = None
        try:
            choice = question.choices.get(id=answer.get('choice_id'))
        except (QuizChoice.DoesNotExist, TypeError, ValueError):
            pass
        StudentAnswer.objects.update_or_create(
            student=student,
            question=question,
            defaults={'selected_choice': choice, 'answer_text': ''},
        )
        is_correct = bool(choice and choice.is_correct)
        if is_correct:
            correct_count += 1
        correct_choices = list(question.choices.filter(is_correct=True).values_list('text', flat=True))
        answer_results.append({
            'question_id': question.id,
            'question_text': question.text,
            'answer_text': choice.text if choice else '',
            'correct_answer': ' / '.join(correct_choices),
            'is_correct': is_correct,
            'needs_review': False,
        })

    grade = int((correct_count / total_questions) * 100) if total_questions else None
    quiz_result, _ = QuizResult.objects.update_or_create(
        student=student,
        quiz=quiz,
        defaults={
            'grade': grade,
            'submitted_at': timezone.now(),
            'is_teacher_adjusted': False,
        },
    )
    # This request-only detail keeps the persisted grade simple while letting the
    # API and UI explain when a teacher still needs to review an unkeyed response.
    quiz_result.pending_review_count = pending_review_count
    quiz_result.answer_results = answer_results
    return quiz_result
