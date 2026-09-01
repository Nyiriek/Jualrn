import React, { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, Collapse,
  Divider, IconButton, Modal, Snackbar, Stack, TextField, Typography,
  FormControl, InputLabel, MenuItem, Select,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import axios from "../api/axios";
import ResourceRepositoryPicker, { LearningResource } from "../components/ResourceRepositoryPicker";
import { getCourseCover } from "../utils/courseCover";

type Course = {
  id: number;
  name: string;
  description: string;
  content?: string;
  published?: boolean;
  resources?: LearningResource[];
};

type Lesson = {
  id: number;
  subject: number;
  title: string;
  content: string;
  date_created: string;
};

type LessonSource = {
  id: string;
  title: string;
  content: string;
  description?: string;
};

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", content: "" });
  const [selectedResources, setSelectedResources] = useState<LearningResource[]>([]);
  const [repositoryResources, setRepositoryResources] = useState<LearningResource[]>([]);
  const [repositorySubject, setRepositorySubject] = useState("");
  const [repositoryTopic, setRepositoryTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publishingIds, setPublishingIds] = useState<number[]>([]);
  const [success, setSuccess] = useState("");
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonCourseId, setLessonCourseId] = useState<number | null>(null);
  const [editLessonId, setEditLessonId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", content: "" });
  const [lessonSourceId, setLessonSourceId] = useState("");
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const response = await axios.get("/subjects/");
      setCourses(response.data);
    } catch (error: any) {
      setPageError(error.message || "Failed to load your courses.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await axios.get("/lessons/");
      setLessons(response.data);
    } catch {
      setPageError("We could not load the lessons for your courses.");
    }
  };

  useEffect(() => { fetchCourses(); fetchLessons(); }, []);

  useEffect(() => {
    if (!modalOpen) return;
    axios.get("/learning-resources/")
      .then((response) => setRepositoryResources(response.data))
      .catch(() => setRepositoryResources([]));
  }, [modalOpen]);

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setFormError(null);
  };

  const openAddModal = () => {
    setEditCourseId(null);
    setForm({ name: "", description: "", content: "" });
    setSelectedResources([]);
    setRepositorySubject("");
    setRepositoryTopic("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditCourseId(course.id);
    setForm({ name: course.name, description: course.description || "", content: course.content || "" });
    setSelectedResources(course.resources || []);
    setRepositorySubject("");
    setRepositoryTopic("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setFormError("Give the course a clear name and description before saving.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editCourseId) {
        const response = await axios.patch(`/subjects/${editCourseId}/`, { ...form, resource_ids: selectedResources.map((resource) => resource.id) });
        setCourses((current) => current.map((course) => course.id === editCourseId ? response.data : course));
        setExpandedCourseId(editCourseId);
        setSuccess("Course updated.");
      } else {
        const response = await axios.post("/subjects/", { ...form, resource_ids: selectedResources.map((resource) => resource.id) });
        setCourses((current) => [response.data, ...current]);
        setExpandedCourseId(response.data.id);
        setSuccess("Course created as a draft. Its resources are ready; add distinct student lessons when your learning sequence is ready.");
      }
      setModalOpen(false);
    } catch (error: any) {
      setFormError(error.response?.data?.detail || "We could not save this course. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Delete “${course.name}”? This cannot be undone.`)) return;
    try {
      await axios.delete(`/subjects/${course.id}/`);
      setCourses((current) => current.filter((item) => item.id !== course.id));
      if (expandedCourseId === course.id) setExpandedCourseId(null);
      setSuccess("Course deleted.");
    } catch {
      setPageError("We could not delete that course. Please try again.");
    }
  };

  const handlePublish = async (course: Course) => {
    setPublishingIds((current) => [...current, course.id]);
    try {
      await axios.post(`/subjects/${course.id}/publish/`);
      setCourses((current) => current.map((item) => item.id === course.id ? { ...item, published: true } : item));
      setSuccess(`“${course.name}” is now published for learners.`);
    } catch {
      setPageError("We could not publish that course. Please try again.");
    } finally {
      setPublishingIds((current) => current.filter((id) => id !== course.id));
    }
  };

  const openAddLessonModal = (course: Course) => {
    setLessonCourseId(course.id);
    setEditLessonId(null);
    setLessonForm({ title: "", content: "" });
    setLessonSourceId("");
    setLessonError(null);
    setLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson) => {
    setLessonCourseId(lesson.subject);
    setEditLessonId(lesson.id);
    setLessonForm({ title: lesson.title, content: lesson.content });
    setLessonSourceId("");
    setLessonError(null);
    setLessonModalOpen(true);
  };

  const saveLesson = async () => {
    if (!lessonCourseId || !lessonForm.title.trim() || !lessonForm.content.trim()) {
      setLessonError("Add a title and lesson content before saving.");
      return;
    }
    setSavingLesson(true);
    setLessonError(null);
    const payload = { subject: lessonCourseId, title: lessonForm.title.trim(), content: lessonForm.content.trim() };
    try {
      if (editLessonId) {
        const response = await axios.patch(`/lessons/${editLessonId}/`, payload);
        setLessons((current) => current.map((lesson) => lesson.id === editLessonId ? response.data : lesson));
        setSuccess("Lesson updated.");
      } else {
        const response = await axios.post("/lessons/", payload);
        setLessons((current) => [...current, response.data]);
        setSuccess("Lesson added to the course.");
      }
      setLessonModalOpen(false);
    } catch (error: any) {
      setLessonError(error.response?.data?.detail || "We could not save this lesson. Please try again.");
    } finally {
      setSavingLesson(false);
    }
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!window.confirm(`Delete the lesson “${lesson.title}”?`)) return;
    try {
      await axios.delete(`/lessons/${lesson.id}/`);
      setLessons((current) => current.filter((item) => item.id !== lesson.id));
      setSuccess("Lesson deleted.");
    } catch {
      setPageError("We could not delete this lesson. Please try again.");
    }
  };

  const activeLessonCourse = courses.find((course) => course.id === lessonCourseId);
  const lessonSources: LessonSource[] = [
    ...(activeLessonCourse?.resources || []).map((resource) => ({
      id: `resource-${resource.id}`,
      title: resource.title,
      content: resource.content || resource.description,
      description: resource.description,
    })),
    ...(activeLessonCourse?.content ? [{
      id: "course-overview",
      title: `${activeLessonCourse.name}: course overview`,
      content: activeLessonCourse.content,
      description: activeLessonCourse.description,
    }] : []),
  ];

  const selectLessonSource = (sourceId: string) => {
    setLessonSourceId(sourceId);
    const source = lessonSources.find((item) => item.id === sourceId);
    if (!source) return;
    setLessonForm({
      title: `Lesson: ${source.title}`,
      content: `Lesson goal\nStudents will use this material to explain key ideas and apply them in a short task.\n\nStarter\nAsk students what they already know about this topic and record two questions they want to answer.\n\nLearning material\n${source.content || source.description || "Add the learning material here."}\n\nGuided activity\nIn pairs, identify key vocabulary, work through an example, and explain your reasoning.\n\nIndependent check\nWrite one evidence-based response and one takeaway from the lesson.`,
    });
  };

  const selectRepositoryTopic = (resourceId: string) => {
    setRepositoryTopic(resourceId);
    const resource = repositoryResources.find((item) => item.id.toString() === resourceId);
    if (!resource) return;
    setForm((current) => ({
      ...current,
      name: current.name || resource.title,
      description: resource.description,
      content: current.content || resource.content,
    }));
    const relatedResources = repositoryResources.filter((item) =>
      item.subject_area === resource.subject_area && (item.topic === resource.topic || item.id === resource.id)
    );
    setSelectedResources((current) => [
      ...current,
      ...relatedResources.filter((item) => !current.some((selected) => selected.id === item.id)),
    ]);
  };

  const repositorySubjects = [...new Set(repositoryResources.map((resource) => resource.subject_area).filter(Boolean))];
  const repositoryTopics = repositoryResources.filter((resource) =>
    resource.subject_area === repositorySubject && (!resource.topic || resource.topic === resource.title)
  );

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center"><Typography variant="h4">My courses</Typography><Chip label={`${courses.length} total`} size="small" variant="outlined" /></Stack>
          <Typography color="text.secondary" sx={{ mt: .5 }}>Create, refine and publish learning spaces for your students.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>Add course</Button>
      </Stack>

      {pageError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError(null)}>{pageError}</Alert>}

      {loading ? (
        <Box sx={{ minHeight: 240, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : courses.length === 0 ? (
        <Card variant="outlined" sx={{ minHeight: 260, display: "grid", placeItems: "center", textAlign: "center" }}>
          <CardContent><MenuBookOutlinedIcon color="primary" sx={{ fontSize: 44, mb: 1 }} /><Typography variant="h6">Start your first course</Typography><Typography color="text.secondary" sx={{ maxWidth: 400, my: 1 }}>Add a name, short description and key topics. You can keep it as a draft until the content is ready.</Typography><Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal}>Create course</Button></CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          {courses.map((course) => {
            const expanded = expandedCourseId === course.id;
            const topicCount = course.content ? course.content.split(/\n|,/).filter(Boolean).length : 0;
            const courseLessons = lessons.filter((lesson) => lesson.subject === course.id);
            return <Card key={course.id} sx={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
              <CardMedia component="img" height="144" image={getCourseCover(course.name)} alt={`${course.name} course cover`} sx={{ objectFit: "cover" }} />
              <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box sx={{ minWidth: 0 }}><Button variant="text" color="inherit" onClick={() => setExpandedCourseId(expanded ? null : course.id)} sx={{ display: "block", p: 0, minWidth: 0, textAlign: "left", textTransform: "none" }}><Typography variant="h6" noWrap title={course.name}>{course.name}</Typography></Button><Typography variant="caption" color="text.secondary">{topicCount ? `${topicCount} topic${topicCount === 1 ? "" : "s"} added` : "No topics added yet"}</Typography></Box>
                  <Chip label={course.published ? "Published" : "Draft"} size="small" color={course.published ? "success" : "default"} />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 2, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "3.9em" }}>{course.description || "Add a short description to help students understand this course."}</Typography>
                {!!course.resources?.length && <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.5 }}>{course.resources.slice(0, 3).map((resource) => <Chip key={resource.id} label={resource.title} size="small" variant="outlined" />)}{course.resources.length > 3 && <Chip label={`+${course.resources.length - 3} resources`} size="small" variant="outlined" />}</Stack>}
                <Collapse in={expanded}><Divider sx={{ my: 2 }} /><Typography variant="subtitle2">Course content</Typography><Typography sx={{ mt: .5, whiteSpace: "pre-wrap" }} color={course.content ? "text.primary" : "text.secondary"}>{course.content || "No topics have been added yet. Edit the course to add learning content."}</Typography>{!!course.resources?.length && <><Typography variant="subtitle2" sx={{ mt: 2 }}>Linked teaching resources</Typography><Stack spacing={1} sx={{ mt: 1 }}>{course.resources.map((resource) => <Box key={resource.id} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 1 }}><Typography fontWeight={600}>{resource.title}</Typography><Typography variant="body2" color="text.secondary">{resource.description}</Typography>{resource.content && <Typography variant="body2" sx={{ mt: .75, whiteSpace: "pre-wrap" }}>{resource.content}</Typography>}</Box>)}</Stack></>}<Divider sx={{ my: 2 }} /><Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}><Box><Typography variant="subtitle2">Lessons</Typography><Typography variant="caption" color="text.secondary">These are displayed to students in the course.</Typography></Box><Button size="small" startIcon={<AddIcon />} onClick={() => openAddLessonModal(course)}>Add lesson</Button></Stack><Stack spacing={1} sx={{ mt: 1.25 }}>{courseLessons.length === 0 ? <Alert severity="info">No lessons added yet. Add one to give students a structured place to start.</Alert> : courseLessons.map((lesson) => <Box key={lesson.id} sx={{ p: 1.25, border: 1, borderColor: "divider", borderRadius: 1 }}><Stack direction="row" gap={1} justifyContent="space-between" alignItems="flex-start"><Box sx={{ minWidth: 0 }}><Typography fontWeight={600}>{lesson.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mt: .5 }}>{lesson.content}</Typography></Box><Stack direction="row" spacing={0.25}><IconButton size="small" aria-label={`Edit ${lesson.title}`} onClick={() => openEditLessonModal(lesson)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" aria-label={`Delete ${lesson.title}`} onClick={() => deleteLesson(lesson)}><DeleteIcon fontSize="small" /></IconButton></Stack></Stack></Box>)}</Stack></Collapse>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0, display: "flex", flexWrap: "wrap", gap: .5, justifyContent: "space-between" }}>
                <Button size="small" endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setExpandedCourseId(expanded ? null : course.id)}>{expanded ? "Hide details" : "View details"}</Button>
                <Stack direction="row" spacing={.5} sx={{ ml: "auto" }}>
                  <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => openAddLessonModal(course)}>Lesson</Button>
                  {!course.published && <Button size="small" color="success" variant="contained" onClick={() => handlePublish(course)} disabled={publishingIds.includes(course.id)}>{publishingIds.includes(course.id) ? "Publishing" : "Publish"}</Button>}
                  <IconButton size="small" aria-label={`edit ${course.name}`} onClick={() => openEditModal(course)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" aria-label={`delete ${course.name}`} onClick={() => handleDelete(course)}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              </CardActions>
            </Card>;
          })}
        </Box>
      )}

      <Modal open={modalOpen} onClose={closeModal} aria-labelledby="course-form-title">
        <Box sx={{ width: "calc(100% - 32px)", maxWidth: 560, maxHeight: "calc(100vh - 32px)", overflowY: "auto", m: { xs: "16px auto", sm: "7vh auto" }, p: { xs: 2, sm: 3 }, bgcolor: "background.paper", borderRadius: 2, boxShadow: 24 }}>
          <Typography id="course-form-title" variant="h6">{editCourseId ? "Edit course" : "Create a course"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>{editCourseId ? "Update the course information below." : "Your course will be saved as a draft until you publish it."}</Typography>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Start from the course repository</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>Choose a subject and topic to automatically add its course description and teaching material.</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="repository-subject-label">Repository subject</InputLabel>
                  <Select labelId="repository-subject-label" id="repository-subject" name="repository_subject" label="Repository subject" value={repositorySubject} onChange={(event) => { setRepositorySubject(event.target.value); setRepositoryTopic(""); }}>
                    <MenuItem value="">Choose a subject</MenuItem>
                    {repositorySubjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={!repositorySubject}>
                  <InputLabel id="repository-topic-label">Repository topic</InputLabel>
                  <Select labelId="repository-topic-label" id="repository-topic" name="repository_topic" label="Repository topic" value={repositoryTopic} onChange={(event) => selectRepositoryTopic(event.target.value)}>
                    <MenuItem value="">Choose a topic</MenuItem>
                    {repositoryTopics.map((resource) => <MenuItem key={resource.id} value={resource.id.toString()}>{resource.title}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
            <TextField id="course-name" name="course_name" label="Course name" fullWidth value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required autoFocus />
            <TextField id="course-description" name="course_description" label="Course description" fullWidth multiline rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} helperText="Explain what students will learn in the selected topic or course." required />
            <TextField id="course-content" name="course_content" label="Topics and learning material" fullWidth multiline rows={6} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} helperText="Use short paragraphs or one topic per line." />
            <Box><Typography variant="subtitle2" sx={{ mb: 0.75 }}>Teaching resources</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Link curated readings, activities and assessment prompts from the repository.</Typography><ResourceRepositoryPicker value={selectedResources} onChange={setSelectedResources} /></Box>
            <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end" spacing={1}><Button onClick={closeModal} disabled={submitting}>Cancel</Button><Button variant="contained" onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving…" : editCourseId ? "Save changes" : "Create draft"}</Button></Stack>
          </Stack>
        </Box>
      </Modal>
      <Modal open={lessonModalOpen} onClose={() => !savingLesson && setLessonModalOpen(false)} aria-labelledby="lesson-form-title">
        <Box sx={{ width: "calc(100% - 32px)", maxWidth: 620, maxHeight: "calc(100vh - 32px)", overflowY: "auto", m: { xs: "16px auto", sm: "10vh auto" }, p: { xs: 2, sm: 3 }, bgcolor: "background.paper", borderRadius: 2, boxShadow: 24 }}>
          <Typography id="lesson-form-title" variant="h6">{editLessonId ? "Edit lesson" : "Add a lesson"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Students will see this lesson inside the selected course.</Typography>
          {lessonError && <Alert severity="error" sx={{ mb: 2 }}>{lessonError}</Alert>}
          <Stack spacing={2}>
            {!editLessonId && <Box><Typography variant="subtitle2" sx={{ mb: 0.75 }}>Build from course repository content</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Choose linked course material to prepare a lesson draft automatically.</Typography>{lessonSources.length ? <FormControl fullWidth><InputLabel id="lesson-source-label">Course content source</InputLabel><Select labelId="lesson-source-label" id="lesson-source" name="lesson_source" label="Course content source" value={lessonSourceId} onChange={(event) => selectLessonSource(event.target.value)}><MenuItem value="">Start with a blank lesson</MenuItem>{lessonSources.map((source) => <MenuItem key={source.id} value={source.id}>{source.title}</MenuItem>)}</Select></FormControl> : <Alert severity="info">This course has no linked repository material yet. Add a course resource or course content first, or create the lesson manually.</Alert>}</Box>}
            <TextField id="lesson-title" name="lesson_title" label="Lesson title" fullWidth value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} required autoFocus />
            <TextField id="lesson-content" name="lesson_content" label="Lesson content" fullWidth multiline minRows={9} value={lessonForm.content} onChange={(event) => setLessonForm({ ...lessonForm, content: event.target.value })} helperText="Add notes, instructions, examples or an activity for students." required />
            <Stack direction={{ xs: "column-reverse", sm: "row" }} justifyContent="flex-end" spacing={1}><Button onClick={() => setLessonModalOpen(false)} disabled={savingLesson}>Cancel</Button><Button variant="contained" onClick={saveLesson} disabled={savingLesson}>{savingLesson ? "Saving…" : editLessonId ? "Save changes" : "Add lesson"}</Button></Stack>
          </Stack>
        </Box>
      </Modal>
      <Snackbar open={Boolean(success)} autoHideDuration={4000} onClose={() => setSuccess("")} message={success} />
    </Box>
  );
};

export default TeacherCourses;
