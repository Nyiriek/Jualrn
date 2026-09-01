import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import api from "../api/axios";

type Resource = { id: number; title: string; description: string; content: string; topic?: string; resource_type: string; source?: string; source_reference?: string };
type Lesson = { id: number; title: string; content: string };
type Course = { id: number; name: string; description: string; content?: string; teacher_name?: string; resources: Resource[]; lessons: Lesson[] };
type Item = { id: string; type: "overview" | "lesson" | "resource"; title: string; description: string; content: string; topic?: string; source?: string };

const PublicCourseContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedId, setSelectedId] = useState("overview");
  const [error, setError] = useState("");

  useEffect(() => { if (id) api.get(`/public-courses/${id}/`).then((response) => setCourse(response.data)).catch(() => setError("This published course could not be loaded.")); }, [id]);
  const items = useMemo<Item[]>(() => !course ? [] : [
    { id: "overview", type: "overview", title: "Course overview", description: course.description || "Get an introduction to this course.", content: course.content || course.description || "Your teacher has not added an overview yet." },
    ...(course.lessons || []).map((lesson) => ({ id: `lesson-${lesson.id}`, type: "lesson" as const, title: lesson.title, description: "Teacher-created lesson material", content: lesson.content })),
    ...(course.resources || []).map((resource) => ({ id: `resource-${resource.id}`, type: "resource" as const, title: resource.title, description: resource.description || "Course resource", content: resource.content, topic: resource.topic, source: resource.source })),
  ], [course]);
  const selected = items.find((item) => item.id === selectedId) || items[0];
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  if (!course || !selected) return <Box sx={{ p: 4, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6f5", color: "#152b43", px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}><Box sx={{ maxWidth: 1320, mx: "auto" }}>
    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/courses")} sx={{ color: "#28796b", mb: 2 }}>All courses</Button>
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}><Box><Typography color="#28796b" variant="overline" fontWeight={800}>Published course</Typography><Typography variant="h4" fontWeight={800}>{course.name}</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Created by {course.teacher_name || "JuaLearn teacher"}</Typography></Box><Button variant="contained" onClick={() => navigate(`/student-access?course=${course.id}`)} sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>Enrol to take course</Button></Stack>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "290px minmax(0, 1fr)" }, gap: 2.5, alignItems: "start" }}>
      <Card variant="outlined" sx={{ position: { lg: "sticky" }, top: { lg: 88 }, maxHeight: { lg: "calc(100vh - 110px)" }, overflowY: "auto" }}><CardContent sx={{ p: 1 }}><Typography variant="subtitle2" sx={{ px: 1, pt: 1, pb: .5 }}>Course content</Typography><List disablePadding>{items.map((item) => <ListItemButton key={item.id} selected={item.id === selected.id} onClick={() => setSelectedId(item.id)} sx={{ borderRadius: 1, py: .85 }}><ListItemIcon sx={{ minWidth: 34, color: "primary.main" }}>{item.type === "overview" ? <SchoolOutlinedIcon fontSize="small" /> : item.type === "lesson" ? <MenuBookOutlinedIcon fontSize="small" /> : <ArticleOutlinedIcon fontSize="small" />}</ListItemIcon><ListItemText primary={item.title} secondary={item.topic || (item.type === "lesson" ? "Lesson" : item.type === "overview" ? "Start here" : "Resource")} primaryTypographyProps={{ variant: "body2", fontWeight: item.id === selected.id ? 700 : 500 }} secondaryTypographyProps={{ variant: "caption" }} /></ListItemButton>)}</List></CardContent></Card>
      <Stack spacing={2.5}><Card><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Chip size="small" label={selected.topic || (selected.type === "lesson" ? "Lesson" : selected.type === "resource" ? "Course resource" : "Course overview")} sx={{ mb: 1.5 }} /><Typography variant="h5">{selected.title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{selected.description}</Typography></CardContent></Card><Card variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Stack direction="row" gap={1} alignItems="center"><ArticleOutlinedIcon color="primary" /><Typography variant="h6">Learning material</Typography></Stack><Divider sx={{ my: 2 }} /><Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{selected.content || "Content will be added soon."}</Typography>{selected.source && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>Source: {selected.source}</Typography>}</CardContent></Card><Alert severity="info" action={<Button color="inherit" size="small" onClick={() => navigate(`/student-access?course=${course.id}`)}>Enrol</Button>}>Enrol to take course activities, assessments and track your progress.</Alert></Stack>
    </Box>
  </Box></Box>;
};

export default PublicCourseContent;
