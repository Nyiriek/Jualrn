import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios from '../api/axios';

interface Choice {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  choices: Choice[];
  type: string;
}

const StudentQuizInteractive: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/quizzes/${id}/questions/`);
        setQuestions(res.data);
        setError(null);
      } catch (e) {
        setError('Failed to load quiz questions.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [id]);

  const handleAnswerChange = (questionId: number, choiceId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      setError('Please answer all questions.');
      return;
    }
    setError(null);

    const payload = {
      answers: Object.entries(answers).map(([qId, choiceId]) => ({
        question: Number(qId),
        selected_choice: choiceId,
      })),
    };

    try {
      const res = await axios.post(`/quizzes/${id}/submit/`, payload);
      setScore(res.data.grade);
      setSubmitted(true);
    } catch {
      setError('Failed to submit quiz.');
    }
  };

  if (loading) return <CircularProgress />;

  if (error) return <Alert severity="error">{error}</Alert>;

  if (submitted)
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Quiz Completed
        </Typography>
        <Typography>Your score: {score}%</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/student/quizzes')}>
          Back to Quizzes
        </Button>
      </Box>
    );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quiz
      </Typography>
      {questions.map((q) => (
        <Box key={q.id} sx={{ mb: 3 }}>
          <Typography sx={{ mb: 1 }}>{q.text}</Typography>
          <RadioGroup
            value={answers[q.id] || ''}
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
        </Box>
      ))}
      <Button variant="contained" onClick={handleSubmit}>
        Submit Quiz
      </Button>
    </Box>
  );
};

export default StudentQuizInteractive;
