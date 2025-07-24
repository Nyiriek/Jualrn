import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Typography,
  Table,
  IconButton,
  Button,
  Modal,
  TextField,
  Box,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type Subject = { id: number; name: string; description: string };

const AdminSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = () => {
    api.get('/subjects/')
      .then(res => setSubjects(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddOrEditSubject = () => {
    setError(null);

    if (!newSubject.name.trim()) {
      setError('Subject name is required');
      return;
    }

    if (editSubjectId) {
      api.patch(`/subjects/${editSubjectId}/`, newSubject)
        .then(() => {
          fetchSubjects();
          window.dispatchEvent(new Event('subjectsUpdated'));
          setShowSubjectModal(false);
          setEditSubjectId(null);
          setNewSubject({ name: '', description: '' });
        })
        .catch(e => {
          console.error("Edit subject error response:", e.response);
          setError(parseErrorMessage(e.response?.data) || 'Failed to update subject');
        });
    } else {
      api.post('/subjects/', newSubject)
        .then(() => {
          fetchSubjects();
          window.dispatchEvent(new Event('subjectsUpdated'));
          setShowSubjectModal(false);
          setNewSubject({ name: '', description: '' });
        })
        .catch(e => {
          console.error("Add subject error response:", e.response);
          setError(parseErrorMessage(e.response?.data) || 'Failed to add subject');
        });
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditSubjectId(subject.id);
    setNewSubject({ name: subject.name, description: subject.description });
    setError(null);
    setShowSubjectModal(true);
  };

  // Helper to parse error messages from backend
  const parseErrorMessage = (data: any) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    const firstKey = Object.keys(data)[0];
    let msg = data[firstKey];
    if (Array.isArray(msg)) msg = msg[0];
    return msg;
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Subjects
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          setShowSubjectModal(true);
          setEditSubjectId(null);
          setNewSubject({ name: '', description: '' });
          setError(null);
        }}
        sx={{ mb: 2 }}
      >
        Add Subject
      </Button>

      {/* Subject Table */}
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map(subject => (
            <tr key={subject.id}>
              <td>{subject.name}</td>
              <td>{subject.description}</td>
              <td>
                <IconButton onClick={() => handleEditSubject(subject)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => {
                    api.delete(`/subjects/${subject.id}/`)
                      .then(() => {
                        fetchSubjects();
                        window.dispatchEvent(new Event('subjectsUpdated'));
                      })
                      .catch(console.error);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)}>
        <Box
          sx={{
            p: 4,
            background: '#fff',
            maxWidth: 400,
            margin: '10% auto',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editSubjectId ? 'Edit Subject' : 'Add Subject'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Name"
            value={newSubject.name}
            onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={newSubject.description}
            onChange={e => setNewSubject(s => ({ ...s, description: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleAddOrEditSubject}>
            {editSubjectId ? 'Save Changes' : 'Add'}
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default AdminSubjects;
