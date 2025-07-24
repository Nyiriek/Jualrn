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
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type Choice = {
  id: number;
  text: string;
  is_correct: boolean;
};

interface Props {
  quizId: number;
  questionId: number;
}

const QuizChoices: React.FC<Props> = ({ quizId, questionId }) => {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editChoice, setEditChoice] = useState<Choice | null>(null);
  const [form, setForm] = useState({ text: "", is_correct: false });

  useEffect(() => {
    fetchChoices();
  }, [questionId]);

  const fetchChoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/quizzes/${quizId}/questions/${questionId}/choices/`);
      setChoices(res.data);
    } catch {
      setError("Failed to load choices.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditChoice(null);
    setForm({ text: "", is_correct: false });
    setModalOpen(true);
  };

  const openEditModal = (choice: Choice) => {
    setEditChoice(choice);
    setForm({ text: choice.text, is_correct: choice.is_correct });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this choice?")) return;
    try {
      await axios.delete(`/quizzes/${quizId}/questions/${questionId}/choices/${id}/`);
      setChoices(choices.filter((c) => c.id !== id));
    } catch {
      alert("Failed to delete choice.");
    }
  };

  const handleSubmit = async () => {
    if (!form.text.trim()) {
      setError("Choice text is required.");
      return;
    }

    try {
      if (editChoice) {
        const res = await axios.patch(
          `/quizzes/${quizId}/questions/${questionId}/choices/${editChoice.id}/`,
          form
        );
        setChoices(choices.map((c) => (c.id === editChoice.id ? res.data : c)));
      } else {
        const res = await axios.post(`/quizzes/${quizId}/questions/${questionId}/choices/`, form);
        setChoices([...choices, res.data]);
      }
      setModalOpen(false);
      setError(null);
    } catch {
      setError("Failed to save choice.");
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choices
      </Typography>
      <Button variant="contained" onClick={openAddModal} sx={{ mb: 2 }}>
        Add Choice
      </Button>

      {loading ? (
        <Typography>Loading choices...</Typography>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : choices.length === 0 ? (
        <Typography>No choices added yet.</Typography>
      ) : (
        <List>
          {choices.map((choice) => (
            <ListItem
              key={choice.id}
              secondaryAction={
                <>
                  <IconButton onClick={() => openEditModal(choice)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(choice.id)}>
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={choice.text}
                secondary={choice.is_correct ? "Correct answer" : ""}
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
            {editChoice ? "Edit Choice" : "Add Choice"}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Choice Text"
            fullWidth
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            sx={{ mb: 2 }}
            required
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_correct}
                onChange={(e) => setForm({ ...form, is_correct: e.target.checked })}
              />
            }
            label="Correct Answer"
          />

          <Button variant="contained" fullWidth onClick={handleSubmit}>
            {editChoice ? "Save Changes" : "Add Choice"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default QuizChoices;
