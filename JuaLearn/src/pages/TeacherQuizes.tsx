import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "../api/axios";

// Import the new component for managing quiz questions
import QuizQuestionsManager from "../components/QuizQuestionsManager";

type Subject = { id: number; name: string };
type Student = { id: number; full_name: string; username?: string };
type Quiz = {
  id: number;
  title: string;
  subject: Subject;
  description: string;
  date_created: string;
  assigned_to?: Student | null;
  due_date: string;
  published?: boolean;
};

const TeacherQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editQuizId, setEditQuizId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    assigned_to: "",
    due_date: "",
  });
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
    setForm({ title: "", subject: "", description: "", assigned_to: "", due_date: "" });
    setEnrolledStudents([]);
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
    fetchEnrolledStudents(quiz.subject.id.toString());
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
    if (!form.title.trim() || !form.subject || !form.due_date) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload: any = {
      title: form.title,
      subject: parseInt(form.subject, 10),
      description: form.description,
      due_date: form.due_date,
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
      } else {
        const res = await axios.post("/quizzes/", payload);
        setQuizzes([...quizzes, res.data]);
        setEditQuizId(res.data.id);
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to save quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setForm({ ...form, subject: subjectId, assigned_to: "" });
    fetchEnrolledStudents(subjectId);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Quizzes
      </Typography>

      <Button variant="contained" onClick={openAddModal} sx={{ mb: 2 }}>
        Add Quiz
      </Button>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : quizzes.length === 0 ? (
        <Typography>No quizzes found.</Typography>
      ) : (
        <List>
          {quizzes.map((quiz) => (
            <ListItem
              key={quiz.id}
              secondaryAction={
                <>
                  {!quiz.published && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePublish(quiz.id)}
                      disabled={publishingQuizIds.includes(quiz.id)}
                      sx={{ mr: 1 }}
                    >
                      {publishingQuizIds.includes(quiz.id)
                        ? "Publishing..."
                        : "Publish"}
                    </Button>
                  )}
                  <IconButton edge="end" onClick={() => openEditModal(quiz)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleDelete(quiz.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={quiz.title}
                secondary={`Subject: ${quiz.subject.name} | Created: ${new Date(
                  quiz.date_created
                ).toLocaleDateString()} | ${
                  quiz.published ? "Published" : "Unpublished"
                }`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} sx={{ overflowY: 'auto' }}>
        <Box
          sx={{
            p: 4,
            maxWidth: 600,
            margin: "5% auto",
            bgcolor: "background.paper",
            borderRadius: 2,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editQuizId ? "Edit Quiz" : "Add Quiz"}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="quiz-subject-label">Subject</InputLabel>
            <Select
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

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="quiz-assigned-to-label">Assign To</InputLabel>
            <Select
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
            label="Due Date"
            type="date"
            fullWidth
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />

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
