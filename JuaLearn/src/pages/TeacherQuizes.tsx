import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "../api/axios";

// Import the new component for managing quiz questions
import QuizQuestionsManager from "../components/QuizQuestionsManager";
import ResourceRepositoryPicker, { LearningResource } from "../components/ResourceRepositoryPicker";

type Subject = { id: number; name: string; description?: string };
type Student = { id: number; full_name: string; username?: string };
type Quiz = {
  id: number;
  title: string;
  subject: Subject;
  description: string;
  created_at: string;
  assigned_to?: Student | null;
  due_date: string;
  published?: boolean;
  resources?: LearningResource[];
};

const defaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

const blankQuizForm = () => ({ title: "", subject: "", description: "", assigned_to: "", due_date: defaultDueDate() });

const apiError = (data: any) => {
  if (!data) return "Failed to save quiz.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  return Object.values(data).flat().filter(Boolean).join(" ") || "Failed to save quiz.";
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";

const TeacherQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editQuizId, setEditQuizId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    assigned_to: "",
    due_date: defaultDueDate(),
  });
  const [selectedResources, setSelectedResources] = useState<LearningResource[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Track publishing state per quiz
  const [publishingQuizIds, setPublishingQuizIds] = useState<number[]>([]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/quizzes/");
      setQuizzes(res.data);
    } catch (e: any) {
      setError(e.message || "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get("/subjects/");
      setSubjects(res.data);
    } catch {
      // ignore
    }
  };

  const fetchEnrolledStudents = async (subjectId: string) => {
    if (!subjectId) {
      setEnrolledStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const res = await axios.get(`/subjects/${subjectId}/enrolled_students/`);
      setEnrolledStudents(res.data);
    } catch {
      setEnrolledStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setEditQuizId(null);
    setForm(blankQuizForm());
    setSelectedResources([]);
    setEnrolledStudents([]);
    setFormError(null);
    setFormMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (quiz: Quiz) => {
    setEditQuizId(quiz.id);
    setForm({
      title: quiz.title,
      subject: quiz.subject.id.toString(),
      description: quiz.description,
      assigned_to: quiz.assigned_to?.id?.toString() || "",
      due_date: quiz.due_date,
    });
    setSelectedResources(quiz.resources || []);
    fetchEnrolledStudents(quiz.subject.id.toString());
    setFormError(null);
    setFormMessage(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await axios.delete(`/quizzes/${id}/`);
      setQuizzes(quizzes.filter((q) => q.id !== id));
    } catch {
      alert("Failed to delete quiz.");
    }
  };

  const handlePublish = async (quizId: number) => {
    setPublishingQuizIds((ids) => [...ids, quizId]);
    try {
      await axios.post(`/quizzes/${quizId}/publish/`);
      setQuizzes((qs) =>
        qs.map((q) => (q.id === quizId ? { ...q, published: true } : q))
      );
    } catch {
      alert("Failed to publish quiz.");
    } finally {
      setPublishingQuizIds((ids) => ids.filter((id) => id !== quizId));
    }
  };

  const handleSubmit = async () => {
    const missing = [
      !form.title.trim() && "quiz title",
      !form.subject && "course/subject",
      !form.due_date && "due date",
    ].filter(Boolean);
    if (missing.length) {
      setFormError(`Please complete: ${missing.join(", ")}.`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFormMessage(null);

    const payload: any = {
      title: form.title,
      subject: parseInt(form.subject, 10),
      description: form.description,
      due_date: form.due_date,
      resource_ids: selectedResources.map((resource) => resource.id),
    };

    if (form.assigned_to) {
      payload.assigned_to = parseInt(form.assigned_to, 10);
    } else {
      payload.assigned_to = null;
    }

    try {
      if (editQuizId) {
        const res = await axios.patch(`/quizzes/${editQuizId}/`, payload);
        setQuizzes(quizzes.map((q) => (q.id === editQuizId ? res.data : q)));
        setFormMessage("Quiz details saved. You can continue editing its questions below.");
      } else {
        const res = await axios.post("/quizzes/", payload);
        setQuizzes([...quizzes, res.data]);
        setEditQuizId(res.data.id);
        setFormMessage("Quiz created. Add multiple-choice questions or questionnaire responses below, then publish when it is ready.");
      }
    } catch (e: any) {
      setFormError(apiError(e.response?.data));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setForm({ ...form, subject: subjectId, assigned_to: "" });
    fetchEnrolledStudents(subjectId);
  };

  const selectedSubject = subjects.find((subject) => subject.id.toString() === form.subject);

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", pb: 3 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" } }}>
            Quizzes
          </Typography>
          <Typography color="text.secondary">Build assessments and publish them when they are ready.</Typography>
          {!loading && <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}><Chip size="small" variant="outlined" label={`${quizzes.length} total`} /><Chip size="small" color="success" variant="outlined" label={`${quizzes.filter((quiz) => quiz.published).length} published`} /><Chip size="small" variant="outlined" label={`${quizzes.filter((quiz) => !quiz.published).length} drafts`} /></Stack>}
        </Box>
        <Button variant="contained" onClick={openAddModal} sx={{ alignSelf: { xs: "stretch", sm: "center" } }}>
          Add Quiz
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : quizzes.length === 0 ? (
        <Typography>No quizzes found.</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              variant="outlined"
              sx={{ display: "flex", flexDirection: "column", minWidth: 0, borderTop: 4, borderTopColor: quiz.published ? "success.main" : "divider" }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                  <Typography variant="h6" sx={{ wordBreak: "break-word" }}>{quiz.title}</Typography>
                  <Chip size="small" color={quiz.published ? "success" : "default"} label={quiz.published ? "Published" : "Draft"} />
                </Box>
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}><Chip size="small" color="primary" variant="outlined" label={quiz.subject.name} />{!!quiz.resources?.length && <Chip size="small" variant="outlined" label={`${quiz.resources.length} resource${quiz.resources.length === 1 ? "" : "s"}`} />}</Stack>
                {quiz.description && <Typography variant="body2" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>{quiz.description}</Typography>}
                <Box sx={{ mt: "auto", p: 1.25, borderRadius: 1.5, bgcolor: "action.hover", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}><Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2" fontWeight={600}>{formatDate(quiz.created_at)}</Typography></Box><Box><Typography variant="caption" color="text.secondary">Due</Typography><Typography variant="body2" fontWeight={600}>{formatDate(quiz.due_date)}</Typography></Box></Box>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 0.5, flexWrap: "wrap" }}>
                  {!quiz.published && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePublish(quiz.id)}
                      disabled={publishingQuizIds.includes(quiz.id)}
                    >
                      {publishingQuizIds.includes(quiz.id)
                        ? "Publishing..."
                        : "Publish"}
                    </Button>
                  )}
                  <IconButton aria-label={`Edit ${quiz.title}`} onClick={() => openEditModal(quiz)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    aria-label={`Delete ${quiz.title}`}
                    onClick={() => handleDelete(quiz.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} sx={{ overflowY: 'auto' }}>
        <Box
              sx={{
            p: { xs: 2, sm: 4 },
            width: "calc(100% - 32px)",
            maxWidth: 720,
            margin: { xs: "16px auto", sm: "5% auto" },
            bgcolor: "background.paper",
            borderRadius: 2,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editQuizId ? "Edit Quiz" : "Add Quiz"}
          </Typography>

          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formMessage && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFormMessage(null)}>{formMessage}</Alert>}

          <TextField
            id="quiz-title"
            name="title"
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            A quiz can include both <strong>multiple-choice</strong> questions and <strong>questionnaire / written-response</strong> questions. Save the quiz first, then use the dedicated question buttons below.
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="quiz-subject-label">Subject</InputLabel>
            <Select
              id="quiz-subject"
              name="subject"
              labelId="quiz-subject-label"
              value={form.subject}
              label="Subject"
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
            >
              {subjects.map((subj) => (
                <MenuItem key={subj.id} value={subj.id.toString()}>
                  {subj.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSubject && <Alert severity="info" sx={{ mb: 2 }}><Typography variant="subtitle2">Course description: {selectedSubject.name}</Typography>{selectedSubject.description || "This course does not have a description yet."}</Alert>}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="quiz-assigned-to-label">Assign To</InputLabel>
            <Select
              id="quiz-assigned-to"
              name="assigned_to"
              labelId="quiz-assigned-to-label"
              value={form.assigned_to}
              label="Assign To"
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              disabled={!form.subject || loadingStudents}
            >
              <MenuItem value="">Assign to All Enrolled</MenuItem>
              {loadingStudents ? (
                <MenuItem disabled>Loading students...</MenuItem>
              ) : enrolledStudents.length === 0 ? (
                <MenuItem disabled>No enrolled students</MenuItem>
              ) : (
                enrolledStudents.map((student) => (
                  <MenuItem key={student.id} value={student.id.toString()}>
                    {student.full_name || student.username}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <TextField
            id="quiz-due-date"
            name="due_date"
            label="Due Date"
            type="date"
            fullWidth
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().slice(0, 10) }}
            required
          />

          <TextField
            id="quiz-description"
            name="description"
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Quiz resources</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Link readings or activity prompts to guide question design.</Typography>
            <ResourceRepositoryPicker value={selectedResources} onChange={setSelectedResources} />
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ mb: 3 }}
          >
            {submitting ? "Saving..." : editQuizId ? "Save Changes" : "Add Quiz"}
          </Button>

          {/* Divider before question manager */}
          <Divider sx={{ mb: 2 }} />

          {/* Only show questions manager if editing an existing quiz */}
          {editQuizId && (
            <QuizQuestionsManager quizId={editQuizId} />
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default TeacherQuizzes;
