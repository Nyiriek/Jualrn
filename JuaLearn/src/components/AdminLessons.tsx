import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Typography,
  Button,
  Modal,
  TextField,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Table,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type Lesson = {
  id: number;
  title: string;
  subject: { id: number; name: string };
  content: string;
};

const AdminLessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState({ title: '', subject: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchLessons();
    fetchSubjects();
  }, []);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lessons/');
      setLessons(res.data);
      setError(null);
    } catch (e) {
      setError('Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects/');
      setSubjects(res.data);
    } catch {
    }
  };

  const openAddModal = () => {
    setEditLesson(null);
    setForm({ title: '', subject: '', content: '' });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditLesson(lesson);
    setForm({ title: lesson.title, subject: lesson.subject.id.toString(), content: lesson.content });
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${id}/`);
      fetchLessons();
    } catch {
      alert('Failed to delete lesson');
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.subject || !form.content.trim()) {
      setError('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        subject: parseInt(form.subject, 10),
        content: form.content,
      };
      if (editLesson) {
        await api.patch(`/lessons/${editLesson.id}/`, payload);
      } else {
        await api.post('/lessons/', payload);
      }
      setModalOpen(false);
      fetchLessons();
    } catch {
      setError('Failed to save lesson');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Lessons
      </Typography>
      <Button variant="contained" onClick={openAddModal} sx={{ mb: 2 }}>
        Add Lesson
      </Button>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : lessons.length === 0 ? (
        <Typography>No lessons found.</Typography>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => (
              <tr key={lesson.id}>
                <td>{lesson.title}</td>
                <td>{lesson.subject.name}</td>
                <td>
                  <IconButton onClick={() => openEditModal(lesson)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(lesson.id)}>
                    <DeleteIcon />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            p: 4,
            maxWidth: 600,
            margin: '10% auto',
            background: '#fff',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editLesson ? 'Edit Lesson' : 'Add Lesson'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Subject"
            fullWidth
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="" />
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </TextField>

          <TextField
            label="Content (Markdown)"
            multiline
            minRows={10}
            fullWidth
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : editLesson ? 'Save Changes' : 'Add Lesson'}
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default AdminLessons;
