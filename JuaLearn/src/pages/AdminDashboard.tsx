import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Table,
  Button,
  Typography,
  Box,
  TextField,
  Modal,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  Toolbar,
  CssBaseline,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BookIcon from '@mui/icons-material/Book';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

type User = { id: number; username: string; email: string; role: string };
type Subject = { id: number; name: string; description: string };

const drawerWidth = 240;

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [loadingAddEdit, setLoadingAddEdit] = useState(false);
  const [open, setOpen] = useState(true);

  // Bulk upload states
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load users and subjects
  const fetchUsers = () => {
    api.get('/users/')
      .then(res => setUsers(res.data))
      .catch(console.error);
  };
  const fetchSubjects = () => {
    api.get('/subjects/')
      .then(res => setSubjects(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
    fetchSubjects();
  }, []);

  const handleDeleteUser = (id: number) => {
    api.delete(`/users/${id}/`)
      .then(() => setUsers(users.filter(u => u.id !== id)))
      .catch(console.error);
  };

  const handleDeleteSubject = (id: number) => {
    api.delete(`/subjects/${id}/`)
      .then(() => setSubjects(subjects.filter(s => s.id !== id)))
      .catch(console.error);
  };

  const handleAddOrEditSubject = () => {
    setError(null);
    if (!newSubject.name.trim()) {
      setError('Subject name is required');
      return;
    }
    setLoadingAddEdit(true);

    const request = editSubjectId
      ? api.patch(`/subjects/${editSubjectId}/`, newSubject)
      : api.post('/subjects/', newSubject);

    request
      .then(res => {
        if (editSubjectId) {
          setSubjects(subjects.map(s => (s.id === editSubjectId ? res.data : s)));
        } else {
          setSubjects([...subjects, res.data]);
        }
        setShowSubjectModal(false);
        setEditSubjectId(null);
        setNewSubject({ name: '', description: '' });
      })
      .catch(e => {
        const message = e.response?.data?.detail || 'Failed to add/update subject';
        setError(message);
      })
      .finally(() => setLoadingAddEdit(false));
  };

  const handleEditSubject = (subject: Subject) => {
    setEditSubjectId(subject.id);
    setNewSubject({ name: subject.name, description: subject.description });
    setError(null);
    setShowSubjectModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const isActive = (path: string) => location.pathname === path;

  // Bulk upload handler
  const handleBulkUpload = async () => {
    setBulkLoading(true);
    setBulkMessage(null);
    try {
      // Call your backend bulk upload endpoint here
      // Adjust the endpoint as per your backend implementation
      await api.post('/bulk-upload/');

      setBulkMessage('Bulk upload completed successfully!');
      fetchSubjects(); // refresh subjects after upload
    } catch (err: any) {
      setBulkMessage(`Bulk upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 56,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 56,
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            bgcolor: 'primary.main',
            color: 'white',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'flex-end' : 'center',
            px: [1],
            minHeight: '64px !important',
          }}
        >
          <IconButton onClick={toggleDrawer} sx={{ color: 'white' }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={Link}
              to="/admin"
              selected={isActive('/admin')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: isActive('/admin') ? 'rgba(255,255,255,0.15)' : 'inherit',
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <DashboardIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Dashboard" />}
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={Link}
              to="/admin/users"
              selected={isActive('/admin/users')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: isActive('/admin/users') ? 'rgba(255,255,255,0.15)' : 'inherit',
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <PeopleIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Users" />}
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={Link}
              to="/admin/subjects"
              selected={isActive('/admin/subjects')}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: isActive('/admin/subjects') ? 'rgba(255,255,255,0.15)' : 'inherit',
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <BookIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Subjects" />}
            </ListItemButton>
          </ListItem>
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />

        {/* Bulk Upload Section */}
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleBulkUpload}
            disabled={bulkLoading}
          >
            {bulkLoading ? <CircularProgress size={24} /> : 'Bulk Upload Content'}
          </Button>
          {bulkMessage && (
            <Alert
              severity={bulkMessage.toLowerCase().includes('failed') ? 'error' : 'success'}
              sx={{ mt: 2 }}
            >
              {bulkMessage}
            </Alert>
          )}
        </Box>

        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                color: 'inherit',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              {open && <ListItemText primary="Logout" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, overflow: 'auto', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>

      {/* Modal for Add/Edit Subject */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)}>
        <Box sx={{ p: 4, background: '#fff', maxWidth: 400, margin: '10% auto', borderRadius: 2 }}>
          <Typography variant="h6">{editSubjectId ? 'Edit Subject' : 'Add Subject'}</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Name"
            value={newSubject.name}
            onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))}
            sx={{ mb: 2 }}
            disabled={loadingAddEdit}
          />
          <TextField
            fullWidth
            label="Description"
            value={newSubject.description}
            onChange={e => setNewSubject(s => ({ ...s, description: e.target.value }))}
            sx={{ mb: 2 }}
            disabled={loadingAddEdit}
          />
          <Button
            variant="contained"
            onClick={handleAddOrEditSubject}
            disabled={loadingAddEdit}
          >
            {loadingAddEdit ? <CircularProgress size={24} /> : (editSubjectId ? 'Save Changes' : 'Add')}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminDashboard;
