import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import {
  Alert, Box, Button, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, InputAdornment, MenuItem, Paper, Select, Stack, Switch, TextField,
  Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getCourseCover } from '../utils/courseCover';

type Subject = { id: number; name: string; description?: string; content?: string; published: boolean; resources?: { id: number }[] };
type CourseForm = { name: string; description: string; content: string; published: boolean };
const emptyForm: CourseForm = { name: '', description: '', content: '', published: false };

const AdminSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/subjects/');
      setSubjects(response.data);
    } catch {
      setError('Courses could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const filteredSubjects = useMemo(() => subjects.filter((subject) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || `${subject.name} ${subject.description || ''}`.toLowerCase().includes(search);
    const matchesStatus = status === 'all' || (status === 'published' ? subject.published : !subject.published);
    return matchesSearch && matchesStatus;
  }), [subjects, query, status]);

  const openCreate = () => { setEditSubjectId(null); setForm(emptyForm); setEditorOpen(true); };
  const openEdit = (subject: Subject) => { setEditSubjectId(subject.id); setForm({ name: subject.name, description: subject.description || '', content: subject.content || '', published: subject.published }); setEditorOpen(true); };

  const saveCourse = async () => {
    if (!form.name.trim()) { setError('A course name is required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim() };
      const response = editSubjectId ? await api.patch(`/subjects/${editSubjectId}/`, payload) : await api.post('/subjects/', payload);
      setSubjects((current) => editSubjectId ? current.map((subject) => subject.id === editSubjectId ? response.data : subject) : [response.data, ...current]);
      setEditorOpen(false);
      window.dispatchEvent(new Event('subjectsUpdated'));
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'The course could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/subjects/${deleteTarget.id}/`);
      setSubjects((current) => current.filter((subject) => subject.id !== deleteTarget.id));
      setDeleteTarget(null);
      window.dispatchEvent(new Event('subjectsUpdated'));
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'The course could not be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  const publishedCount = subjects.filter((subject) => subject.published).length;
  const resourceCount = subjects.reduce((total, subject) => total + (subject.resources?.length || 0), 0);

  return <Box sx={{ maxWidth: 1360, mx: 'auto', pb: 4 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4">Course catalogue</Typography><Typography color="text.secondary">Create, review, and maintain the courses available on JuaLearn.</Typography></Box>
      <Stack direction="row" spacing={1}><Button variant="outlined" aria-label="Refresh courses" onClick={fetchSubjects} disabled={loading}><RefreshIcon /></Button><Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add course</Button></Stack>
    </Stack>

    {error && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
      <Metric label="All courses" value={subjects.length} icon={<MenuBookOutlinedIcon />} /><Metric label="Published" value={publishedCount} icon={<PublicOutlinedIcon />} /><Metric label="Linked resources" value={resourceCount} icon={<MenuBookOutlinedIcon />} />
    </Box>

    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <TextField id="admin-course-search" name="courseSearch" label="Search courses" placeholder="Course name or description" fullWidth value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <Select id="admin-course-status-filter" name="courseStatusFilter" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} inputProps={{ 'aria-label': 'Filter courses by publication status' }} sx={{ minWidth: { md: 180 } }}><MenuItem value="all">All courses</MenuItem><MenuItem value="published">Published</MenuItem><MenuItem value="draft">Drafts</MenuItem></Select>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{filteredSubjects.length} result{filteredSubjects.length === 1 ? '' : 's'}</Typography>
      </Stack>
    </Paper>

    {loading ? <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> : filteredSubjects.length === 0 ? <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}><MenuBookOutlinedIcon color="disabled" sx={{ fontSize: 42 }} /><Typography variant="h6" sx={{ mt: 1 }}>No courses found</Typography><Typography color="text.secondary">Adjust the filters or add a new course to begin building the catalogue.</Typography></Paper> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
      {filteredSubjects.map((subject) => <CourseCard key={subject.id} subject={subject} onEdit={() => openEdit(subject)} onDelete={() => setDeleteTarget(subject)} />)}
    </Box>}

    <Dialog open={editorOpen} onClose={() => !saving && setEditorOpen(false)} fullWidth maxWidth="md"><DialogTitle>{editSubjectId ? 'Edit course' : 'Add course'}</DialogTitle><DialogContent dividers><Stack spacing={2} sx={{ pt: 1 }}><TextField id="admin-course-name" name="courseName" label="Course name" required autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /><TextField id="admin-course-description" name="courseDescription" label="Course description" multiline minRows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /><TextField id="admin-course-content" name="courseContent" label="Course content" helperText="Add an overview, learning goals, or course notes. Lessons and resources can also be attached from Course Oversight." multiline minRows={7} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} /><FormControlLabel control={<Switch checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} inputProps={{ 'aria-label': 'Publish this course' }} />} label="Published and visible to learners" /></Stack></DialogContent><DialogActions><Button onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={saveCourse} disabled={saving}>{saving ? 'Saving…' : editSubjectId ? 'Save changes' : 'Create course'}</Button></DialogActions></Dialog>
    <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}><DialogTitle>Delete course?</DialogTitle><DialogContent><Typography>Deleting <strong>{deleteTarget?.name}</strong> will also remove its linked lessons, quizzes, assignments, and enrolments. This cannot be undone.</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button><Button variant="contained" color="error" onClick={deleteCourse} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete course'}</Button></DialogActions></Dialog>
  </Box>;
};

const Metric = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => <Card variant="outlined"><CardContent><Stack direction="row" spacing={1} alignItems="center" color="primary.main">{icon}<Typography variant="body2">{label}</Typography></Stack><Typography variant="h4" sx={{ mt: .75 }}>{value}</Typography></CardContent></Card>;

const CourseCard = ({ subject, onEdit, onDelete }: { subject: Subject; onEdit: () => void; onDelete: () => void }) => <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}><CardMedia component="img" height="132" image={getCourseCover(subject.name)} alt={`${subject.name} course cover`} sx={{ objectFit: 'cover' }} /><CardContent sx={{ flex: 1 }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Box sx={{ minWidth: 0 }}><Typography variant="h6" noWrap title={subject.name}>{subject.name}</Typography><Typography variant="caption" color="text.secondary">Course ID #{subject.id}</Typography></Box><Chip size="small" color={subject.published ? 'success' : 'default'} label={subject.published ? 'Published' : 'Draft'} /></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 60 }}>{subject.description || 'No course description has been added.'}</Typography><Divider sx={{ my: 1.5 }} /><Stack direction="row" spacing={.75} alignItems="center"><MenuBookOutlinedIcon fontSize="small" color="action" /><Typography variant="body2" color="text.secondary">{subject.resources?.length || 0} linked resource{subject.resources?.length === 1 ? '' : 's'}</Typography></Stack></CardContent><CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5 }}><Button size="small" startIcon={<EditOutlinedIcon />} onClick={onEdit}>Edit</Button><Tooltip title="Delete course"><IconButton color="error" aria-label={`Delete ${subject.name}`} onClick={onDelete}><DeleteOutlineIcon /></IconButton></Tooltip></CardActions></Card>;

export default AdminSubjects;
