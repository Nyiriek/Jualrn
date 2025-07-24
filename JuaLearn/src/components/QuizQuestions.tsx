import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Modal,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

interface Props {
  quizId: number;
}

const questionTypes = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "true-false", label: "True / False" },
  // Add more types as needed
];

const QuizQuestions: React.FC<Props> = ({ quizId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState({ text: "", type: "multiple-choice" });

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/quizzes/${quizId}/questions/`);
      setQuestions(res.data);
    } catch (e: any) {
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditQuestion(null);
    setForm({ text: "", type: "multiple-choice" });
    setModalOpen(true);
  };

  const openEditModal = (question: Question) => {
    setEditQuestion(question);
    setForm({ text: question.text, type: question.type });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await axios.delete(`/quizzes/${quizId}/questions/${id}/`);
      setQuestions(questions.filter((q) => q.id !== id));
    } catch {
      alert("Failed to delete question.");
    }
  };

  const handleSubmit = async () => {
    if (!form.text.trim()) {
      setError("Question text is required.");
      return;
    }
    try {
      if (editQuestion) {
        const res = await axios.patch(
          `/quizzes/${quizId}/questions/${editQuestion.id}/`,
          form
        );
        setQuestions(
          questions.map((q) => (q.id === editQuestion.id ? res.data : q))
        );
      } else {
        const res = await axios.post(`/quizzes/${quizId}/questions/`, form);
        setQuestions([...questions, res.data]);
      }
      setModalOpen(false);
      setError(null);
    } catch {
      setError("Failed to save question.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Quiz Questions
      </Typography>
      <Button variant="contained" onClick={openAddModal} sx={{ mb: 2 }}>
        Add Question
      </Button>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : questions.length === 0 ? (
        <Typography>No questions added yet.</Typography>
      ) : (
        <List>
          {questions.map((question) => (
            <ListItem
              key={question.id}
              secondaryAction={
                <>
                  <IconButton onClick={() => openEditModal(question)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(question.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={question.text}
                secondary={`Type: ${question.type}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            p: 4,
            maxWidth: 400,
            margin: "10% auto",
            bgcolor: "background.paper",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editQuestion ? "Edit Question" : "Add Question"}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Question Text"
            fullWidth
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            sx={{ mb: 2 }}
            required
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              labelId="type-label"
              value={form.type}
              label="Type"
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              {questionTypes.map((qType) => (
                <MenuItem key={qType.value} value={qType.value}>
                  {qType.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" fullWidth onClick={handleSubmit}>
            {editQuestion ? "Save Changes" : "Add Question"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default QuizQuestions;
