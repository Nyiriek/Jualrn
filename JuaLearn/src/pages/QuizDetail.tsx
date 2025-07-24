import React from "react";
import { useParams } from "react-router-dom";
import QuizQuestions from "../components/QuizQuestions";
import QuizChoices from "../components/QuizChoices";

const QuizDetail = () => {
  const { quizId, questionId } = useParams<{ quizId: string; questionId?: string }>();

  return (
    <div>
      <h2>Quiz Questions</h2>
      <QuizQuestions quizId={Number(quizId)} />
      {questionId && <QuizChoices quizId={Number(quizId)} questionId={Number(questionId)} />}
    </div>
  );
};

export default QuizDetail;
