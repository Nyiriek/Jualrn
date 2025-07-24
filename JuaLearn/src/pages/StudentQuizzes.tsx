import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Button, List, ListItem, ListItemText, CircularProgress, Alert, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

type Quiz = {
  id: number;
  title: string;
  subject: { id: number; name: string };
  due_date: string;
  published: boolean;
  // optionally track if submitted, for now false by default
  submitted?: boolean;
};

const StudentQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingQuizId, setSubmittingQuizId] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/student/quizzes/');
        const publishedQuizzes = response.data.filter((q: Quiz) => q.published);
        // Assuming response might include submitted status, otherwise set false
        setQuizzes(publishedQuizzes.map((q: Quiz) => ({ ...q, submitted: false })));
        setError(null);
      } catch {
        setError('Failed to load quizzes.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleSubmitQuiz = async (quizId: number) => {
    setSubmittingQuizId(quizId);
    try {
      await axios.post(`/quizzes/${quizId}/submit/`, { answers: [] });
      alert('Quiz submitted successfully! The teacher will grade it soon.');
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quizId ? { ...q, submitted: true } : q
        )
      );
    } catch {
      alert('Failed to submit quiz.');
    } finally {
      setSubmittingQuizId(null);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <List>
      {quizzes.length === 0 && <p>No published quizzes available.</p>}
      {quizzes.map((quiz) => (
        <ListItem key={quiz.id} divider
          secondaryAction={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
              >
                Take Quiz
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSubmitQuiz(quiz.id)}
                disabled={submittingQuizId === quiz.id || quiz.submitted}
              >
                {submittingQuizId === quiz.id ? 'Submitting...' : quiz.submitted ? 'Submitted' : 'Submit'}
              </Button>
            </Stack>
          }
        >
          <ListItemText
            primary={quiz.title}
            secondary={`Subject: ${quiz.subject.name} | Due: ${new Date(quiz.due_date).toLocaleDateString()}`}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default StudentQuizzes;
