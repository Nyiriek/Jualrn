import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axios';
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

type Subject = { id: number; name: string };
type AssignmentGrade = { id: number; title: string; subject?: Subject | null; grade: number; due_date: string };
type QuizGrade = { id: number; title: string; subject?: Subject | null; grade: number; due_date: string; submitted_at?: string };

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : 'No due date';
const gradeColor = (grade: number) => grade >= 70 ? 'success' : grade >= 50 ? 'warning' : 'error';

const GradeTable = ({ rows, kind }: { rows: Array<AssignmentGrade | QuizGrade>; kind: string }) => rows.length === 0 ? <Box sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary">No {kind.toLowerCase()} grades yet.</Typography></Box> : <TableContainer component={Paper} elevation={0} sx={{ borderTop: 1, borderColor: 'divider', overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 620 }}><TableHead><TableRow><TableCell>Title</TableCell><TableCell>Subject</TableCell><TableCell>Due date</TableCell><TableCell align="right">Grade</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.id} hover><TableCell><Typography fontWeight={600}>{row.title || `${kind} assessment`}</Typography></TableCell><TableCell>{row.subject?.name || 'Course not recorded'}</TableCell><TableCell>{formatDate(row.due_date)}</TableCell><TableCell align="right"><Chip size="small" color={gradeColor(row.grade)} label={`${row.grade}%`} /></TableCell></TableRow>)}</TableBody></Table></TableContainer>;

const StudentGrades: React.FC = () => {
  const [assignmentGrades, setAssignmentGrades] = useState<AssignmentGrade[]>([]);
  const [quizGrades, setQuizGrades] = useState<QuizGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([axios.get('/student/grades/assignments/'), axios.get('/student/grades/quizzes/')])
      .then(([assignmentResponse, quizResponse]) => { setAssignmentGrades(assignmentResponse.data); setQuizGrades(quizResponse.data); setError(null); })
      .catch(() => setError('Failed to load grades.'))
      .finally(() => setLoading(false));
  }, []);

  const allGrades = useMemo(() => [...assignmentGrades, ...quizGrades].map((item) => item.grade), [assignmentGrades, quizGrades]);
  const average = allGrades.length ? Math.round(allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) : null;
  if (loading) return <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return <Box sx={{ maxWidth: 1120, mx: 'auto', pb: 4 }}>
    <Card sx={{ mb: 3, border: 1, borderColor: 'divider' }}><CardContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'action.hover' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5}><Box><Typography variant="h4" sx={{ fontSize: { xs: '1.7rem', sm: '2.125rem' } }}>My grades</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>See your results for assignments and quizzes in one place.</Typography></Box><Stack direction="row" flexWrap="wrap" gap={.75}><Chip variant="outlined" label={`${assignmentGrades.length} assignments`} /><Chip color="primary" variant="outlined" label={`${quizGrades.length} quizzes`} />{average !== null && <Chip color={gradeColor(average)} label={`${average}% overall`} />}</Stack></Stack></CardContent></Card>
    <Card variant="outlined" sx={{ mb: 3 }}><CardContent sx={{ p: 0 }}><Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2 }}><Typography variant="h6">Quiz grades</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Scores are available after you submit a quiz.</Typography></Box><GradeTable rows={quizGrades} kind="Quiz" /></CardContent></Card>
    <Card variant="outlined"><CardContent sx={{ p: 0 }}><Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2 }}><Typography variant="h6">Assignment grades</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Teacher-marked assignment results appear here.</Typography></Box><GradeTable rows={assignmentGrades} kind="Assignment" /></CardContent></Card>
  </Box>;
};

export default StudentGrades;
