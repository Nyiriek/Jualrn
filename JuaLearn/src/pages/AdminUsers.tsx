import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

type User = {
  id: number; username: string; email: string; role: 'student' | 'teacher' | 'admin';
  first_name?: string; last_name?: string;
};

const roleLabel: Record<User['role'], string> = { student: 'Student', teacher: 'Teacher', admin: 'Administrator' };
const roleColor: Record<User['role'], 'primary' | 'secondary' | 'success'> = { student: 'primary', teacher: 'secondary', admin: 'success' };

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | User['role']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch {
      setError('Users could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => users.filter((item) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || [item.username, item.email, item.first_name, item.last_name].filter(Boolean).some((value) => value!.toLowerCase().includes(search));
    return matchesSearch && (role === 'all' || item.role === role);
  }), [users, query, role]);

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}/`);
      setUsers((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'This account could not be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  const metrics = [
    { label: 'All users', value: users.length, icon: <PeopleAltOutlinedIcon /> },
    { label: 'Students', value: users.filter((item) => item.role === 'student').length, icon: <SchoolOutlinedIcon /> },
    { label: 'Teachers', value: users.filter((item) => item.role === 'teacher').length, icon: <MenuBookOutlinedIcon /> },
    { label: 'Admins', value: users.filter((item) => item.role === 'admin').length, icon: <AdminPanelSettingsOutlinedIcon /> },
  ];

  return <Box sx={{ maxWidth: 1360, mx: 'auto', pb: 4 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4">User management</Typography><Typography color="text.secondary">Review the accounts that use JuaLearn and manage platform access.</Typography></Box>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadUsers} disabled={loading}>Refresh</Button>
    </Stack>

    {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {metrics.map((metric) => <Card variant="outlined" key={metric.label}><CardContent><Stack direction="row" spacing={1} alignItems="center" color="primary.main">{metric.icon}<Typography variant="body2">{metric.label}</Typography></Stack><Typography variant="h4" sx={{ mt: .75 }}>{metric.value}</Typography></CardContent></Card>)}
    </Box>

    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <TextField id="admin-user-search" name="userSearch" label="Search users" placeholder="Name, username or email" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <Select id="admin-user-role-filter" name="userRoleFilter" value={role} onChange={(event) => setRole(event.target.value as typeof role)} inputProps={{ 'aria-label': 'Filter users by role' }} sx={{ minWidth: { md: 190 } }}>
          <MenuItem value="all">All roles</MenuItem><MenuItem value="student">Students</MenuItem><MenuItem value="teacher">Teachers</MenuItem><MenuItem value="admin">Administrators</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{filteredUsers.length} result{filteredUsers.length === 1 ? '' : 's'}</Typography>
      </Stack>
    </Paper>

    {loading ? <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : <>
      <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
        <Table aria-label="JuaLearn user accounts"><TableHead><TableRow><TableCell>User</TableCell><TableCell>Contact</TableCell><TableCell>Role</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>
          {filteredUsers.length === 0 ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No users match the current filters.</Typography></TableCell></TableRow> : filteredUsers.map((item) => <UserRow key={item.id} user={item} onDelete={() => setDeleteTarget(item)} isCurrentUser={item.id === currentUser?.id} />)}
        </TableBody></Table>
      </TableContainer>
      <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {filteredUsers.length === 0 ? <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No users match the current filters.</Typography></Paper> : filteredUsers.map((item) => <UserCard key={item.id} user={item} onDelete={() => setDeleteTarget(item)} isCurrentUser={item.id === currentUser?.id} />)}
      </Stack>
    </>}

    <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}><DialogTitle>Delete user account?</DialogTitle><DialogContent><Typography>This permanently removes <strong>{deleteTarget?.username}</strong> and their related data. This cannot be undone.</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button><Button color="error" variant="contained" onClick={deleteUser} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete user'}</Button></DialogActions></Dialog>
  </Box>;
};

const UserIdentity = ({ user }: { user: User }) => {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return <Stack direction="row" spacing={1.25} alignItems="center"><Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>{(name || user.username).slice(0, 1).toUpperCase()}</Avatar><Box><Typography fontWeight={700}>{name || user.username}</Typography><Typography variant="body2" color="text.secondary">@{user.username}</Typography></Box></Stack>;
};

const UserRow = ({ user, onDelete, isCurrentUser }: { user: User; onDelete: () => void; isCurrentUser: boolean }) => <TableRow hover><TableCell><UserIdentity user={user} /></TableCell><TableCell>{user.email || <Typography color="text.secondary">No email recorded</Typography>}</TableCell><TableCell><Chip size="small" color={roleColor[user.role]} label={roleLabel[user.role]} /></TableCell><TableCell align="right"><Tooltip title={isCurrentUser ? 'You cannot delete your own account here' : 'Delete user'}><span><IconButton color="error" aria-label={`Delete ${user.username}`} onClick={onDelete} disabled={isCurrentUser}><DeleteOutlineIcon /></IconButton></span></Tooltip></TableCell></TableRow>;

const UserCard = ({ user, onDelete, isCurrentUser }: { user: User; onDelete: () => void; isCurrentUser: boolean }) => <Paper variant="outlined" sx={{ p: 1.5 }}><Stack direction="row" justifyContent="space-between" gap={1}><UserIdentity user={user} /><Chip size="small" color={roleColor[user.role]} label={roleLabel[user.role]} /></Stack><Divider sx={{ my: 1.25 }} /><Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{user.email || 'No email recorded'}</Typography><IconButton color="error" aria-label={`Delete ${user.username}`} onClick={onDelete} disabled={isCurrentUser}><DeleteOutlineIcon /></IconButton></Stack></Paper>;

export default AdminUsers;
