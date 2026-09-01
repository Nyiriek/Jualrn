import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axios';
import { Alert, Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { useNavigate } from 'react-router-dom';

type Quiz = {
  id: number;
  title: string;
  description?: string;
  subject: { id: number; name: string };
  due_date: string;
  created_at: string;
  published: boolean;
  submitted?: boolean;
  student_result?: { grade: number; submitted_at: string } | null;
};

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not recorded';

const dueStatus = (dueDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: 'Past due', color: 'error' as const };
  if (days === 0) return { label: 'Due today', color: 'warning' as const };
  if (days === 1) return { label: 'Due tomorrow', color: 'warning' as const };
  return { label: `${days} days left`, color: 'success' as const };
};

const StudentQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/student/quizzes/');
        setQuizzes(response.data.filter((quiz: Quiz) => quiz.published));
        setError(null);
      } catch {
        setError('Failed to load quizzes. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const upcomingCount = useMemo(() => quizzes.filter((quiz) => dueStatus(quiz.due_date).color !== 'error').length, [quizzes]);
  const completedCount = useMemo(() => quizzes.filter((quiz) => quiz.student_result?.grade !== undefined).length, [quizzes]);

  if (loading) return <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ maxWidth: 1120, mx: 'auto', py: 2 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', pb: 4 }}>
      <Card sx={{ mb: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'action.hover' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={2}>
            <Box><Stack direction="row" alignItems="center" spacing={1}><Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}><QuizOutlinedIcon /></Box><Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', sm: '2.125rem' } }}>Your quizzes</Typography></Stack><Typography color="text.secondary" sx={{ mt: 1 }}>Review each assessment, answer every question, and submit when you are ready.</Typography></Box>
            <Stack direction="row" flexWrap="wrap" gap={0.75}><Chip label={`${quizzes.length} available`} color="primary" variant="outlined" /><Chip label={`${upcomingCount} upcoming`} variant="outlined" />{completedCount > 0 && <Chip label={`${completedCount} scored`} color="success" variant="outlined" />}</Stack>
          </Stack>
        </CardContent>
      </Card>

      {quizzes.length === 0 ? <Card variant="outlined"><CardContent sx={{ minHeight: 260, display: 'grid', placeItems: 'center', textAlign: 'center' }}><Box><QuizOutlinedIcon color="primary" sx={{ fontSize: 44 }} /><Typography variant="h6" sx={{ mt: 1 }}>No quizzes available</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Published quizzes from your enrolled courses will appear here.</Typography></Box></CardContent></Card> : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
          {quizzes.map((quiz) => {
            const status = dueStatus(quiz.due_date);
            return <Card key={quiz.id} variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderTop: 4, borderTopColor: `${status.color}.main` }}>
              <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{quiz.title}</Typography><Chip size="small" color={status.color} label={status.label} /></Stack>
                <Chip size="small" color="primary" variant="outlined" label={quiz.subject.name} sx={{ mt: 1.25 }} />
                {quiz.student_result && <Chip size="small" color="success" label={`Score: ${quiz.student_result.grade}%`} sx={{ mt: 1.25, ml: .75 }} />}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, minHeight: '2.7em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description || 'Complete this assessment to practise and demonstrate what you have learned.'}</Typography>
                <Box sx={{ mt: 2, p: 1.25, borderRadius: 1.5, bgcolor: 'action.hover', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}><Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2" fontWeight={600}>{formatDate(quiz.created_at)}</Typography></Box><Box><Stack direction="row" spacing={.5} alignItems="center"><ScheduleOutlinedIcon fontSize="inherit" color="action" /><Typography variant="caption" color="text.secondary">Due</Typography></Stack><Typography variant="body2" fontWeight={600}>{formatDate(quiz.due_date)}</Typography></Box></Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}><Button fullWidth variant="contained" onClick={() => navigate(`/student/quizzes/${quiz.id}/take`)}>{quiz.student_result ? 'Review / retake quiz' : 'Open quiz'}</Button></CardActions>
            </Card>;
          })}
        </Box>
      )}
    </Box>
  );
};

export default StudentQuizzes;
