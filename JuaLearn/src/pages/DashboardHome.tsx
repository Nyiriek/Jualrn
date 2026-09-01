import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Badge, Box, Button, Card,
  CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, List, ListItem, ListItemButton,
  ListItemText, Paper, Stack, Switch, TextField, Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import api from "../api/axios";

type User = { id: number; username: string; first_name?: string; last_name?: string; role: string };
type Resource = { id: number; title: string; resource_type: string; description?: string; content?: string; topic?: string; source?: string };
type Subject = { id: number; name: string; description?: string; content?: string; published: boolean; created_by?: number | null; resources: Resource[] };
type Lesson = { id: number; subject: number; title: string; content: string; date_created?: string };
type Quiz = { id: number; title: string; description?: string; due_date: string; published: boolean; subject: { id: number; name: string }; resources?: Resource[] };
type Assignment = { id: number; title: string; description?: string; due_date: string; published: boolean; subject: { id: number; name: string }; assigned_to?: { id: number } | null };
type Notification = { id: number; title: string; message: string; is_read: boolean; created_at: string; type: string };

const formatDate = (value?: string) => value ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not recorded";
const teacherName = (user?: User) => user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "Not recorded";

const DashboardHome = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCourse, setEditCourse] = useState({ id: 0, name: "", description: "", content: "", published: false });
  const [savingCourse, setSavingCourse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [userResponse, subjectResponse, lessonResponse, quizResponse, assignmentResponse, notificationResponse] = await Promise.all([
        api.get("/users/"), api.get("/subjects/"), api.get("/lessons/"), api.get("/quizzes/"), api.get("/assignments/"), api.get("/notifications/"),
      ]);
      setUsers(userResponse.data);
      setSubjects(subjectResponse.data);
      setLessons(lessonResponse.data);
      setQuizzes(quizResponse.data);
      setAssignments(assignmentResponse.data);
      setNotifications(notificationResponse.data);
      setSelectedCourseId((current) => current ?? subjectResponse.data[0]?.id ?? null);
    } catch {
      setError("Platform information could not be loaded. Check that the backend is running and that you are signed in as an administrator.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const poll = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(poll);
  }, []);

  const selectedCourse = subjects.find((subject) => subject.id === selectedCourseId) || null;
  const selectedLessons = selectedCourse ? lessons.filter((lesson) => lesson.subject === selectedCourse.id) : [];
  const selectedQuizzes = selectedCourse ? quizzes.filter((quiz) => quiz.subject.id === selectedCourse.id) : [];
  const selectedAssignments = selectedCourse ? assignments.filter((assignment) => assignment.subject.id === selectedCourse.id) : [];
  const publishedNotices = notifications.filter((notification) => notification.type === "teacher_course_published");
  const unreadPublishedNotices = publishedNotices.filter((notification) => !notification.is_read);
  const teachers = users.filter((user) => user.role === "teacher").length;

  const assignmentGroups = useMemo(() => {
    const byTitle = new Map<string, { assignment: Assignment; copies: number }>();
    selectedAssignments.forEach((assignment) => {
      const existing = byTitle.get(assignment.title);
      byTitle.set(assignment.title, existing ? { ...existing, copies: existing.copies + 1 } : { assignment, copies: 1 });
    });
    return [...byTitle.values()];
  }, [selectedAssignments]);

  const markNotificationRead = async (notification: Notification) => {
    if (notification.is_read) return;
    try {
      await api.patch(`/notifications/${notification.id}/`, { is_read: true });
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    } catch {
      setError("The notification could not be marked as read.");
    }
  };

  const openCourseEditor = (course: Subject) => {
    setEditCourse({ id: course.id, name: course.name, description: course.description || "", content: course.content || "", published: course.published });
    setEditOpen(true);
  };

  const saveCourse = async () => {
    if (!editCourse.name.trim()) {
      setError("A course name is required.");
      return;
    }
    setSavingCourse(true);
    try {
      const { id, ...payload } = editCourse;
      const response = await api.patch(`/subjects/${id}/`, { ...payload, name: payload.name.trim() });
      setSubjects((current) => current.map((course) => course.id === id ? response.data : course));
      setEditOpen(false);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "The course could not be saved.");
    } finally {
      setSavingCourse(false);
    }
  };

  if (loading) return <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  return <Box sx={{ maxWidth: 1360, mx: "auto", pb: 4 }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2} sx={{ mb: 3 }}><Box><Typography variant="h4">Course oversight</Typography><Typography color="text.secondary">Review teacher-published courses and every connected learning item from one place.</Typography></Box><Button variant="outlined" onClick={loadDashboard}>Refresh</Button></Stack>
    {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}><Metric icon={<MenuBookIcon />} label="Courses" value={subjects.length} /><Metric icon={<MenuBookIcon />} label="Published" value={subjects.filter((subject) => subject.published).length} /><Metric icon={<QuizOutlinedIcon />} label="Teachers" value={teachers} /><Metric icon={<NotificationsOutlinedIcon />} label="New notices" value={unreadPublishedNotices.length} /></Box>

    <Card variant="outlined" sx={{ mb: 3 }}><CardContent sx={{ p: 0 }}><Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2, display: "flex", alignItems: "center", gap: 1 }}><Badge color="error" badgeContent={unreadPublishedNotices.length}><NotificationsOutlinedIcon color="primary" /></Badge><Box><Typography variant="h6">Teacher publication notifications</Typography><Typography variant="body2" color="text.secondary">Newly published teacher courses appear here automatically.</Typography></Box></Box><List dense sx={{ mt: 1 }}>{publishedNotices.length === 0 ? <ListItem><ListItemText primary="No teacher course publications yet." secondary="When a teacher publishes a course, every administrator receives a notification." /></ListItem> : publishedNotices.slice(0, 6).map((notice) => <ListItem key={notice.id} disablePadding divider><ListItemButton onClick={() => markNotificationRead(notice)} sx={{ bgcolor: notice.is_read ? "transparent" : "action.selected" }}><ListItemText primary={notice.title} secondary={<><span>{notice.message}</span><br /><span>{formatDate(notice.created_at)}</span></>} /></ListItemButton></ListItem>)}</List></CardContent></Card>

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, .75fr) minmax(0, 1.65fr)" }, gap: 2 }}>
      <Card variant="outlined"><CardContent sx={{ p: 0 }}><Box sx={{ p: 2 }}><Typography variant="h6">All courses</Typography><Typography variant="body2" color="text.secondary">Choose a course to inspect its material and assessments.</Typography></Box><Divider /><List disablePadding>{subjects.length === 0 ? <ListItem><ListItemText primary="No courses have been created." /></ListItem> : subjects.map((subject) => <ListItem key={subject.id} disablePadding><ListItemButton selected={subject.id === selectedCourseId} onClick={() => setSelectedCourseId(subject.id)}><ListItemText primary={subject.name} secondary={teacherName(users.find((user) => user.id === subject.created_by))} /><Chip size="small" color={subject.published ? "success" : "default"} label={subject.published ? "Published" : "Draft"} /></ListItemButton></ListItem>)}</List></CardContent></Card>
      <CourseDetail course={selectedCourse} creator={selectedCourse ? users.find((user) => user.id === selectedCourse.created_by) : undefined} lessons={selectedLessons} quizzes={selectedQuizzes} assignments={assignmentGroups} onEdit={openCourseEditor} />
    </Box>
    <Dialog open={editOpen} onClose={() => !savingCourse && setEditOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>Edit course</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField id="admin-course-name" name="courseName" label="Course name" value={editCourse.name} required autoFocus onChange={(event) => setEditCourse((current) => ({ ...current, name: event.target.value }))} />
          <TextField id="admin-course-description" name="courseDescription" label="Course description" value={editCourse.description} multiline minRows={3} onChange={(event) => setEditCourse((current) => ({ ...current, description: event.target.value }))} />
          <TextField id="admin-course-content" name="courseContent" label="Course content" helperText="This overview is shown with the course resources and lessons." value={editCourse.content} multiline minRows={7} onChange={(event) => setEditCourse((current) => ({ ...current, content: event.target.value }))} />
          <FormControlLabel control={<Switch checked={editCourse.published} onChange={(event) => setEditCourse((current) => ({ ...current, published: event.target.checked }))} inputProps={{ 'aria-label': 'Publish course' }} />} label="Published and visible to enrolled students" />
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={() => setEditOpen(false)} disabled={savingCourse}>Cancel</Button><Button variant="contained" onClick={saveCourse} disabled={savingCourse}>{savingCourse ? "Saving…" : "Save changes"}</Button></DialogActions>
    </Dialog>
  </Box>;
};

const CourseDetail = ({ course, creator, lessons, quizzes, assignments, onEdit }: { course: Subject | null; creator?: User; lessons: Lesson[]; quizzes: Quiz[]; assignments: Array<{ assignment: Assignment; copies: number }>; onEdit: (course: Subject) => void }) => {
  if (!course) return <Card variant="outlined"><CardContent sx={{ py: 6, textAlign: "center" }}><MenuBookIcon color="disabled" sx={{ fontSize: 42 }} /><Typography sx={{ mt: 1 }}>Select a course to inspect its content.</Typography></CardContent></Card>;
  return <Card variant="outlined"><CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}><Box><Typography variant="h5">{course.name}</Typography><Typography variant="body2" color="text.secondary">Created by {teacherName(creator)}</Typography></Box><Stack direction="row" alignItems="center" spacing={1}><Chip color={course.published ? "success" : "default"} label={course.published ? "Published" : "Draft"} /><Button size="small" variant="outlined" onClick={() => onEdit(course)}>Edit course</Button></Stack></Stack><Typography sx={{ mt: 2, whiteSpace: "pre-wrap" }}>{course.description || "No course description has been added."}</Typography><Accordion defaultExpanded sx={{ mt: 2 }}><AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1} alignItems="center"><ArticleOutlinedIcon color="primary" /><Typography fontWeight={700}>Course content and resources ({course.resources?.length || 0})</Typography></Stack></AccordionSummary><AccordionDetails><Typography variant="subtitle2">Course overview</Typography><Typography sx={{ whiteSpace: "pre-wrap", mt: .5 }}>{course.content || "No course content has been added."}</Typography><Divider sx={{ my: 2 }} />{course.resources?.length ? <Stack spacing={1.5}>{course.resources.map((resource) => <Paper key={resource.id} variant="outlined" sx={{ p: 1.5 }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={700}>{resource.title}</Typography><Chip size="small" label={resource.resource_type} /></Stack>{resource.topic && <Typography variant="caption" color="text.secondary">{resource.topic}</Typography>}<Typography variant="body2" sx={{ mt: .5, whiteSpace: "pre-wrap" }}>{resource.description || resource.content || "No resource description."}</Typography></Paper>)}</Stack> : <Typography color="text.secondary">No linked resources.</Typography>}</AccordionDetails></Accordion><DetailAccordion icon={<MenuBookIcon color="primary" />} title={`Lessons (${lessons.length})`} empty="No lessons have been added.">{lessons.map((lesson) => <Paper key={lesson.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}><Typography fontWeight={700}>{lesson.title}</Typography><Typography variant="body2" sx={{ mt: .5, whiteSpace: "pre-wrap" }}>{lesson.content}</Typography></Paper>)}</DetailAccordion><DetailAccordion icon={<QuizOutlinedIcon color="primary" />} title={`Quizzes (${quizzes.length})`} empty="No quizzes have been added.">{quizzes.map((quiz) => <Paper key={quiz.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={700}>{quiz.title}</Typography><Chip size="small" color={quiz.published ? "success" : "default"} label={quiz.published ? "Published" : "Draft"} /></Stack><Typography variant="body2" color="text.secondary">Due {formatDate(quiz.due_date)}</Typography><Typography variant="body2" sx={{ mt: .5 }}>{quiz.description || "No quiz description."}</Typography></Paper>)}</DetailAccordion><DetailAccordion icon={<AssignmentOutlinedIcon color="primary" />} title={`Assignments (${assignments.length})`} empty="No assignments have been added.">{assignments.map(({ assignment, copies }) => <Paper key={assignment.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={700}>{assignment.title}</Typography><Chip size="small" color={assignment.published ? "success" : "default"} label={assignment.published ? "Published" : "Draft"} /></Stack><Typography variant="body2" color="text.secondary">Due {formatDate(assignment.due_date)} · {copies} learner record{copies === 1 ? "" : "s"}</Typography><Typography variant="body2" sx={{ mt: .5, whiteSpace: "pre-wrap" }}>{assignment.description || "No assignment instructions."}</Typography></Paper>)}</DetailAccordion></CardContent></Card>;
};

const DetailAccordion = ({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode[] }) => <Accordion><AccordionSummary expandIcon={<ExpandMoreIcon />}><Stack direction="row" spacing={1} alignItems="center">{icon}<Typography fontWeight={700}>{title}</Typography></Stack></AccordionSummary><AccordionDetails>{children.length ? children : <Typography color="text.secondary">{empty}</Typography>}</AccordionDetails></Accordion>;
const Metric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => <Card variant="outlined"><CardContent><Stack direction="row" spacing={1} alignItems="center" color="primary.main">{icon}<Typography variant="body2">{label}</Typography></Stack><Typography variant="h4" sx={{ mt: 1 }}>{value}</Typography></CardContent></Card>;

export default DashboardHome;
