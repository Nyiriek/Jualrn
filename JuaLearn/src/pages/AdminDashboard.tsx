import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Typography, Box, TextField, Modal, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

type User = { id: number; username: string; email: string; role: string };
type Subject = { id: number; name: string; description: string };

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const token = localStorage.getItem('access_token');

  // Fetch users and subjects
  useEffect(() => {
    axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data));
    axios.get('/api/subjects/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSubjects(res.data));
  }, [token]);

  // Delete actions
  const handleDeleteUser = (id: number) => {
    axios.delete(`/api/users/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setUsers(users.filter(u => u.id !== id)));
  };
  const handleDeleteSubject = (id: number) => {
    axios.delete(`/api/subjects/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setSubjects(subjects.filter(s => s.id !== id)));
  };

  // Add/Edit Subject
  const handleAddOrEditSubject = () => {
    if (editSubjectId) {
      // Edit mode
      axios.patch(`/api/subjects/${editSubjectId}/`, newSubject, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setSubjects(subjects.map(s => (s.id === editSubjectId ? res.data : s)));
          setShowSubjectModal(false);
          setEditSubjectId(null);
          setNewSubject({ name: '', description: '' });
        });
    } else {
      // Add mode
      axios.post('/api/subjects/', newSubject, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setSubjects([...subjects, res.data]);
          setShowSubjectModal(false);
          setNewSubject({ name: '', description: '' });
        });
    }
  };

  // Open Edit Modal
  const handleEditSubject = (subject: Subject) => {
    setEditSubjectId(subject.id);
    setNewSubject({ name: subject.name, description: subject.description });
    setShowSubjectModal(true);
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography variant="h6" gutterBottom>User Count: {users.length}</Typography>
      <Box my={2}>
        <Button variant="contained" onClick={() => { setShowSubjectModal(true); setEditSubjectId(null); setNewSubject({ name: '', description: '' }); }}>
          Add Subject
        </Button>
      </Box>
      {/* Subject Table */}
      <Typography variant="h6" gutterBottom>Subjects</Typography>
      <Table>
        <thead>
          <tr><th>Name</th><th>Description</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {subjects.map(subject => (
            <tr key={subject.id}>
              <td>{subject.name}</td>
              <td>{subject.description}</td>
              <td>
                <IconButton onClick={() => handleEditSubject(subject)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDeleteSubject(subject.id)}><DeleteIcon /></IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* User Table */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Users</Typography>
      <Table>
        <thead>
          <tr><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <IconButton color="error" onClick={() => handleDeleteUser(user.id)}><DeleteIcon /></IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Modal for Add/Edit Subject */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)}>
        <Box sx={{ p: 4, background: '#fff', maxWidth: 400, margin: '10% auto', borderRadius: 2 }}>
          <Typography variant="h6">{editSubjectId ? 'Edit Subject' : 'Add Subject'}</Typography>
          <TextField fullWidth label="Name" value={newSubject.name} onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" value={newSubject.description} onChange={e => setNewSubject(s => ({ ...s, description: e.target.value }))} sx={{ mb: 2 }} />
          <Button variant="contained" onClick={handleAddOrEditSubject}>{editSubjectId ? 'Save Changes' : 'Add'}</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminDashboard;
