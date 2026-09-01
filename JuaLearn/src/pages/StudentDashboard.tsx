import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, LinearProgress, Stack, Switch,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import { alpha, darken } from "@mui/material/styles";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import QuizIcon from "@mui/icons-material/Quiz";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TuneIcon from "@mui/icons-material/Tune";
import { useAuth } from "../context/AuthContext";
import { DashboardPalette, paletteColors, useStudentDashboardPreferences } from "../context/StudentDashboardPreferences";
import api from "../api/axios";

type Course = { id: number; name: string; description?: string; teacher_name?: string };
type Enrollment = { id: number; subject: Course };
type Assignment = { id: number; title: string; due_date: string; subject: Course; submitted_at?: string | null; grade?: number | null };
type Quiz = { id: number; title: string; due_date: string; subject: Course };
type Grade = { grade: number };

const paletteOptions: Array<{ id: DashboardPalette; label: string; color: string }> = [
  { id: "ocean", label: "Ocean", color: paletteColors.ocean },
  { id: "navy", label: "Navy blue", color: paletteColors.navy },
  { id: "violet", label: "Violet", color: paletteColors.violet },
  { id: "pink", label: "Pink", color: paletteColors.pink },
  { id: "burgundy", label: "Burgundy", color: paletteColors.burgundy },
  { id: "forest", label: "Forest", color: paletteColors.forest },
  { id: "sunset", label: "Sunset", color: paletteColors.sunset },
  { id: "custom", label: "Custom", color: "#ec4899" },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { preferences, accent, updatePreferences, resetPreferences } = useStudentDashboardPreferences();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customizerOpen, setCustomizerOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/student/enrollments/"), api.get("/assignments/"), api.get("/student/quizzes/"), api.get("/student/grades/quizzes/"), api.get("/student/grades/assignments/")])
      .then(([enrollmentResponse, assignmentResponse, quizResponse, quizGradeResponse, assignmentGradeResponse]) => {
        setEnrollments(enrollmentResponse.data);
        setAssignments(assignmentResponse.data);
        setQuizzes(quizResponse.data);
        setGrades([...quizGradeResponse.data, ...assignmentGradeResponse.data]);
      })
      .catch(() => setError("Some learning information could not be loaded. Please check your connection and try again."))
      .finally(() => setLoading(false));
  }, []);

  const average = useMemo(() => grades.length ? Math.round(grades.reduce((total, item) => total + item.grade, 0) / grades.length) : null, [grades]);
  const pendingAssignments = assignments.filter((assignment) => !assignment.submitted_at && assignment.grade === null);
  const gap = preferences.density === "compact" ? 1.25 : preferences.density === "spacious" ? 3 : 2;
  const dashboardCard = {
    border: preferences.style === "glass" ? `1px solid ${alpha(accent, .22)}` : undefined,
    bgcolor: preferences.style === "glass" ? alpha("#ffffff", .62) : preferences.style === "soft" ? alpha(accent, .055) : undefined,
    backdropFilter: preferences.style === "glass" ? "blur(12px)" : undefined,
    boxShadow: preferences.style === "soft" ? `0 10px 28px ${alpha(accent, .09)}` : undefined,
  };
  const accentButton = { bgcolor: accent, "&:hover": { bgcolor: darken(accent, .14) } };

  if (loading) return <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}><CircularProgress sx={{ color: accent }} /></Box>;

  return <Box sx={{ maxWidth: 1200, mx: "auto", fontSize: preferences.fontScale === "large" ? "1.08rem" : "1rem" }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4">Welcome back, {user?.firstName || "Learner"}</Typography><Typography color="text.secondary">Pick up where you left off and keep your learning moving.</Typography></Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setCustomizerOpen(true)}>Customize</Button><Button variant="contained" sx={accentButton} onClick={() => navigate("/student/subjects")}>Explore courses</Button></Stack>
    </Stack>
    {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap, mb: gap + 1 }}>
      <Metric accent={accent} cardSx={dashboardCard} icon={<AutoStoriesIcon />} label="My courses" value={enrollments.length} />
      <Metric accent={accent} cardSx={dashboardCard} icon={<AssignmentTurnedInIcon />} label="To submit" value={pendingAssignments.length} />
      <Metric accent={accent} cardSx={dashboardCard} icon={<QuizIcon />} label="Available quizzes" value={quizzes.length} />
      <Metric accent={accent} cardSx={dashboardCard} icon={<TrendingUpIcon />} label="Learning average" value={average === null ? "—" : `${average}%`} />
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr .8fr" }, gap }}>
      {preferences.showCourses && <Card sx={dashboardCard}><CardContent><Typography variant="h6" gutterBottom>Continue learning</Typography>{enrollments.length ? <Stack spacing={1.5}>{enrollments.slice(0, 4).map(({ id, subject }) => <Box key={id} sx={{ display: "flex", alignItems: "center", gap: 1 }}><Box sx={{ flexGrow: 1 }}><Typography fontWeight={600}>{subject.name}</Typography><Typography variant="body2" color="text.secondary">{subject.description || "Course materials and lessons"}</Typography><Typography variant="caption" color="text.secondary">Teacher: {subject.teacher_name || "JuaLearn teacher"}</Typography></Box><Button size="small" sx={{ color: accent }} onClick={() => navigate(`/student/subject/${subject.id}`)}>Open</Button></Box>)}</Stack> : <EmptyAction text="You are not enrolled in a course yet." action="Browse courses" onClick={() => navigate("/student/subjects")} accent={accent} />}</CardContent></Card>}
      {preferences.showProgress && <Card sx={dashboardCard}><CardContent><Typography variant="h6" gutterBottom>Progress</Typography>{average === null ? <Typography color="text.secondary">Your scores will appear after completing graded work.</Typography> : <><LinearProgress variant="determinate" value={average} sx={{ height: 10, borderRadius: 5, my: 2, "& .MuiLinearProgress-bar": { bgcolor: accent } }} /><Typography>{average}% average across graded work</Typography></>}<Button sx={{ mt: 2, color: accent }} onClick={() => navigate("/student/progress")}>View full progress</Button></CardContent></Card>}
      {preferences.showUpcoming && <Card sx={dashboardCard}><CardContent><Typography variant="h6" gutterBottom>Upcoming work</Typography>{pendingAssignments.length ? <Stack spacing={1}>{pendingAssignments.slice(0, 4).map((assignment) => <Box key={assignment.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}><Box><Typography fontWeight={600}>{assignment.title}</Typography><Typography variant="body2" color="text.secondary">{assignment.subject.name} · due {new Date(assignment.due_date).toLocaleDateString()}</Typography></Box><Chip size="small" label="To submit" sx={{ bgcolor: alpha(accent, .12), color: accent }} /></Box>)}</Stack> : <Typography color="text.secondary">Nothing waiting for submission.</Typography>}<Button sx={{ mt: 2, color: accent }} onClick={() => navigate("/student/assignments")}>Open assignments</Button></CardContent></Card>}
      {preferences.showActions && <Card sx={dashboardCard}><CardContent><Typography variant="h6" gutterBottom>Quick actions</Typography><Stack spacing={1}><Button variant="outlined" sx={{ color: accent, borderColor: alpha(accent, .45) }} onClick={() => navigate("/student/quizzes")}>Take a quiz</Button><Button variant="outlined" sx={{ color: accent, borderColor: alpha(accent, .45) }} onClick={() => navigate("/student/grades")}>View grades</Button><Button variant="outlined" sx={{ color: accent, borderColor: alpha(accent, .45) }} onClick={() => navigate("/student/forum")}>Ask the community</Button></Stack></CardContent></Card>}
    </Box>

    <Dialog open={customizerOpen} onClose={() => setCustomizerOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Customize your dashboard</DialogTitle><DialogContent dividers><Stack spacing={2.5}>
      <Box><Typography variant="subtitle2">Color palette</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>Choose an accent color for your dashboard and navigation.</Typography><Stack direction="row" flexWrap="wrap" gap={1}>{paletteOptions.map((option) => <Tooltip key={option.id} title={option.label}><Button aria-label={`${option.label} palette`} onClick={() => updatePreferences({ palette: option.id })} sx={{ minWidth: 0, width: 42, height: 42, borderRadius: "50%", bgcolor: option.id === "custom" ? preferences.customAccent : option.color, border: preferences.palette === option.id ? "3px solid" : "1px solid", borderColor: preferences.palette === option.id ? "text.primary" : "divider", "&:hover": { bgcolor: option.id === "custom" ? preferences.customAccent : option.color, transform: "scale(1.06)" } }} /></Tooltip>)}</Stack>{preferences.palette === "custom" && <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}><input id="student-custom-accent" name="student_custom_accent" type="color" value={preferences.customAccent} onChange={(event) => updatePreferences({ customAccent: event.target.value })} style={{ width: 42, height: 36, border: "none", background: "transparent", padding: 0 }} /><Typography variant="body2">Choose your own accent color</Typography></Stack>}</Box>
      <Divider />
      <Box><Typography variant="subtitle2" sx={{ mb: 1 }}>Layout and text</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><ToggleButtonGroup exclusive value={preferences.density} onChange={(_, value) => value && updatePreferences({ density: value })} aria-label="Dashboard spacing"><ToggleButton value="compact">Compact</ToggleButton><ToggleButton value="comfortable">Comfortable</ToggleButton><ToggleButton value="spacious">Spacious</ToggleButton></ToggleButtonGroup><ToggleButtonGroup exclusive value={preferences.style} onChange={(_, value) => value && updatePreferences({ style: value })} aria-label="Dashboard card style"><ToggleButton value="classic">Classic</ToggleButton><ToggleButton value="soft">Soft</ToggleButton><ToggleButton value="glass">Glass</ToggleButton></ToggleButtonGroup></Stack><FormControlLabel sx={{ mt: 1 }} control={<Switch checked={preferences.fontScale === "large"} onChange={(event) => updatePreferences({ fontScale: event.target.checked ? "large" : "standard" })} />} label="Use larger dashboard text" /></Box>
      <Divider />
      <Box><Typography variant="subtitle2">Dashboard sections</Typography><Typography variant="body2" color="text.secondary">Hide sections you do not want to see on your home dashboard.</Typography><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mt: 1 }}><FormControlLabel control={<Switch checked={preferences.showCourses} onChange={(event) => updatePreferences({ showCourses: event.target.checked })} />} label="Continue learning" /><FormControlLabel control={<Switch checked={preferences.showProgress} onChange={(event) => updatePreferences({ showProgress: event.target.checked })} />} label="Progress" /><FormControlLabel control={<Switch checked={preferences.showUpcoming} onChange={(event) => updatePreferences({ showUpcoming: event.target.checked })} />} label="Upcoming work" /><FormControlLabel control={<Switch checked={preferences.showActions} onChange={(event) => updatePreferences({ showActions: event.target.checked })} />} label="Quick actions" /></Box></Box>
    </Stack></DialogContent><DialogActions><Button color="inherit" startIcon={<RestartAltIcon />} onClick={resetPreferences}>Reset</Button><Button variant="contained" sx={accentButton} onClick={() => setCustomizerOpen(false)}>Done</Button></DialogActions></Dialog>
  </Box>;
};

const Metric = ({ icon, label, value, accent, cardSx }: { icon: React.ReactNode; label: string; value: string | number; accent: string; cardSx: object }) => <Card variant="outlined" sx={cardSx}><CardContent><Stack direction="row" spacing={1} alignItems="center" sx={{ color: accent }}>{icon}<Typography variant="body2" color="text.primary">{label}</Typography></Stack><Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography></CardContent></Card>;
const EmptyAction = ({ text, action, onClick, accent }: { text: string; action: string; onClick: () => void; accent: string }) => <Box><Typography color="text.secondary">{text}</Typography><Button sx={{ mt: 1, color: accent }} onClick={onClick}>{action}</Button></Box>;

export default StudentDashboard;
