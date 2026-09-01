import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Checkbox,
  FormControlLabel, List, ListItem, ListItemText, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, MenuItem, Card, CardContent, Chip, Divider, Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from '../api/axios';

type Choice = {
  id: number;
  text: string;
  is_correct: boolean;
};

type Question = {
  id: number;
  text: string;
  type: string;
  answer_key: string;
  choices: Choice[];
};

type Props = {
  quizId: number;
};

const QuizQuestionsManager: React.FC<Props> = ({ quizId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [editChoice, setEditChoice] = useState<Choice | null>(null);
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [openChoiceDialog, setOpenChoiceDialog] = useState(false);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/quizzes/${quizId}/questions/`);
      setQuestions(res.data);
      setError(null);
    } catch {
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  // Question Handlers

  const handleAddQuestion = (type: 'multiple-choice' | 'short-answer' = 'multiple-choice') => {
    setEditQuestion({ id: 0, text: '', type, answer_key: '', choices: [] });
    setValidationError(null);
    setOpenQuestionDialog(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditQuestion(question);
    setValidationError(null);
    setOpenQuestionDialog(true);
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await axios.delete(`/quizzes/${quizId}/questions/${id}/`);
      fetchQuestions();
    } catch {
      alert('Failed to delete question.');
    }
  };

  const saveQuestion = async () => {
    if (!editQuestion || !editQuestion.text.trim()) {
      setValidationError('Question text cannot be empty.');
      return;
    }
    if (editQuestion.type === 'short-answer' && !editQuestion.answer_key.trim()) {
      setValidationError('Add at least one accepted answer so this written response can be graded automatically.');
      return;
    }
    setSaving(true);
    try {
      const payload = { text: editQuestion.text.trim(), type: editQuestion.type, answer_key: editQuestion.type === 'short-answer' ? editQuestion.answer_key.trim() : '' };
      if (editQuestion.id === 0) {
        await axios.post(`/quizzes/${quizId}/questions/`, payload);
      } else {
        await axios.patch(`/quizzes/${quizId}/questions/${editQuestion.id}/`, payload);
      }
      setOpenQuestionDialog(false);
      fetchQuestions();
    } catch {
      alert('Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  // Choice Handlers

  const handleAddChoice = (questionId: number) => {
    setEditChoice({ id: 0, text: '', is_correct: false });
    setEditQuestion(questions.find(q => q.id === questionId) || null);
    setValidationError(null);
    setOpenChoiceDialog(true);
  };

  const handleEditChoice = (choice: Choice, questionId: number) => {
    setEditChoice(choice);
    setEditQuestion(questions.find(q => q.id === questionId) || null);
    setValidationError(null);
    setOpenChoiceDialog(true);
  };

  const handleDeleteChoice = async (id: number, questionId: number) => {
    if (!window.confirm('Delete this choice?')) return;
    try {
      await axios.delete(`/quizzes/${quizId}/questions/${questionId}/choices/${id}/`);
      fetchQuestions();
    } catch {
      alert('Failed to delete choice.');
    }
  };

  const saveChoice = async () => {
    if (!editChoice || !editChoice.text.trim()) {
      setValidationError('Choice text cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const payload = { text: editChoice.text.trim(), is_correct: editChoice.is_correct };
      if (editChoice.id === 0) {
        await axios.post(`/quizzes/${quizId}/questions/${editQuestion!.id}/choices/`, payload);
      } else {
        await axios.patch(`/quizzes/${quizId}/questions/${editQuestion!.id}/choices/${editChoice.id}/`, payload);
      }
      setOpenChoiceDialog(false);
      fetchQuestions();
    } catch {
      alert('Failed to save choice.');
    } finally {
      setSaving(false);
    }
  };

  const generateFromCourse = async () => {
    setGenerating(true);
    setGenerationMessage(null);
    try {
      const response = await axios.post(`/quizzes/${quizId}/generate_from_course/`, { limit: 6 });
      setGenerationMessage(response.data.detail || 'Questions generated. Review them before publishing.');
      fetchQuestions();
    } catch (requestError: any) {
      setGenerationMessage(requestError.response?.data?.detail || 'Questions could not be generated from this course.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box mt={4} sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Box><Stack direction="row" gap={1} alignItems="center"><Typography variant="h5">Quiz questions</Typography><Chip size="small" label={`${questions.length} question${questions.length === 1 ? '' : 's'}`} variant="outlined" /></Stack><Typography variant="body2" color="text.secondary">Choose multiple choice for selectable options, or questionnaire for a student-written answer with an answer repository.</Typography></Box>
        <Button variant="outlined" onClick={generateFromCourse} disabled={generating} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>{generating ? 'Generating…' : 'Generate from course'}</Button>
      </Box>
      {generationMessage && <Alert severity={generationMessage.includes('could not') ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => setGenerationMessage(null)}>{generationMessage}</Alert>}
      {loading ? (
        <Typography>Loading questions...</Typography>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <>
          {questions.length === 0 ? <Alert severity="info" sx={{ mb: 2 }}>No questions yet. Use one of the buttons below, or generate a starter set from course content.</Alert> : <Stack spacing={1.5}>
            {questions.map((q, index) => (
              <Card key={q.id} variant="outlined">
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box sx={{ minWidth: 0 }}><Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center"><Chip size="small" label={`Question ${index + 1}`} /><Chip size="small" variant="outlined" label={q.type === 'short-answer' ? 'Questionnaire / written response' : 'Multiple choice'} /></Stack><Typography sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{q.text}</Typography></Box>
                    <Stack direction="row" spacing={0.25}><IconButton size="small" aria-label="edit question" onClick={() => handleEditQuestion(q)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" aria-label="delete question" onClick={() => handleDeleteQuestion(q.id)}><DeleteIcon fontSize="small" /></IconButton></Stack>
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  {q.type === 'short-answer' ? <Alert severity="success">Automatically graded from the answer repository. Accepted answer{q.answer_key.includes('\n') ? 's' : ''}: {q.answer_key || 'No answer key yet'}</Alert> : <Stack spacing={0.75}>
                    {q.choices.map((c) => <Box key={c.id} sx={{ display: "flex", alignItems: "center", gap: 0.5, borderRadius: 1, px: 0.75, py: 0.25, bgcolor: c.is_correct ? "success.50" : "transparent" }}><Checkbox checked={c.is_correct} disabled size="small" /><Typography variant="body2" sx={{ flexGrow: 1 }}>{c.text}</Typography><IconButton size="small" aria-label="edit choice" onClick={() => handleEditChoice(c, q.id)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" aria-label="delete choice" onClick={() => handleDeleteChoice(c.id, q.id)}><DeleteIcon fontSize="small" /></IconButton></Box>)}
                    <Button size="small" variant="outlined" onClick={() => handleAddChoice(q.id)} sx={{ alignSelf: "flex-start", mt: 0.5 }}>Add choice</Button>
                  </Stack>}
                </CardContent>
              </Card>
            ))}
          </Stack>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => handleAddQuestion('multiple-choice')}>Add multiple-choice question</Button>
            <Button variant="outlined" onClick={() => handleAddQuestion('short-answer')}>Add questionnaire response</Button>
          </Stack>
        </>
      )}

      {/* Question Dialog */}
      <Dialog open={openQuestionDialog} onClose={() => setOpenQuestionDialog(false)}>
        <DialogTitle>{editQuestion?.id === 0 ? (editQuestion?.type === 'short-answer' ? 'Add questionnaire response' : 'Add multiple-choice question') : 'Edit question'}</DialogTitle>
        <DialogContent>
          {validationError && <Alert severity="error" sx={{ mb: 1 }}>{validationError}</Alert>}
          <TextField
            id="quiz-question-text"
            name="quizQuestionText"
            label="Question Text"
            fullWidth
            value={editQuestion?.text || ''}
            onChange={(e) => setEditQuestion(q => q ? { ...q, text: e.target.value } : null)}
            margin="normal"
            autoFocus
          />
          <TextField
            id="quiz-question-type"
            name="quizQuestionType"
            select
            label="Question Type"
            fullWidth
            value={editQuestion?.type || 'multiple-choice'}
            onChange={(e) => setEditQuestion(q => q ? { ...q, type: e.target.value } : null)}
            margin="normal"
            helperText="Multiple-choice questions grade from the option marked Correct. Questionnaire responses let students write an answer and use the answer repository below."
          ><MenuItem value="multiple-choice">Multiple choice</MenuItem><MenuItem value="short-answer">Questionnaire / written response</MenuItem></TextField>
          {editQuestion?.type === 'short-answer' && <TextField
            id="question-answer-key"
            name="answer_key"
            label="Answer repository (accepted answers)"
            fullWidth
            multiline
            minRows={3}
            value={editQuestion.answer_key || ''}
            onChange={(e) => setEditQuestion(q => q ? { ...q, answer_key: e.target.value } : null)}
            margin="normal"
            helperText="Add one accepted answer per line. Matching ignores case and punctuation; an accepted phrase may appear within a student's response."
          />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQuestionDialog(false)} disabled={saving}>Cancel</Button>
          <Button onClick={saveQuestion} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Choice Dialog */}
      <Dialog open={openChoiceDialog} onClose={() => setOpenChoiceDialog(false)}>
        <DialogTitle>{editChoice?.id === 0 ? 'Add Choice' : 'Edit Choice'}</DialogTitle>
        <DialogContent>
          {validationError && <Alert severity="error" sx={{ mb: 1 }}>{validationError}</Alert>}
          <TextField
            id="quiz-choice-text"
            name="quizChoiceText"
            label="Choice Text"
            fullWidth
            value={editChoice?.text || ''}
            onChange={(e) => setEditChoice(c => c ? { ...c, text: e.target.value } : null)}
            margin="normal"
            autoFocus
          />
          <FormControlLabel
            control={
              <Checkbox
                inputProps={{ id: "quiz-choice-correct", name: "quizChoiceCorrect" }}
                checked={editChoice?.is_correct || false}
                onChange={(e) =>
                  setEditChoice(c => c ? { ...c, is_correct: e.target.checked } : null)
                }
              />
            }
            label="Correct"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChoiceDialog(false)} disabled={saving}>Cancel</Button>
          <Button onClick={saveChoice} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizQuestionsManager;
