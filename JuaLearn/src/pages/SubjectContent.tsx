import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, LinearProgress,
  List, ListItemButton, ListItemIcon, ListItemText, Stack, TextField, Typography,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import JuaCompanion from "../components/JuaCompanion";
import api from "../api/axios";

type Resource = {
  id: number;
  title: string;
  description: string;
  content: string;
  source: string;
  source_reference: string;
  resource_type: string;
  topic?: string;
};
type Subject = { id: number; name: string; description: string; content?: string; teacher_name?: string; resources?: Resource[] };
type Lesson = { id: number; subject: number; title: string; content: string };
type CourseItem = {
  id: string;
  title: string;
  type: "overview" | "lesson" | "resource";
  description: string;
  content: string;
  topic?: string;
  source?: string;
  sourceReference?: string;
  resourceType?: string;
};

const iconFor = (item: CourseItem) => {
  if (item.type === "overview") return <SchoolOutlinedIcon />;
  if (item.type === "lesson") return <AssignmentTurnedInOutlinedIcon />;
  return <ArticleOutlinedIcon />;
};

const storageKey = (subjectId: string, key: "progress" | "notes") => `jualearn-student-course-${subjectId}-${key}`;

const SubjectContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedId, setSelectedId] = useState("overview");
  const [completed, setCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/subjects/${id}/`), api.get("/lessons/")])
      .then(([subjectResponse, lessonsResponse]) => {
        setSubject(subjectResponse.data);
        setLessons(lessonsResponse.data.filter((lesson: Lesson) => lesson.subject === Number(id)));
      })
      .catch(() => setError("This course could not be loaded. Please make sure you are enrolled."));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    try {
      const savedProgress = JSON.parse(localStorage.getItem(storageKey(id, "progress")) || "[]");
      const savedNotes = JSON.parse(localStorage.getItem(storageKey(id, "notes")) || "{}");
      if (Array.isArray(savedProgress)) setCompleted(savedProgress);
      if (savedNotes && typeof savedNotes === "object") setNotes(savedNotes);
    } catch {
      localStorage.removeItem(storageKey(id, "progress"));
      localStorage.removeItem(storageKey(id, "notes"));
    }
  }, [id]);

  const items = useMemo<CourseItem[]>(() => {
    if (!subject) return [];
    return [
      {
        id: "overview", title: "Course overview", type: "overview", description: subject.description || "Get started with this course.",
        content: subject.content || subject.description || "Your teacher has not added a course overview yet.",
      },
      ...lessons.map((lesson) => ({
        id: `lesson-${lesson.id}`, title: lesson.title, type: "lesson" as const,
        description: "Lesson notes, learning activities and key ideas from your teacher.", content: lesson.content,
      })),
      ...(subject.resources || []).map((resource) => ({
        id: `resource-${resource.id}`, title: resource.title, type: "resource" as const,
        description: resource.description || "Course resource", content: resource.content,
        topic: resource.topic, source: resource.source, sourceReference: resource.source_reference, resourceType: resource.resource_type,
      })),
    ];
  }, [lessons, subject]);

  const selected = items.find((item) => item.id === selectedId) || items[0];
  const selectedIndex = Math.max(items.findIndex((item) => item.id === selected?.id), 0);
  const progressItems = items.filter((item) => item.type !== "overview");
  const completedCount = progressItems.filter((item) => completed.includes(item.id)).length;
  const progress = progressItems.length ? Math.round((completedCount / progressItems.length) * 100) : 0;
  const resourceGroups = useMemo(() => {
    const resources = items.filter((item) => item.type === "resource");
    return Array.from(new Set(resources.map((item) => item.topic || "Course resources"))).map((topic) => ({
      topic, items: resources.filter((item) => (item.topic || "Course resources") === topic),
    }));
  }, [items]);

  const selectItem = (nextId: string) => setSelectedId(nextId);
  const markComplete = () => {
    if (!selected || selected.type === "overview" || !id) return;
    const next = completed.includes(selected.id) ? completed : [...completed, selected.id];
    setCompleted(next);
    localStorage.setItem(storageKey(id, "progress"), JSON.stringify(next));
  };
  const updateNotes = (value: string) => {
    if (!selected || !id) return;
    const next = { ...notes, [selected.id]: value };
    setNotes(next);
    localStorage.setItem(storageKey(id, "notes"), JSON.stringify(next));
  };
  const goNext = () => {
    const next = items[selectedIndex + 1];
    if (next) selectItem(next.id);
  };

  if (error) return <><Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box><JuaCompanion /></>;
  if (!subject || !selected) return <><Box sx={{ p: 3 }}><CircularProgress /></Box><JuaCompanion /></>;

  const isComplete = completed.includes(selected.id);
  const itemLabel = selected.type === "lesson" ? "Lesson" : selected.type === "resource" ? selected.resourceType || "Course resource" : "Getting started";

  return <><Box sx={{ maxWidth: 1320, mx: "auto", p: { xs: 1.5, sm: 2, md: 3 }, pb: 4 }}>
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={2} sx={{ mb: 3 }}>
      <Box>
        <Button onClick={() => navigate("/student/subjects")} sx={{ ml: -1, mb: .5 }}>← All courses</Button>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.65rem", sm: "2.125rem" } }}>{subject.name}</Typography>
        <Typography color="text.secondary" sx={{ mt: .5 }}>Learn at your own pace with lessons, readings and course resources from {subject.teacher_name || "your teacher"}.</Typography>
      </Box>
      <Box sx={{ minWidth: { xs: "100%", md: 260 } }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: .5 }}><Typography variant="body2" fontWeight={700}>{completedCount} of {progressItems.length} items complete</Typography><Typography variant="body2" color="text.secondary">{progress}%</Typography></Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 99 }} />
      </Box>
    </Stack>

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "290px minmax(0, 1fr)" }, gap: 2.5, alignItems: "start" }}>
      <Card variant="outlined" sx={{ position: { lg: "sticky" }, top: { lg: 88 }, maxHeight: { lg: "calc(100vh - 110px)" }, overflowY: "auto" }}>
        <CardContent sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ px: 1, pt: 1, pb: .5 }}>Course content</Typography>
          <List disablePadding>
            <ListItemButton selected={selected.id === "overview"} onClick={() => selectItem("overview")} sx={{ borderRadius: 1, py: .75 }}>
              <ListItemIcon sx={{ minWidth: 34, color: "primary.main" }}><SchoolOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Course overview" secondary="Start here" primaryTypographyProps={{ variant: "body2", fontWeight: selected.id === "overview" ? 700 : 500 }} secondaryTypographyProps={{ variant: "caption" }} />
            </ListItemButton>
          </List>
          {lessons.length > 0 && <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1, py: .5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Lessons</Typography>
            <List disablePadding>{items.filter((item) => item.type === "lesson").map((item, index) => <ListItemButton key={item.id} selected={item.id === selected.id} onClick={() => selectItem(item.id)} sx={{ borderRadius: 1, py: .75 }}><ListItemIcon sx={{ minWidth: 34, color: completed.includes(item.id) ? "success.main" : "primary.main" }}>{completed.includes(item.id) ? <CheckCircleIcon fontSize="small" /> : <AssignmentTurnedInOutlinedIcon fontSize="small" />}</ListItemIcon><ListItemText primary={item.title} secondary={`Lesson ${index + 1} · Notes & activities`} primaryTypographyProps={{ variant: "body2", fontWeight: item.id === selected.id ? 700 : 500 }} secondaryTypographyProps={{ variant: "caption" }} /></ListItemButton>)}</List>
          </Box>}
          {resourceGroups.map((group) => <Box key={group.topic} sx={{ mt: 1 }}><Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1, py: .5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{group.topic}</Typography><List disablePadding>{group.items.map((item) => <ListItemButton key={item.id} selected={item.id === selected.id} onClick={() => selectItem(item.id)} sx={{ borderRadius: 1, py: .75 }}><ListItemIcon sx={{ minWidth: 34, color: completed.includes(item.id) ? "success.main" : "primary.main" }}>{completed.includes(item.id) ? <CheckCircleIcon fontSize="small" /> : <ArticleOutlinedIcon fontSize="small" />}</ListItemIcon><ListItemText primary={item.title} secondary={item.resourceType || "Reading"} primaryTypographyProps={{ variant: "body2", fontWeight: item.id === selected.id ? 700 : 500 }} secondaryTypographyProps={{ variant: "caption" }} /></ListItemButton>)}</List></Box>)}
        </CardContent>
      </Card>

      <Stack spacing={2.5}>
        <Card><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
            <Box><Chip size="small" icon={iconFor(selected)} label={selected.topic ? `${itemLabel} · ${selected.topic}` : itemLabel} sx={{ mb: 1.5 }} /><Typography variant="h5">{selected.title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{selected.description}</Typography></Box>
            {isComplete && <Chip icon={<CheckCircleIcon />} label="Complete" color="success" size="small" />}
          </Stack>
        </CardContent></Card>

        <Card variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction="row" gap={1} alignItems="center"><MenuBookOutlinedIcon color="primary" /><Typography variant="h6">{selected.type === "lesson" ? "Lesson notes" : selected.type === "resource" ? "Study material" : "About this course"}</Typography></Stack>
          <Typography color="text.secondary" variant="body2" sx={{ mt: .5 }}>{selected.type === "lesson" ? "Read the lesson, then save notes and mark it complete when you are ready." : "Use this material to review, practise and prepare for assessments."}</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{selected.content || "Content will be added by your teacher soon."}</Typography>
          {selected.source && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>Source: {selected.source}{selected.sourceReference ? ` · ${selected.sourceReference}` : ""}</Typography>}
        </CardContent></Card>

        {selected.type !== "overview" && <Card variant="outlined"><CardContent sx={{ p: { xs: 2, sm: 3 } }}><Typography variant="h6">My private study notes</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Capture questions, key terms or a summary. These notes are saved on this device.</Typography><TextField id={`course-note-${selected.id}`} name={`course_note_${selected.id}`} multiline minRows={5} fullWidth value={notes[selected.id] || ""} onChange={(event) => updateNotes(event.target.value)} placeholder="What did I learn? What should I review? What question can I ask my teacher?" sx={{ mt: 2 }} /></CardContent></Card>}

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          {selected.type === "overview" ? <Box /> : <Button variant={isComplete ? "outlined" : "contained"} startIcon={<CheckCircleIcon />} onClick={markComplete} disabled={isComplete}>{isComplete ? "Item completed" : "Mark complete"}</Button>}
          <Button endIcon={<NavigateNextIcon />} onClick={goNext} disabled={selectedIndex === items.length - 1}>Next {items[selectedIndex + 1]?.type === "lesson" ? "lesson" : "item"}</Button>
        </Stack>
      </Stack>
    </Box>
  </Box><JuaCompanion /></>;
};

export default SubjectContent;
