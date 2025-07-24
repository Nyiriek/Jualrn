import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Table, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type User = { id: number; username: string; email: string; role: string };

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) return;
    axios.get('/api/users/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data))
      .catch(console.error);
  }, [token]);

  const handleDeleteUser = (id: number) => {
    axios.delete(`/api/users/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setUsers(users.filter(u => u.id !== id)))
      .catch(console.error);
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Users
      </Typography>
      <Table>
        <thead>
          <tr>
            <th>Username</th><th>Email</th><th>Role</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <IconButton color="error" onClick={() => handleDeleteUser(user.id)}>
                  <DeleteIcon />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default AdminUsers;
