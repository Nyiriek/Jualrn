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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "../api/axios";

type Subject = { id: number; name: string; description?: string };
type Student = { id: number; full_name: string; email?: string };
type Assignment = {
  id: number;
  title: string;
  description?: string;
  subject: Subject;
  assigned_to?: Student | null;
  due_date: string;
  created_at: string;
  grade?: number | null;
  published?: boolean;
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";

const TeacherAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    assigned_to: "",
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Track publishing state per assignment
  const [publishingAssignmentIds, setPublishingAssignmentIds] = useState<number[]>([]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/assignments/");
      setAssignments(res.data);
    } catch (e: any) {
      setError(e.message || "Failed to load assignments.");
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
    fetchAssignments();
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setEditAssignmentId(null);
    setForm({ title: "", description: "", subject: "", assigned_to: "", due_date: "" });
    setEnrolledStudents([]);
    setModalOpen(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditAssignmentId(assignment.id);
    setForm({
      title: assignment.title,
      description: assignment.description || "",
      subject: assignment.subject.id.toString(),
      assigned_to: assignment.assigned_to ? assignment.assigned_to.id.toString() : "",
      due_date: assignment.due_date.slice(0, 10),
    });
    fetchEnrolledStudents(assignment.subject.id.toString());
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await axios.delete(`/assignments/${id}/`);
      setAssignments(assignments.filter((a) => a.id !== id));
    } catch {
      alert("Failed to delete assignment.");
    }
  };

  const handlePublish = async (assignmentId: number) => {
    setPublishingAssignmentIds((ids) => [...ids, assignmentId]);
    try {
      await axios.post(`/assignments/${assignmentId}/publish/`);
      setAssignments((as) =>
        as.map((a) => (a.id === assignmentId ? { ...a, published: true } : a))
      );
    } catch {
      alert("Failed to publish assignment.");
    } finally {
      setPublishingAssignmentIds((ids) =>
        ids.filter((id) => id !== assignmentId)
      );
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.subject || !form.due_date) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Prepare payload, convert subject and assigned_to to integer or null
    const payload: any = {
      title: form.title,
      description: form.description,
      subject: parseInt(form.subject, 10),
      due_date: form.due_date,
    };
    if (form.assigned_to) {
      payload.assigned_to = parseInt(form.assigned_to, 10);
    } else {
      payload.assigned_to = null; // Allow null for assign to all enrolled
    }

    try {
      if (editAssignmentId) {
        const res = await axios.patch(`/assignments/${editAssignmentId}/`, payload);
        setAssignments(
          assignments.map((a) => (a.id === editAssignmentId ? res.data : a))
        );
      } else {
        const res = await axios.post("/assignments/", payload);
        setAssignments([...assignments, res.data]);
      }
      setModalOpen(false);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to save assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setForm({ ...form, subject: subjectId, assigned_to: "" });
    fetchEnrolledStudents(subjectId);
  };

  const generateFromCourse = async () => {
    if (!form.subject) {
      setError("Choose a course before generating an assignment.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const response = await axios.post("/assignments/generate_from_course/", { subject_id: Number(form.subject) });
      setForm((current) => ({ ...current, title: response.data.title, description: response.data.description }));
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "We could not generate an assignment from this course.");
    } finally {
      setGenerating(false);
    }
  };

  const selectedSubject = subjects.find((subject) => subject.id.toString() === form.subject);

  return (
    <Box sx={{ maxWidth: 1120, mx: "auto", pb: 3 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2.125rem" } }}>
            Assignments
          </Typography>
          <Typography color="text.secondary">Create, publish, and manage student work.</Typography>
        </Box>
        <Button variant="contained" onClick={openAddModal} sx={{ alignSelf: { xs: "stretch", sm: "center" } }}>
          Add Assignment
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : assignments.length === 0 ? (
        <Typography>No assignments found.</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              variant="outlined"
              sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                  <Typography variant="h6" sx={{ wordBreak: "break-word" }}>{assignment.title}</Typography>
                  <Chip size="small" color={assignment.published ? "success" : "default"} label={assignment.published ? "Published" : "Draft"} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {assignment.subject.name}
                </Typography>
                {assignment.description && <Typography variant="body2" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>{assignment.description}</Typography>}
                <Typography variant="body2" color="text.secondary">Created {formatDate(assignment.created_at)}</Typography>
                <Typography variant="body2" color="text.secondary">Due {formatDate(assignment.due_date)}</Typography>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 0.5, flexWrap: "wrap" }}>
                  {!assignment.published && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePublish(assignment.id)}
                      disabled={publishingAssignmentIds.includes(assignment.id)}
                    >
                      {publishingAssignmentIds.includes(assignment.id)
                        ? "Publishing..."
                        : "Publish"}
                    </Button>
                  )}
                  <IconButton edge="end" onClick={() => openEditModal(assignment)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    aria-label={`Delete ${assignment.title}`}
                    onClick={() => handleDelete(assignment.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} sx={{ overflowY: "auto" }}>
        <Box
          sx={{
            p: { xs: 2.5, sm: 4 },
            width: "calc(100% - 32px)",
            maxWidth: 480,
            margin: { xs: "16px auto", sm: "10% auto" },
            bgcolor: "background.paper",
            borderRadius: 2,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editAssignmentId ? "Edit Assignment" : "Add Assignment"}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            id="assignment-title"
            name="title"
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            id="assignment-instructions"
            name="description"
            label="Instructions"
            fullWidth
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="subject-label">Subject</InputLabel>
            <Select
              id="assignment-subject"
              name="subject"
              labelId="subject-label"
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

          {selectedSubject && <Box sx={{ mb: 2 }}><Alert severity="info"><Typography variant="subtitle2">Course description: {selectedSubject.name}</Typography>{selectedSubject.description || "This course does not have a description yet."}</Alert><Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={generateFromCourse} disabled={generating}>{generating ? "Generating…" : "Generate assignment from course"}</Button></Box>}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="assigned-to-label">Assign To</InputLabel>
            <Select
              id="assignment-assigned-to"
              name="assigned_to"
              labelId="assigned-to-label"
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
                    {student.full_name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <TextField
            id="assignment-due-date"
            name="due_date"
            label="Due Date"
            type="date"
            fullWidth
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            helperText="Choose the due date from the calendar."
            required
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : editAssignmentId ? "Save Changes" : "Add Assignment"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default TeacherAssignments;
