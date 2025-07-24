import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Checkbox,
  FormControlLabel, List, ListItem, ListItemText, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert
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
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/quiz-questions/?quiz=${quizId}`);
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

  const handleAddQuestion = () => {
    setEditQuestion({ id: 0, text: '', type: 'multiple-choice', choices: [] });
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
      await axios.delete(`/quiz-questions/${id}/`);
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
    setSaving(true);
    try {
      const payload = {
        quiz: quizId,
        text: editQuestion.text.trim(),
        type: editQuestion.type,
      };
      if (editQuestion.id === 0) {
        await axios.post('/quiz-questions/', payload);
      } else {
        await axios.patch(`/quiz-questions/${editQuestion.id}/`, payload);
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

  const handleDeleteChoice = async (id: number) => {
    if (!window.confirm('Delete this choice?')) return;
    try {
      await axios.delete(`/quiz-choices/${id}/`);
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
      const payload = {
        question: editQuestion!.id,
        text: editChoice.text.trim(),
        is_correct: editChoice.is_correct,
      };
      if (editChoice.id === 0) {
        await axios.post('/quiz-choices/', payload);
      } else {
        await axios.patch(`/quiz-choices/${editChoice.id}/`, payload);
      }
      setOpenChoiceDialog(false);
      fetchQuestions();
    } catch {
      alert('Failed to save choice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box mt={4}>
      <Typography variant="h5" mb={2}>Manage Quiz Questions</Typography>
      {loading ? (
        <Typography>Loading questions...</Typography>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <>
          <List>
            {questions.map((q) => (
              <ListItem key={q.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <ListItemText
                    primary={q.text}
                    secondary={`Type: ${q.type}`}
                    sx={{ flex: 1 }}
                  />
                  <Box>
                    <IconButton aria-label="edit question" onClick={() => handleEditQuestion(q)}><EditIcon /></IconButton>
                    <IconButton aria-label="delete question" onClick={() => handleDeleteQuestion(q.id)}><DeleteIcon /></IconButton>
                  </Box>
                </Box>
                <Box sx={{ ml: 2, width: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>Choices:</Typography>
                  <List>
                    {q.choices.map((c) => (
                      <ListItem key={c.id} sx={{ pl: 0, py: 0, alignItems: 'center' }}>
                        <ListItemText primary={c.text} sx={{ flex: '1 1 auto' }} />
                        <FormControlLabel
                          control={<Checkbox checked={c.is_correct} disabled />}
                          label="Correct"
                          sx={{ mr: 1 }}
                        />
                        <IconButton aria-label="edit choice" onClick={() => handleEditChoice(c, q.id)}><EditIcon /></IconButton>
                        <IconButton aria-label="delete choice" onClick={() => handleDeleteChoice(c.id)}><DeleteIcon /></IconButton>
                      </ListItem>
                    ))}
                    <Button size="small" variant="outlined" onClick={() => handleAddChoice(q.id)}>Add Choice</Button>
                  </List>
                </Box>
              </ListItem>
            ))}
          </List>

          <Button variant="contained" onClick={handleAddQuestion} sx={{ mt: 3 }}>
            Add New Question
          </Button>
        </>
      )}

      {/* Question Dialog */}
      <Dialog open={openQuestionDialog} onClose={() => setOpenQuestionDialog(false)}>
        <DialogTitle>{editQuestion?.id === 0 ? 'Add Question' : 'Edit Question'}</DialogTitle>
        <DialogContent>
          {validationError && <Alert severity="error" sx={{ mb: 1 }}>{validationError}</Alert>}
          <TextField
            label="Question Text"
            fullWidth
            value={editQuestion?.text || ''}
            onChange={(e) => setEditQuestion(q => q ? { ...q, text: e.target.value } : null)}
            margin="normal"
            autoFocus
          />
          <TextField
            label="Type"
            fullWidth
            value={editQuestion?.type || 'multiple-choice'}
            onChange={(e) => setEditQuestion(q => q ? { ...q, type: e.target.value } : null)}
            margin="normal"
            helperText="Type of question (e.g., multiple-choice)"
          />
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
