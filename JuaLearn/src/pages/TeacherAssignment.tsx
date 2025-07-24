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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "../api/axios";

type Subject = { id: number; name: string };
type Student = { id: number; full_name: string; email?: string };
type Assignment = {
  id: number;
  title: string;
  subject: Subject;
  assigned_to?: Student | null;
  due_date: string;
  grade?: number | null;
  published?: boolean;
};

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
    subject: "",
    assigned_to: "",
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);

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
    setForm({ title: "", subject: "", assigned_to: "", due_date: "" });
    setEnrolledStudents([]);
    setModalOpen(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditAssignmentId(assignment.id);
    setForm({
      title: assignment.title,
      subject: assignment.subject.id.toString(),
      assigned_to: assignment.assigned_to ? assignment.assigned_to.id.toString() : "",
      due_date: assignment.due_date,
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Assignments
      </Typography>

      <Button variant="contained" onClick={openAddModal} sx={{ mb: 2 }}>
        Add Assignment
      </Button>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : assignments.length === 0 ? (
        <Typography>No assignments found.</Typography>
      ) : (
        <List>
          {assignments.map((assignment) => (
            <ListItem
              key={assignment.id}
              secondaryAction={
                <>
                  {!assignment.published && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePublish(assignment.id)}
                      disabled={publishingAssignmentIds.includes(assignment.id)}
                      sx={{ mr: 1 }}
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
                    edge="end"
                    color="error"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={assignment.title}
                secondary={`Subject: ${assignment.subject.name} | Due: ${assignment.due_date} | ${
                  assignment.published ? "Published" : "Unpublished"
                }`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            p: 4,
            maxWidth: 400,
            margin: "10% auto",
            bgcolor: "background.paper",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editAssignmentId ? "Edit Assignment" : "Add Assignment"}
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
            <InputLabel id="subject-label">Subject</InputLabel>
            <Select
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

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="assigned-to-label">Assign To</InputLabel>
            <Select
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
            label="Due Date"
            type="date"
            fullWidth
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
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
