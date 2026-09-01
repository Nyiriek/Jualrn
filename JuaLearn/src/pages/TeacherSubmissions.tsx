import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "../api/axios";

type Subject = { name: string };
type Student = { full_name?: string; email?: string };
type Submission = {
  id: number;
  title: string;
  description?: string;
  subject: Subject;
  assigned_to?: Student | null;
  submission_text?: string;
  submitted_at?: string | null;
  due_date: string;
  grade?: number | null;
};

const formatDate = (value?: string | null) => value
  ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
  : "—";

const TeacherSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/assignments/student_work/");
      setSubmissions(response.data.filter((item: Submission) => Boolean(item.submitted_at)));
    } catch {
      setError("We could not load student submissions. Refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubmissions(); }, []);

  const awaitingReview = useMemo(() => submissions.filter((submission) => submission.grade == null), [submissions]);
  const graded = submissions.length - awaitingReview.length;
  const openSubmission = (submission: Submission) => {
    setSelected(submission);
    setGrade(submission.grade == null ? "" : String(submission.grade));
    setError("");
  };

  const saveGrade = async () => {
    if (!selected) return;
    const numericGrade = Number(grade);
    if (!Number.isInteger(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      setError("Enter a whole-number grade from 0 to 100.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await axios.patch(`/assignments/${selected.id}/grade-submission/`, { grade: numericGrade });
      setSubmissions((current) => current.map((submission) => submission.id === selected.id ? response.data : submission));
      setSelected(null);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "The final grade could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return <Box sx={{ maxWidth: 1180, mx: "auto", pb: 4 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" } }}>Submissions</Typography>
        <Typography color="text.secondary" sx={{ mt: .5 }}>Review manually submitted assignment work and give each learner a final grade.</Typography>
      </Box>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSubmissions} disabled={loading} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>Refresh</Button>
    </Stack>

    {error && !selected && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
    {!loading && <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
      <Chip color="warning" variant="outlined" label={`${awaitingReview.length} awaiting review`} />
      <Chip color="success" variant="outlined" label={`${graded} graded`} />
      <Chip variant="outlined" label={`${submissions.length} total submissions`} />
    </Stack>}

    <Card variant="outlined"><CardContent sx={{ p: 0 }}>
      <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2 }}><Typography variant="h6">Manual assignment submissions</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Open a submission to read the response and record the learner’s final grade.</Typography></Box>
      <TableContainer component={Paper} elevation={0} sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead><TableRow><TableCell>Student</TableCell><TableCell>Assignment</TableCell><TableCell>Course</TableCell><TableCell>Submitted</TableCell><TableCell>Score</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6}><Box sx={{ py: 2, display: "flex", alignItems: "center", gap: 1.5 }}><CircularProgress size={20} />Loading submissions…</Box></TableCell></TableRow>
              : submissions.length === 0 ? <TableRow><TableCell colSpan={6}><Box sx={{ py: 4, textAlign: "center" }}><AssignmentTurnedInOutlinedIcon color="disabled" sx={{ fontSize: 34 }} /><Typography sx={{ mt: .5 }}>No manual assignment submissions yet.</Typography><Typography variant="body2" color="text.secondary">Student responses appear here after submission.</Typography></Box></TableCell></TableRow>
              : submissions.map((submission) => <TableRow key={submission.id} hover>
                <TableCell>{submission.assigned_to?.full_name || submission.assigned_to?.email || "Student"}</TableCell>
                <TableCell><Typography fontWeight={600}>{submission.title}</Typography></TableCell>
                <TableCell>{submission.subject.name}</TableCell>
                <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                <TableCell>{submission.grade == null ? <Chip size="small" color="warning" label="Awaiting review" /> : <Stack direction="row" spacing={.75} alignItems="center"><Typography fontWeight={700}>{submission.grade}%</Typography><Chip size="small" color="success" label="Final" /></Stack>}</TableCell>
                <TableCell align="right"><Button size="small" variant={submission.grade == null ? "contained" : "outlined"} onClick={() => openSubmission(submission)}>{submission.grade == null ? "Review & grade" : "Review"}</Button></TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent></Card>

    <Dialog open={Boolean(selected)} onClose={() => !saving && setSelected(null)} fullWidth maxWidth="md">
      <DialogTitle>{selected?.title}</DialogTitle>
      <DialogContent dividers>
        {selected && <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}><Box><Typography variant="subtitle2">{selected.assigned_to?.full_name || selected.assigned_to?.email || "Student"}</Typography><Typography variant="body2" color="text.secondary">{selected.subject.name} · submitted {formatDate(selected.submitted_at)}</Typography></Box><Chip size="small" color={selected.grade == null ? "warning" : "success"} label={selected.grade == null ? "Awaiting review" : `Final grade: ${selected.grade}%`} /></Stack>
          <Box><Typography variant="subtitle2">Assignment instructions</Typography><Typography sx={{ mt: .5, whiteSpace: "pre-wrap" }}>{selected.description || "No additional instructions were supplied."}</Typography></Box>
          <Divider />
          <Box><Typography variant="subtitle2">Student response</Typography><Typography sx={{ mt: .75, whiteSpace: "pre-wrap" }}>{selected.submission_text || "No written response was provided."}</Typography></Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField id="final-assignment-grade" name="final_assignment_grade" label="Final grade (0–100)" type="number" required fullWidth value={grade} onChange={(event) => setGrade(event.target.value)} inputProps={{ min: 0, max: 100, step: 1 }} helperText="Saving this grade makes it visible in the learner's dashboard and gradebook." />
        </Stack>}
      </DialogContent>
      <DialogActions><Button onClick={() => setSelected(null)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={saveGrade} disabled={saving}>{saving ? "Saving…" : "Save final grade"}</Button></DialogActions>
    </Dialog>
  </Box>;
};

export default TeacherSubmissions;
