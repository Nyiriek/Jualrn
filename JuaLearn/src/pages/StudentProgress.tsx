import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, LinearProgress, Paper, Typography } from "@mui/material";
import api from "../api/axios";

type Enrollment = { subject: { id: number; name: string } };
type QuizResult = { quiz: string; grade: number };
type Assignment = { subject: { name: string }; grade: number | null };

const StudentProgress = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/student/enrollments/"), api.get("/student/grades/quizzes/"), api.get("/student/grades/assignments/")])
      .then(([enrollmentResponse, quizResponse, assignmentResponse]) => {
        setEnrollments(enrollmentResponse.data);
        setQuizResults(quizResponse.data);
        setAssignments(assignmentResponse.data);
      })
      .catch(() => setError("Progress could not be loaded. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  if (loading) return <Box sx={{ p: 3 }}><CircularProgress /></Box>;

  return <Box sx={{ p: 3, maxWidth: 720 }}>
    <Typography variant="h4" gutterBottom>Progress tracker</Typography>
    {enrollments.map(({ subject }) => {
      const courseGrades = assignments.filter((item) => item.subject.name === subject.name).map((item) => item.grade).filter((grade): grade is number => grade !== null);
      const average = courseGrades.length ? Math.round(courseGrades.reduce((sum, grade) => sum + grade, 0) / courseGrades.length) : 0;
      return <Paper key={subject.id} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">{subject.name}</Typography>
        <LinearProgress variant="determinate" value={average} sx={{ height: 10, borderRadius: 5, my: 1 }} />
        <Typography variant="body2" color="text.secondary">{courseGrades.length ? `Assignment average: ${average}%` : "Complete an assignment to see your progress."}</Typography>
      </Paper>;
    })}
    <Typography variant="h6" sx={{ mt: 3 }}>Quiz results</Typography>
    {quizResults.length ? quizResults.map((result, index) => <Typography key={`${result.quiz}-${index}`}>{result.quiz}: {result.grade}%</Typography>) : <Typography color="text.secondary">No quiz results yet.</Typography>}
  </Box>;
};

export default StudentProgress;
