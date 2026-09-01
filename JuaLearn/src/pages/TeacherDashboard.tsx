import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import QuizIcon from "@mui/icons-material/Quiz";
import GroupsIcon from "@mui/icons-material/Groups";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TuneIcon from "@mui/icons-material/Tune";
import { useAuth } from "../context/AuthContext";
import { TeacherPalette, teacherPaletteColors, useTeacherDashboardPreferences } from "../context/TeacherDashboardPreferences";
import api from "../api/axios";

type Subject = { id: number; name: string; published: boolean };
type Assignment = { id: number; title: string; subject: Subject; submitted_at?: string | null; grade?: number | null };
type Quiz = { id: number; title: string; published: boolean };

const paletteOptions: Array<{ id: TeacherPalette; label: string; color: string }> = [
  { id: "indigo", label: "Indigo", color: teacherPaletteColors.indigo }, { id: "navy", label: "Navy", color: teacherPaletteColors.navy }, { id: "teal", label: "Teal", color: teacherPaletteColors.teal }, { id: "burgundy", label: "Burgundy", color: teacherPaletteColors.burgundy }, { id: "violet", label: "Violet", color: teacherPaletteColors.violet },
];

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const { preferences, accent, updatePreferences, resetPreferences } = useTeacherDashboardPreferences();

  useEffect(() => { Promise.all([api.get("/subjects/"), api.get("/assignments/student_work/"), api.get("/quizzes/")]).then(([subjectResponse, workResponse, quizResponse]) => { setSubjects(subjectResponse.data); setAssignments(workResponse.data); setQuizzes(quizResponse.data); }).catch(() => setError("Some classroom information could not be loaded. Restart the local backend if this persists.")).finally(() => setLoading(false)); }, []);
  const awaitingGrade = useMemo(() => assignments.filter((assignment) => assignment.submitted_at && assignment.grade === null), [assignments]);
  if (loading) return <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  return <Box sx={{ maxWidth: 1200, mx: "auto", fontSize: preferences.fontScale === "large" ? "1.08rem" : "1rem" }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 3 }}><Box><Typography variant="h4">Teaching workspace</Typography><Typography color="text.secondary">Welcome, {user?.firstName || "Teacher"}. Create content, follow learner work, and act on what needs attention.</Typography></Box><Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setCustomizerOpen(true)}>Customize</Button><Button variant="outlined" onClick={() => navigate("/teacher/courses")}>New course</Button><Button variant="contained" onClick={() => navigate("/teacher/assignments")}>New assignment</Button></Stack></Stack>
    {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: preferences.density === "compact" ? 1.25 : preferences.density === "spacious" ? 3 : 2, mb: 3 }}><Metric icon={<MenuBookIcon />} label="Courses" value={subjects.length} /><Metric icon={<GroupsIcon />} label="Submissions to review" value={awaitingGrade.length} /><Metric icon={<QuizIcon />} label="Quizzes" value={quizzes.length} /><Metric icon={<FactCheckIcon />} label="Published courses" value={subjects.filter((subject) => subject.published).length} /></Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr .8fr" }, gap: preferences.density === "compact" ? 1.25 : preferences.density === "spacious" ? 3 : 2 }}>
      <Card><CardContent><Typography variant="h6" gutterBottom>Needs your attention</Typography>{awaitingGrade.length ? <Stack spacing={1.5}>{awaitingGrade.slice(0, 5).map((assignment) => <Box key={assignment.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}><Box><Typography fontWeight={600}>{assignment.title}</Typography><Typography variant="body2" color="text.secondary">{assignment.subject.name} · student submission received</Typography></Box><Chip label="Grade" color="warning" size="small" /></Box>)}</Stack> : <Typography color="text.secondary">No submissions are waiting for a grade.</Typography>}<Button sx={{ mt: 2 }} onClick={() => navigate("/teacher/submissions")}>Open submissions</Button></CardContent></Card>
      <Card><CardContent><Typography variant="h6" gutterBottom>Teaching tools</Typography><Stack spacing={1}><Button variant="outlined" onClick={() => navigate("/teacher/courses")}>Manage course content</Button><Button variant="outlined" onClick={() => navigate("/teacher/quizzes")}>Create or publish quizzes</Button><Button variant="outlined" onClick={() => navigate("/teacher/training")}>Teacher development</Button><Button variant="outlined" onClick={() => navigate("/teacher/reports")}>View reports</Button></Stack></CardContent></Card>
      <Card><CardContent><Typography variant="h6" gutterBottom>Your courses</Typography>{subjects.length ? <Stack spacing={1}>{subjects.map((subject) => <Box key={subject.id} sx={{ display: "flex", justifyContent: "space-between" }}><Typography>{subject.name}</Typography><Chip size="small" label={subject.published ? "Published" : "Draft"} color={subject.published ? "success" : "default"} /></Box>)}</Stack> : <Typography color="text.secondary">Create your first course to start teaching online.</Typography>}</CardContent></Card>
      <Card><CardContent><Typography variant="h6" gutterBottom>Assessment status</Typography><Typography color="text.secondary">{quizzes.filter((quiz) => quiz.published).length} of {quizzes.length} quizzes are published and visible to enrolled learners.</Typography><Button sx={{ mt: 2 }} onClick={() => navigate("/teacher/quizzes")}>Manage quizzes</Button></CardContent></Card>
    </Box>
    <Dialog open={customizerOpen} onClose={() => setCustomizerOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Customize teaching workspace</DialogTitle><DialogContent dividers><Stack spacing={2.5}><Box><Typography variant="subtitle2">Color palette</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>Choose an accent color for your teacher dashboard, navigation and actions.</Typography><Stack direction="row" flexWrap="wrap" gap={1}>{paletteOptions.map((option) => <Tooltip key={option.id} title={option.label}><Button aria-label={`${option.label} teacher palette`} onClick={() => updatePreferences({ palette: option.id })} sx={{ minWidth: 0, width: 42, height: 42, borderRadius: "50%", bgcolor: option.color, border: preferences.palette === option.id ? "3px solid" : "1px solid", borderColor: preferences.palette === option.id ? "text.primary" : "divider", "&:hover": { bgcolor: option.color, transform: "scale(1.06)" } }} /></Tooltip>)}</Stack></Box><Box><Typography variant="subtitle2" sx={{ mb: 1 }}>Layout and text</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><ToggleButtonGroup exclusive value={preferences.density} onChange={(_, value) => value && updatePreferences({ density: value })} aria-label="Teacher dashboard spacing"><ToggleButton value="compact">Compact</ToggleButton><ToggleButton value="comfortable">Comfortable</ToggleButton><ToggleButton value="spacious">Spacious</ToggleButton></ToggleButtonGroup><ToggleButtonGroup exclusive value={preferences.fontScale} onChange={(_, value) => value && updatePreferences({ fontScale: value })} aria-label="Teacher dashboard text size"><ToggleButton value="standard">Standard text</ToggleButton><ToggleButton value="large">Large text</ToggleButton></ToggleButtonGroup></Stack></Box></Stack></DialogContent><DialogActions><Button color="inherit" startIcon={<RestartAltIcon />} onClick={resetPreferences}>Reset</Button><Button variant="contained" sx={{ bgcolor: accent, "&:hover": { bgcolor: accent } }} onClick={() => setCustomizerOpen(false)}>Done</Button></DialogActions></Dialog>
  </Box>;
};

const Metric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => <Card variant="outlined"><CardContent><Stack direction="row" spacing={1} alignItems="center" color="primary.main">{icon}<Typography variant="body2">{label}</Typography></Stack><Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography></CardContent></Card>;
export default TeacherDashboard;
