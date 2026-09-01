import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Paper,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import axios from "../api/axios";

type Subject = { id: number; name: string; published: boolean };
type Assignment = {
  id: number;
  title: string;
  subject: { id: number; name: string };
  assigned_to?: { id: number; full_name?: string; email?: string } | null;
  grade: number | null;
  submitted_at?: string | null;
};
type QuizResult = { id: number; course: string; grade: number; submitted_at: string };

const percent = (value: number) => `${Math.round(value)}%`;
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const TeacherReports = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const [subjectResponse, assignmentResponse, quizResponse] = await Promise.all([
        axios.get("/subjects/"), axios.get("/assignments/student_work/"), axios.get("/quiz-results/gradebook/"),
      ]);
      setSubjects(subjectResponse.data);
      setAssignments(assignmentResponse.data);
      setQuizResults(quizResponse.data);
    } catch {
      setError("We could not load the report data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, []);

  const studentCount = useMemo(() => new Set(assignments.map((item) => item.assigned_to?.id).filter(Boolean)).size, [assignments]);
  const submittedAssignments = assignments.filter((item) => item.submitted_at);
  const gradedAssignments = assignments.filter((item) => item.grade != null);
  const assignmentAverage = average(gradedAssignments.map((item) => item.grade as number));
  const quizAverage = average(quizResults.map((item) => item.grade));
  const submissionRate = assignments.length ? submittedAssignments.length / assignments.length * 100 : 0;

  const courseRows = useMemo(() => subjects.map((subject) => {
    const courseAssignments = assignments.filter((item) => item.subject.id === subject.id);
    const courseQuizResults = quizResults.filter((item) => item.course === subject.name);
    const completed = courseAssignments.filter((item) => item.submitted_at).length;
    return {
      id: subject.id,
      name: subject.name,
      assigned: courseAssignments.length,
      completed,
      assignmentAverage: average(courseAssignments.filter((item) => item.grade != null).map((item) => item.grade as number)),
      quizAverage: average(courseQuizResults.map((item) => item.grade)),
      quizSubmissions: courseQuizResults.length,
    };
  }), [subjects, assignments, quizResults]);

  const downloadCsv = () => {
    const rows = [
      ["Course", "Assignments assigned", "Assignments submitted", "Submission rate", "Assignment average", "Quiz submissions", "Quiz average"],
      ...courseRows.map((row) => [row.name, row.assigned, row.completed, row.assigned ? percent(row.completed / row.assigned * 100) : "—", row.assignmentAverage == null ? "—" : percent(row.assignmentAverage), row.quizSubmissions, row.quizAverage == null ? "—" : percent(row.quizAverage)]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `jualearn-teacher-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <Box sx={{ maxWidth: 1280, mx: "auto", pb: 4 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" } }}>Reports</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>A live overview of learner activity and assessment performance across your courses.</Typography></Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="outlined" onClick={loadReport} disabled={loading}>Refresh</Button><Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={downloadCsv} disabled={loading || !courseRows.length}>Download CSV</Button></Stack>
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

    {loading ? <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : <>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <Metric icon={<GroupsOutlinedIcon />} label="Learners reached" value={studentCount} helper="Assigned student accounts" />
        <Metric icon={<TaskAltOutlinedIcon />} label="Assignment completion" value={percent(submissionRate)} helper={`${submittedAssignments.length} of ${assignments.length} submitted`} />
        <Metric icon={<AssessmentOutlinedIcon />} label="Assignment average" value={assignmentAverage == null ? "—" : percent(assignmentAverage)} helper={`${gradedAssignments.length} teacher-marked`} />
        <Metric icon={<QuizOutlinedIcon />} label="Quiz average" value={quizAverage == null ? "—" : percent(quizAverage)} helper={`${quizResults.length} quiz submissions`} />
      </Box>

      <Card variant="outlined"><CardContent sx={{ p: 0 }}>
        <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2 }}><Typography variant="h6">Course performance</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Use completion and score trends to decide where learners need follow-up support.</Typography></Box>
        <TableContainer component={Paper} elevation={0} sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto" }}><Table size="small" sx={{ minWidth: 850 }}><TableHead><TableRow><TableCell>Course</TableCell><TableCell align="right">Assigned</TableCell><TableCell align="right">Submitted</TableCell><TableCell>Completion</TableCell><TableCell>Assignment average</TableCell><TableCell>Quiz activity</TableCell><TableCell>Quiz average</TableCell></TableRow></TableHead><TableBody>{courseRows.length === 0 ? <TableRow><TableCell colSpan={7}>Create a course to start building reports.</TableCell></TableRow> : courseRows.map((row) => <TableRow key={row.id} hover><TableCell><Typography fontWeight={700}>{row.name}</Typography></TableCell><TableCell align="right">{row.assigned}</TableCell><TableCell align="right">{row.completed}</TableCell><TableCell>{row.assigned ? <Chip size="small" color={row.completed / row.assigned >= .7 ? "success" : "warning"} label={percent(row.completed / row.assigned * 100)} /> : "—"}</TableCell><TableCell>{row.assignmentAverage == null ? "Not graded" : <Chip size="small" color="primary" variant="outlined" label={percent(row.assignmentAverage)} />}</TableCell><TableCell>{row.quizSubmissions} submissions</TableCell><TableCell>{row.quizAverage == null ? "No scores yet" : <Chip size="small" color="secondary" variant="outlined" label={percent(row.quizAverage)} />}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
      </CardContent></Card>

      <Card variant="outlined" sx={{ mt: 3 }}><CardContent><Typography variant="h6">What to do next</Typography><Divider sx={{ my: 1.5 }} /><Stack spacing={1}><Typography variant="body2">• Review ungraded work: {submittedAssignments.length - gradedAssignments.length > 0 ? `${submittedAssignments.length - gradedAssignments.length} submission(s) still need a final grade.` : "all submitted assignments are graded."}</Typography><Typography variant="body2">• Follow up on courses below 70% assignment completion.</Typography><Typography variant="body2">• Download the CSV to share course-level results or keep a term record.</Typography></Stack></CardContent></Card>
    </>}
  </Box>;
};

const Metric = ({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string | number; helper: string }) => <Card variant="outlined"><CardContent><Stack direction="row" spacing={1} alignItems="center" color="primary.main">{icon}<Typography variant="body2">{label}</Typography></Stack><Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography><Typography variant="caption" color="text.secondary">{helper}</Typography></CardContent></Card>;

export default TeacherReports;
