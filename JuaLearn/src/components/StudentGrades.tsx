import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Box, Typography, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Alert } from '@mui/material';

type AssignmentGrade = {
  id: number;
  title: string;
  subject: { id: number; name: string };
  grade: number;
  due_date: string;
};

type QuizGrade = {
  id: number;
  title: string;
  subject: { id: number; name: string };
  grade: number;
  due_date: string;
};

const StudentGrades: React.FC = () => {
  const [assignmentGrades, setAssignmentGrades] = useState<AssignmentGrade[]>([]);
  const [quizGrades, setQuizGrades] = useState<QuizGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGrades() {
      try {
        const [assignRes, quizRes] = await Promise.all([
          axios.get('/student/grades/assignments/'),
          axios.get('/student/grades/quizzes/')
        ]);
        setAssignmentGrades(assignRes.data);
        setQuizGrades(quizRes.data);
        setError(null);
      } catch (e) {
        setError('Failed to load grades.');
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Assignment Grades</Typography>
      {assignmentGrades.length === 0 ? (
        <Typography>No assignment grades yet.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Grade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignmentGrades.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.title}</TableCell>
                <TableCell>{a.subject.name}</TableCell>
                <TableCell>{a.due_date}</TableCell>
                <TableCell>{a.grade}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>Quiz Grades</Typography>
      {quizGrades.length === 0 ? (
        <Typography>No quiz grades yet.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Grade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizGrades.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.title}</TableCell>
                <TableCell>{q.subject.name}</TableCell>
                <TableCell>{q.due_date}</TableCell>
                <TableCell>{q.grade}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default StudentGrades;
