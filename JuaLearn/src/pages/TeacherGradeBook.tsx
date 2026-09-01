import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import axios from "../api/axios";

type AssignmentGrade = {
  id: number;
  student: string;
  title: string;
  course: string;
  grade: number | null;
  submittedAt?: string | null;
  submissionText?: string;
  description?: string;
};
type AnswerReview = { question_id: number; question_text: string; submitted_answer: string; correct_answer: string; is_correct: boolean };
type QuizGrade = {
  id: number;
  student: { full_name: string; email: string };
  quiz_title: string;
  course: string;
  grade: number;
  submitted_at: string;
  is_teacher_adjusted: boolean;
  answers: AnswerReview[];
};

const formatDate = (value?: string | null) => value
  ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
  : "Not submitted";

const TeacherGradeBook: React.FC = () => {
  const [assignmentGrades, setAssignmentGrades] = useState<AssignmentGrade[]>([]);
  const [quizGrades, setQuizGrades] = useState<QuizGrade[]>([]);
  const [quizEdits, setQuizEdits] = useState<Record<number, string>>({});
  const [selectedQuiz, setSelectedQuiz] = useState<QuizGrade | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentGrade | null>(null);
  const [assignmentGradeEdit, setAssignmentGradeEdit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGrades = async () => {
    setLoading(true);
    setError("");
    try {
      const [assignmentResponse, quizResponse] = await Promise.all([
        axios.get("/assignments/student_work/"),
        axios.get("/quiz-results/gradebook/"),
      ]);
      setAssignmentGrades(assignmentResponse.data.map((assignment: any) => ({
        id: assignment.id,
        student: assignment.assigned_to?.full_name || "Unassigned",
        title: assignment.title,
        course: assignment.subject.name,
        grade: assignment.grade,
        submittedAt: assignment.submitted_at,
        submissionText: assignment.submission_text,
        description: assignment.description,
      })));
      setQuizGrades(quizResponse.data);
    } catch {
      setError("The gradebook could not be loaded. Please refresh and try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchGrades(); }, []);

  const validGrade = (value: string) => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
  const openAssignmentReview = (assignment: AssignmentGrade) => {
    setSelectedAssignment(assignment);
    setAssignmentGradeEdit(assignment.grade == null ? "" : String(assignment.grade));
    setError("");
  };
  const saveAssignmentGrade = async () => {
    if (!selectedAssignment) return;
    if (!validGrade(assignmentGradeEdit)) return setError("Enter a whole-number grade from 0 to 100.");
    try {
      await axios.patch(`/assignments/${selectedAssignment.id}/grade-submission/`, { grade: Number(assignmentGradeEdit) });
      setSelectedAssignment(null);
      fetchGrades();
    } catch { setError("Failed to save the assignment grade."); }
  };
  const saveQuizGrade = async (id: number) => {
    const value = quizEdits[id];
    if (!validGrade(value)) return setError("Enter a whole-number grade from 0 to 100.");
    try {
      await axios.patch(`/quiz-results/${id}/override-grade/`, { grade: Number(value) });
      setQuizEdits((current) => { const next = { ...current }; delete next[id]; return next; });
      fetchGrades();
    } catch { setError("Failed to update the quiz score."); }
  };

  return <Box sx={{ maxWidth: 1280, mx: "auto", pb: 4 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 3 }}><Box><Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" } }}>Gradebook</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Review submitted work, automatic quiz scores, and adjust grades when needed.</Typography></Box><Button variant="outlined" onClick={fetchGrades} disabled={loading} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>{loading ? "Refreshing…" : "Refresh"}</Button></Stack>
    {!loading && <Stack direction="row" flexWrap="wrap" gap={.75} sx={{ mb: 2 }}><Chip variant="outlined" label={`${assignmentGrades.filter((item) => item.submittedAt).length} assignment submissions`} /><Chip color="primary" variant="outlined" label={`${quizGrades.length} quiz scores`} /><Chip color="success" variant="outlined" label={`${quizGrades.filter((item) => !item.is_teacher_adjusted).length} automatic`} /></Stack>}
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

    <Card variant="outlined" sx={{ mb: 3 }}><CardContent sx={{ p: 0 }}><Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2 }}><Typography variant="h6">Quiz results</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Scores appear here as soon as a student submits a quiz. Open the answer review before changing an automatic score.</Typography></Box><TableContainer component={Paper} elevation={0} sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto" }}><Table size="small" sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Student</TableCell><TableCell>Quiz</TableCell><TableCell>Course</TableCell><TableCell>Submitted</TableCell><TableCell>Score</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{loading ? <TableRow><TableCell colSpan={6}>Loading gradebook…</TableCell></TableRow> : quizGrades.length === 0 ? <TableRow><TableCell colSpan={6}>No quiz submissions yet.</TableCell></TableRow> : quizGrades.map((result) => <TableRow key={result.id}><TableCell>{result.student.full_name || result.student.email}</TableCell><TableCell>{result.quiz_title}</TableCell><TableCell>{result.course}</TableCell><TableCell>{formatDate(result.submitted_at)}</TableCell><TableCell>{quizEdits[result.id] !== undefined ? <TextField id={`quiz-grade-${result.id}`} name={`quiz_grade_${result.id}`} aria-label={`Score for ${result.quiz_title}`} size="small" value={quizEdits[result.id]} onChange={(event) => setQuizEdits((current) => ({ ...current, [result.id]: event.target.value }))} inputProps={{ inputMode: "numeric", min: 0, max: 100 }} /> : <Stack direction="row" spacing={.75} alignItems="center"><Typography fontWeight={700}>{result.grade}%</Typography>{result.is_teacher_adjusted && <Chip size="small" label="Adjusted" color="warning" />}</Stack>}</TableCell><TableCell align="right"><Stack direction="row" justifyContent="flex-end" spacing={.75}><Button size="small" onClick={() => setSelectedQuiz(result)}>Review answers</Button>{quizEdits[result.id] !== undefined ? <Button size="small" variant="contained" onClick={() => saveQuizGrade(result.id)}>Save</Button> : <Button size="small" variant="outlined" onClick={() => setQuizEdits((current) => ({ ...current, [result.id]: String(result.grade) }))}>Override</Button>}</Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>

    <Card variant="outlined"><CardContent sx={{ p: 0 }}><Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2 }}><Typography variant="h6">Assignment submissions</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Open a manual submission to review the response and record the final grade.</Typography></Box><TableContainer component={Paper} elevation={0} sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto" }}><Table size="small" sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Student</TableCell><TableCell>Assignment</TableCell><TableCell>Course</TableCell><TableCell>Submitted</TableCell><TableCell>Score</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{loading ? <TableRow><TableCell colSpan={6}>Loading gradebook…</TableCell></TableRow> : assignmentGrades.filter((item) => item.submittedAt).length === 0 ? <TableRow><TableCell colSpan={6}>No manual assignment submissions yet.</TableCell></TableRow> : assignmentGrades.filter((item) => item.submittedAt).map((assignment) => <TableRow key={assignment.id} hover><TableCell>{assignment.student}</TableCell><TableCell><Typography fontWeight={600}>{assignment.title}</Typography></TableCell><TableCell>{assignment.course}</TableCell><TableCell>{formatDate(assignment.submittedAt)}</TableCell><TableCell>{assignment.grade == null ? <Chip size="small" color="warning" label="Awaiting review" /> : <Stack direction="row" spacing={.75} alignItems="center"><Typography fontWeight={700}>{assignment.grade}%</Typography><Chip size="small" color="success" label="Final" /></Stack>}</TableCell><TableCell align="right"><Button size="small" variant={assignment.grade == null ? "contained" : "outlined"} onClick={() => openAssignmentReview(assignment)}>{assignment.grade == null ? "Review & grade" : "Review"}</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>

    <Dialog open={Boolean(selectedQuiz)} onClose={() => setSelectedQuiz(null)} fullWidth maxWidth="md"><DialogTitle>{selectedQuiz?.quiz_title} · answer review</DialogTitle><DialogContent dividers>{selectedQuiz && <><Typography color="text.secondary" sx={{ mb: 2 }}>{selectedQuiz.student.full_name || selectedQuiz.student.email} · {selectedQuiz.grade}%{selectedQuiz.is_teacher_adjusted ? " (teacher-adjusted)" : " (automatic score)"}</Typography>{selectedQuiz.answers.length === 0 ? <Alert severity="info">No submitted answers were recorded for this quiz.</Alert> : <Stack spacing={1.25}>{selectedQuiz.answers.map((answer, index) => <Box key={answer.question_id} sx={{ borderLeft: 4, borderLeftColor: answer.is_correct ? "success.main" : "error.main", border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={700}>Question {index + 1}</Typography><Chip size="small" color={answer.is_correct ? "success" : "error"} label={answer.is_correct ? "Correct" : "Incorrect"} /></Stack><Typography sx={{ mt: .75 }}>{answer.question_text}</Typography><Divider sx={{ my: 1 }} /><Typography variant="caption" color="text.secondary">Student answer</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{answer.submitted_answer || "No answer provided"}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>Correct answer</Typography><Typography color="success.dark" sx={{ whiteSpace: "pre-wrap" }}>{answer.correct_answer || "No answer key provided"}</Typography></Box>)}</Stack>}</>}</DialogContent><DialogActions><Button onClick={() => setSelectedQuiz(null)}>Close</Button></DialogActions></Dialog>
    <Dialog open={Boolean(selectedAssignment)} onClose={() => setSelectedAssignment(null)} fullWidth maxWidth="md"><DialogTitle>{selectedAssignment?.title} · submission review</DialogTitle><DialogContent dividers>{selectedAssignment && <Stack spacing={2}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}><Box><Typography fontWeight={600}>{selectedAssignment.student}</Typography><Typography variant="body2" color="text.secondary">{selectedAssignment.course} · submitted {formatDate(selectedAssignment.submittedAt)}</Typography></Box><Chip size="small" color={selectedAssignment.grade == null ? "warning" : "success"} label={selectedAssignment.grade == null ? "Awaiting review" : `Final grade: ${selectedAssignment.grade}%`} /></Stack><Box><Typography variant="subtitle2">Assignment instructions</Typography><Typography sx={{ mt: .5, whiteSpace: "pre-wrap" }}>{selectedAssignment.description || "No additional instructions were supplied."}</Typography></Box><Divider /><Box><Typography variant="subtitle2">Student response</Typography><Typography sx={{ mt: .75, whiteSpace: "pre-wrap" }}>{selectedAssignment.submissionText || "No written response was provided."}</Typography></Box><TextField id="gradebook-final-assignment-grade" name="gradebook_final_assignment_grade" label="Final grade (0–100)" type="number" required fullWidth value={assignmentGradeEdit} onChange={(event) => setAssignmentGradeEdit(event.target.value)} inputProps={{ min: 0, max: 100, step: 1 }} helperText="The final grade is visible to the learner on their dashboard and Grades page." /></Stack>}</DialogContent><DialogActions><Button onClick={() => setSelectedAssignment(null)}>Cancel</Button><Button variant="contained" onClick={saveAssignmentGrade}>Save final grade</Button></DialogActions></Dialog>
  </Box>;
};

export default TeacherGradeBook;
