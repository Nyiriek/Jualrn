import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Alert, Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField, Typography } from '@mui/material';

type Assignment = {
  id: number;
  title: string;
  subject: { id: number; name: string };
  due_date: string;
  created_at: string;
  published: boolean;
  grade?: number | null;
  description?: string;
  submission_text?: string;
  submitted_at?: string | null;
};

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not recorded';

const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get('/assignments/')
      .then((response) => { setAssignments(response.data.filter((assignment: Assignment) => assignment.published)); setError(null); })
      .catch(() => setError('Failed to load assignments.'))
      .finally(() => setLoading(false));
  }, []);

  const openSubmission = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setAnswerText(assignment.submission_text || '');
    setSubmissionError('');
  };
  const submitAssignment = async () => {
    if (!selectedAssignment) return;
    if (!answerText.trim()) { setSubmissionError('Write your response before submitting.'); return; }
    setSubmitting(true);
    setSubmissionError('');
    try {
      const response = await axios.post(`/assignments/${selectedAssignment.id}/submit/`, { submission_text: answerText.trim() });
      setAssignments((current) => current.map((assignment) => assignment.id === selectedAssignment.id ? { ...assignment, submission_text: answerText.trim(), submitted_at: response.data.submitted_at || new Date().toISOString() } : assignment));
      setSelectedAssignment(null);
    } catch (requestError: any) {
      setSubmissionError(requestError.response?.data?.detail || 'Failed to submit assignment.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 4 }}>
    <Typography variant="h4" sx={{ mb: .5, fontSize: { xs: '1.7rem', sm: '2.125rem' } }}>Assignments</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Read the instructions, write your response, and submit it for teacher review.</Typography>
    {assignments.length === 0 ? <Card variant="outlined"><CardContent sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">No published assignments available.</Typography></CardContent></Card> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>{assignments.map((assignment) => <Card key={assignment.id} variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, borderTop: 4, borderTopColor: assignment.grade != null ? 'success.main' : assignment.submitted_at ? 'info.main' : 'divider' }}><CardContent sx={{ flexGrow: 1, pb: 1.5 }}><Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start"><Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{assignment.title}</Typography>{assignment.grade != null ? <Chip size="small" color="success" label={`Final grade: ${assignment.grade}%`} /> : assignment.submitted_at ? <Chip size="small" color="info" label="Awaiting review" /> : <Chip size="small" variant="outlined" label="Not submitted" />}</Stack><Chip size="small" color="primary" variant="outlined" label={assignment.subject.name} sx={{ mt: 1.25 }} />{assignment.description && <Typography variant="body2" sx={{ mt: 1.25, whiteSpace: 'pre-wrap' }}>{assignment.description}</Typography>}<Box sx={{ mt: 2, p: 1.25, bgcolor: 'action.hover', borderRadius: 1.5, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}><Box><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2" fontWeight={600}>{formatDate(assignment.created_at)}</Typography></Box><Box><Typography variant="caption" color="text.secondary">Due</Typography><Typography variant="body2" fontWeight={600}>{formatDate(assignment.due_date)}</Typography></Box></Box></CardContent><CardActions sx={{ px: 2, pb: 2, pt: 0 }}><Button fullWidth variant={assignment.grade != null ? 'outlined' : 'contained'} onClick={() => openSubmission(assignment)}>{assignment.grade != null ? 'View submitted work' : assignment.submitted_at ? 'Edit response' : 'Write response'}</Button></CardActions></Card>)}</Box>}
    <Dialog open={Boolean(selectedAssignment)} onClose={() => !submitting && setSelectedAssignment(null)} fullWidth maxWidth="md"><DialogTitle>{selectedAssignment?.grade != null ? 'Submitted assignment' : selectedAssignment?.submitted_at ? 'Edit assignment response' : 'Write assignment response'}</DialogTitle><DialogContent dividers>{selectedAssignment && <Stack spacing={2}><Box><Typography variant="subtitle2">{selectedAssignment.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{selectedAssignment.subject.name} · Due {formatDate(selectedAssignment.due_date)}</Typography></Box><Divider /><Box><Typography variant="subtitle2">Instructions</Typography><Typography sx={{ mt: .75, whiteSpace: 'pre-wrap' }}>{selectedAssignment.description || 'Complete the assigned work and explain your answer clearly.'}</Typography></Box>{submissionError && <Alert severity="error">{submissionError}</Alert>}<TextField id="assignment-submission" name="submission_text" label="Your answer" fullWidth required multiline minRows={10} value={answerText} onChange={(event) => setAnswerText(event.target.value)} disabled={selectedAssignment.grade != null} helperText={selectedAssignment.grade != null ? `Final grade: ${selectedAssignment.grade}%` : 'Review your response carefully before submitting it for teacher grading.'} /></Stack>}</DialogContent><DialogActions><Button onClick={() => setSelectedAssignment(null)} disabled={submitting}>{selectedAssignment?.grade != null ? 'Close' : 'Cancel'}</Button>{selectedAssignment && selectedAssignment.grade == null && <Button variant="contained" onClick={submitAssignment} disabled={submitting}>{submitting ? 'Submitting…' : selectedAssignment.submitted_at ? 'Resubmit for review' : 'Submit for review'}</Button>}</DialogActions></Dialog>
  </Box>;
};

export default StudentAssignments;
