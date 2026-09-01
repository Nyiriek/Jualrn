import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Avatar,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  ThemeProvider as MuiThemeProvider,
  createTheme,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BookIcon from '@mui/icons-material/Book';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import TuneIcon from '@mui/icons-material/Tune';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import JuaCompanion from '../components/JuaCompanion';
import ProfileModal from '../components/ProfileModal';
import { profileInitials, profilePictureUrl } from '../utils/profilePicture';

type User = { id: number; username: string; email: string; role: string };
type Subject = { id: number; name: string; description: string };
type AdminPalette = 'indigo' | 'navy' | 'burgundy' | 'forest';
type AdminPreferences = { palette: AdminPalette; compact: boolean };

const paletteColors: Record<AdminPalette, { sidebar: string; main: string; primary: string }> = {
  indigo: { sidebar: '#263b72', main: '#f5f7fc', primary: '#3f51a1' },
  navy: { sidebar: '#102a43', main: '#f4f8fc', primary: '#1f5b8f' },
  burgundy: { sidebar: '#681d3f', main: '#fcf6f8', primary: '#8b3157' },
  forest: { sidebar: '#1f5a4c', main: '#f4faf7', primary: '#287765' },
};

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
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [profileImageFile, setProfileImageFile] = useState<File | undefined>(undefined);

  const { logout, user, login, accessToken, refreshToken } = useAuth();
  const preferenceKey = `jualearn:admin-dashboard-preferences:${user?.id || 'current'}`;
  const [preferences, setPreferences] = useState<AdminPreferences>(() => {
    try {
      return JSON.parse(localStorage.getItem(preferenceKey) || '') as AdminPreferences;
    } catch {
      return { palette: 'indigo', compact: false };
    }
  });
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:900px)');
  const baseTheme = useTheme();

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    localStorage.setItem(preferenceKey, JSON.stringify(preferences));
  }, [preferenceKey, preferences]);

  useEffect(() => setProfilePicture(profilePictureUrl(user?.profilePicture)), [user?.profilePicture]);

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
    navigate('/admin/login');
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const isActive = (path: string) => location.pathname === path;

  // Bulk upload handler
  const handleBulkUpload = async (file?: File) => {
    if (!file) return;
    setBulkLoading(true);
    setBulkMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/bulk-upload/', formData);
      setBulkMessage(response.data?.detail || 'Course package uploaded successfully.');
      fetchSubjects(); // refresh subjects after upload
    } catch (err: any) {
      setBulkMessage(`Bulk upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadUploadTemplate = () => {
    const template = {
      courses: [{
        name: 'Sample course', description: 'A short course description.', content: 'Course overview and learning goals.', published: false,
        resources: [{ title: 'Unit 1 reading', topic: 'Introduction', resource_type: 'reading', description: 'Key concepts for the unit.', content: 'Add the full learning material here.' }],
        lessons: [{ title: 'Lesson 1: Introduction', content: 'Lesson notes, activities, and instructions.' }],
        quizzes: [{ title: 'Unit 1 quiz', description: 'Check understanding.', due_date: '2026-12-31', published: false, questions: [{ text: 'Which statement is correct?', type: 'multiple-choice', choices: [{ text: 'Correct answer', is_correct: true }, { text: 'Another option', is_correct: false }] }] }],
        assignments: [{ title: 'Unit 1 assignment', description: 'Complete the activity and submit your response.', due_date: '2026-12-31', published: false }],
      }],
    };
    const file = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jualearn-course-package-template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const colors = paletteColors[preferences.palette];
  const adminTheme = useMemo(() => createTheme(baseTheme, {
    palette: {
      primary: { main: colors.primary, dark: colors.sidebar, contrastText: '#fff' },
      secondary: { main: colors.primary },
      background: { ...baseTheme.palette.background, default: colors.main },
    },
    components: {
      MuiCard: { styleOverrides: { root: { borderColor: `${colors.primary}26` } } },
      MuiTableHead: { styleOverrides: { root: { backgroundColor: `${colors.primary}12` } } },
    },
  }), [baseTheme, colors]);

  const saveProfile = async (updates: { username: string; email: string; firstName: string; lastName: string }) => {
    if (!updates.username.trim() || !updates.email.trim() || !user) {
      setError('Username and email are required.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('username', updates.username.trim());
      formData.append('email', updates.email.trim());
      formData.append('first_name', updates.firstName.trim());
      formData.append('last_name', updates.lastName.trim());
      if (profileImageFile) formData.append('profile_picture', profileImageFile);
      const response = await api.patch('/profile/', formData);
      login({
        ...user, username: response.data.username, email: response.data.email,
        firstName: response.data.first_name || '', lastName: response.data.last_name || '',
        profilePicture: profilePictureUrl(response.data.profile_picture) || profilePicture,
        access: accessToken || undefined, refresh: refreshToken || undefined,
      });
      setProfilePicture(profilePictureUrl(response.data.profile_picture) || profilePicture);
      setProfileImageFile(undefined);
      setProfileOpen(false);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'Your profile could not be updated.');
      throw requestError;
    }
  };

  return (
    <MuiThemeProvider theme={adminTheme}>
    <Box sx={{ display: 'flex', minHeight: '100vh', minWidth: 0, bgcolor: colors.main }}>
      <CssBaseline />
      {isMobile && !open && (
        <IconButton
          aria-label="open admin navigation"
          onClick={toggleDrawer}
          sx={{ position: 'fixed', top: 10, left: 10, zIndex: 1300, color: 'white', bgcolor: colors.sidebar, boxShadow: 2, '&:hover': { bgcolor: colors.sidebar } }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 0 : (open ? drawerWidth : 56),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? 'min(82vw, 300px)' : (open ? drawerWidth : 56),
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            bgcolor: colors.sidebar,
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
            <ListItemButton onClick={() => setProfileOpen(true)} sx={{ minHeight: 56, justifyContent: open ? 'initial' : 'center', px: 2.5, color: 'inherit' }}>
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                <Avatar src={profilePicture || profilePictureUrl(user?.profilePicture)} sx={{ width: 30, height: 30, bgcolor: 'rgba(255,255,255,.2)', fontSize: 13 }}>{profileInitials(user?.firstName, user?.lastName, user?.username)}</Avatar>
              </ListItemIcon>
              {open && <ListItemText primary={user?.firstName || user?.username || 'Administrator'} secondary="View and edit profile" secondaryTypographyProps={{ color: 'rgba(255,255,255,.72)', variant: 'caption' }} />}
            </ListItemButton>
          </ListItem>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
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
          <input ref={uploadInputRef} id="admin-course-package-upload" name="coursePackage" type="file" accept="application/json,.json" hidden onChange={(event) => { const selected = event.target.files?.[0]; handleBulkUpload(selected); event.currentTarget.value = ''; }} />
          <Button
            variant="contained"
            fullWidth
            startIcon={<UploadFileIcon />}
            onClick={() => uploadInputRef.current?.click()}
            disabled={bulkLoading}
          >
            {bulkLoading ? <CircularProgress size={24} color="inherit" /> : 'Upload course package'}
          </Button>
          {open && <><Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,.8)' }}>Upload a JSON file with courses, content, resources, lessons, quizzes and assignments.</Typography><Button size="small" color="inherit" onClick={downloadUploadTemplate} sx={{ mt: .5 }}>Download template</Button></>}
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
            <ListItemButton onClick={() => setCustomizationOpen(true)} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, color: 'inherit' }}>
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: 'inherit' }}><TuneIcon /></ListItemIcon>
              {open && <ListItemText primary="Customize" />}
            </ListItemButton>
          </ListItem>
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
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: preferences.compact ? { xs: 1.5, sm: 2.5 } : { xs: 2, sm: 4 }, pt: { xs: 8, sm: preferences.compact ? 2.5 : 4 }, overflow: 'auto', bgcolor: colors.main }}>
        <Outlet />
      </Box>
      <JuaCompanion />

      {/* Modal for Add/Edit Subject */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)}>
        <Box sx={{ p: { xs: 2, sm: 4 }, background: '#fff', width: 'calc(100% - 32px)', maxWidth: 400, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', margin: { xs: '16px auto', sm: '10% auto' }, borderRadius: 2 }}>
          <Typography variant="h6">{editSubjectId ? 'Edit Subject' : 'Add Subject'}</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            id="admin-subject-name"
            name="subjectName"
            fullWidth
            label="Name"
            value={newSubject.name}
            onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))}
            sx={{ mb: 2 }}
            disabled={loadingAddEdit}
          />
          <TextField
            id="admin-subject-description"
            name="subjectDescription"
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
      <Dialog open={customizationOpen} onClose={() => setCustomizationOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Customize admin dashboard</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="admin-dashboard-palette-label">Color palette</InputLabel>
            <Select labelId="admin-dashboard-palette-label" id="admin-dashboard-palette" name="adminDashboardPalette" label="Color palette" value={preferences.palette} onChange={(event) => setPreferences((current) => ({ ...current, palette: event.target.value as AdminPalette }))}>
              <MenuItem value="indigo">Indigo</MenuItem><MenuItem value="navy">Navy blue</MenuItem><MenuItem value="burgundy">Burgundy</MenuItem><MenuItem value="forest">Forest green</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel sx={{ mt: 2 }} control={<Switch checked={preferences.compact} onChange={(event) => setPreferences((current) => ({ ...current, compact: event.target.checked }))} inputProps={{ 'aria-label': 'Use compact dashboard spacing' }} />} label="Use compact spacing" />
          <Typography variant="body2" color="text.secondary">These preferences are saved locally for this admin account and apply to every page in the admin area.</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setPreferences({ palette: 'indigo', compact: false })}>Reset</Button><Button variant="contained" onClick={() => setCustomizationOpen(false)}>Done</Button></DialogActions>
      </Dialog>
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{ username: user?.username || '', email: user?.email || '', role: 'Administrator', firstName: user?.firstName, lastName: user?.lastName, profilePicture: profilePicture || profilePictureUrl(user?.profilePicture) }}
        onProfilePictureChange={(file) => { setProfilePicture(URL.createObjectURL(file)); setProfileImageFile(file); }}
        onSave={saveProfile}
      />
    </Box>
    </MuiThemeProvider>
  );
};

export default AdminDashboard;
