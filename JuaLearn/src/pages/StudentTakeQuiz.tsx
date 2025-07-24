import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import {
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
} from "@mui/material";

type Choice = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  text: string;
  choices: Choice[];
};

const StudentTakeQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> choiceId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/quizzes/${quizId}/questions/`);
        setQuestions(res.data);
        setError(null);
      } catch {
        setError("Failed to load quiz questions.");
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchQuestions();
  }, [quizId]);

  const handleAnswerChange = (questionId: number, choiceId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, cId]) => ({
        question_id: Number(qId),
        choice_id: cId,
      }));

      const res = await axios.post(`/quizzes/${quizId}/submit/`, {
        answers: formattedAnswers,
      });
      setResult(res.data.grade);
    } catch {
      setError("Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  if (result !== null) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quiz Submitted
        </Typography>
        <Typography>Your score: {result}%</Typography>
        <Button variant="contained" onClick={() => navigate("/student/quizzes")}>
          Back to Quizzes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Take Quiz
      </Typography>
      {questions.map((q) => (
        <Box key={q.id} sx={{ mb: 3 }}>
          <Typography variant="h6">{q.text}</Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswerChange(q.id, Number(e.target.value))}
            >
              {q.choices.map((choice) => (
                <FormControlLabel
                  key={choice.id}
                  value={choice.id}
                  control={<Radio />}
                  label={choice.text}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      ))}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={submitting || Object.keys(answers).length !== questions.length}
      >
        {submitting ? "Submitting..." : "Submit Quiz"}
      </Button>
    </Box>
  );
};

export default StudentTakeQuiz;
