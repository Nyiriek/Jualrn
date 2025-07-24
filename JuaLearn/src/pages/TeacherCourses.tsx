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
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "../api/axios";

type Course = {
  id: number;
  name: string;
  description: string;
  content?: string;
  published?: boolean;
};

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [publishingIds, setPublishingIds] = useState<number[]>([]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/subjects/");
      setCourses(res.data);
    } catch (e: any) {
      setError(e.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openAddModal = () => {
    setEditCourseId(null);
    setForm({ name: "", description: "", content: "" });
    setModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditCourseId(course.id);
    setForm({
      name: course.name,
      description: course.description,
      content: course.content || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await axios.delete(`/subjects/${id}/`);
      setCourses(courses.filter((c) => c.id !== id));
    } catch (e) {
      alert("Failed to delete course.");
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Course name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (editCourseId) {
        const res = await axios.patch(`/subjects/${editCourseId}/`, form);
        setCourses(
          courses.map((c) => (c.id === editCourseId ? res.data : c))
        );
      } else {
        const res = await axios.post("/subjects/", form);
        setCourses([...courses, res.data]);
      }
      setModalOpen(false);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to save course.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: number) => {
    setPublishingIds((prev) => [...prev, id]);
    try {
      await axios.post(`/subjects/${id}/publish/`);
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, published: true } : c))
      );
    } catch {
      alert("Failed to publish course.");
    } finally {
      setPublishingIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Courses
      </Typography>

      <Button variant="contained" onClick={openAddModal} sx={{ mb: 2 }}>
        Add Course
      </Button>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : courses.length === 0 ? (
        <Typography>No courses found.</Typography>
      ) : (
        <List>
          {courses.map((course) => (
            <ListItem
              key={course.id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  {!course.published && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handlePublish(course.id)}
                      disabled={publishingIds.includes(course.id)}
                    >
                      {publishingIds.includes(course.id) ? "Publishing..." : "Publish"}
                    </Button>
                  )}
                  <IconButton edge="end" onClick={() => openEditModal(course)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleDelete(course.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={course.name}
                secondary={
                  course.description +
                  (course.published ? " (Published)" : " (Unpublished)")
                }
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
            {editCourseId ? "Edit Course" : "Add Course"}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Course Name"
            fullWidth
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Content / Topics"
            fullWidth
            multiline
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving..." : editCourseId ? "Save Changes" : "Add Course"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default TeacherCourses;
