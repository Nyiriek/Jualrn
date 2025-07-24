from .models import QuizQuestion, QuizChoice, StudentAnswer, QuizResult

def grade_quiz(student, quiz, answers):
    total_questions = quiz.questions.count()
    correct_count = 0

    for ans in answers:
        try:
            question = QuizQuestion.objects.get(id=ans['question_id'], quiz=quiz)
            choice = QuizChoice.objects.get(id=ans['choice_id'], question=question)
            StudentAnswer.objects.create(
                student=student,
                question=question,
                selected_choice=choice
            )
            if choice.is_correct:
                correct_count += 1
        except (QuizQuestion.DoesNotExist, QuizChoice.DoesNotExist):
            continue

    grade = int((correct_count / total_questions) * 100) if total_questions else 0

    quiz_result, created = QuizResult.objects.update_or_create(
        student=student,
        quiz=quiz,
        defaults={'grade': grade}
    )
    return quiz_result
