import React, { useEffect, useState } from "react";
import {
  Button, Modal, Box, Typography, TextField, Select, MenuItem, CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useSubjects } from "../hooks/UseSubjects";
import axios from "../api/axios";

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { subjects, loading, error, refreshSubjects } = useSubjects();

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');

  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentSubject, setNewAssignmentSubject] = useState<number | "">('');
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(false);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return alert("Subject name is required");
    setSubjectLoading(true);
    try {
      await axios.post('/subjects/', { name: newSubjectName, description: newSubjectDescription });
      refreshSubjects();
      setSubjectModalOpen(false);
      setNewSubjectName('');
      setNewSubjectDescription('');
    } catch (err) {
      alert("Failed to add subject");
    }
    setSubjectLoading(false);
  };

  const handleAddAssignment = async () => {
    if (!newAssignmentTitle.trim() || !newAssignmentSubject || !newAssignmentDueDate) {
      return alert("Please fill all assignment fields");
    }
    setAssignmentLoading(true);
    try {
      await axios.post('/assignments/', {
        title: newAssignmentTitle,
        subject: newAssignmentSubject,
        due_date: newAssignmentDueDate,
        assigned_to: user?.id,
      });
      setAssignmentModalOpen(false);
      setNewAssignmentTitle('');
      setNewAssignmentSubject('');
      setNewAssignmentDueDate('');
    } catch (err) {
      alert("Failed to add assignment");
    }
    setAssignmentLoading(false);
  };

  useEffect(() => {
    const handleSubjectsUpdated = () => refreshSubjects();
    window.addEventListener('subjectsUpdated', handleSubjectsUpdated);
    return () => window.removeEventListener('subjectsUpdated', handleSubjectsUpdated);
  }, [refreshSubjects]);

  return (
    <div
      style={{
        padding: "2.5rem",
        minHeight: "100vh",
        background: mode === "dark" ? "#191b1f" : "#f8f9fd",
        color: mode === "dark" ? "#fff" : "#23395d",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <h2>Welcome, {user?.firstName || "Teacher"}!</h2>

      <div style={{ marginBottom: 16 }}>
        <Typography variant="h5">Your Subjects</Typography>
        {loading && <p>Loading subjects...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && (
          <ul>
            {subjects.map(subject => (
              <li key={subject.id}>{subject.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <Typography variant="h5">Assignments</Typography>
      </div>

      {/* Subject Modal */}
      <Modal open={subjectModalOpen} onClose={() => setSubjectModalOpen(false)}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>Add New Course</Typography>
          <TextField
            fullWidth label="Subject Name"
            value={newSubjectName}
            onChange={e => setNewSubjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label="Description"
            value={newSubjectDescription}
            onChange={e => setNewSubjectDescription(e.target.value)}
            multiline rows={3}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleAddSubject}
            disabled={subjectLoading}
          >
            {subjectLoading ? "Adding..." : "Add Subject"}
          </Button>
        </Box>
      </Modal>

      {/* Assignment Modal */}
      <Modal open={assignmentModalOpen} onClose={() => setAssignmentModalOpen(false)}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>Add New Assignment</Typography>
          <TextField
            fullWidth label="Title"
            value={newAssignmentTitle}
            onChange={e => setNewAssignmentTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Select
            fullWidth
            value={newAssignmentSubject}
            onChange={e => setNewAssignmentSubject(e.target.value)}
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>Select Subject</MenuItem>
            {subjects.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </Select>
          <TextField
            fullWidth label="Due Date"
            type="date"
            value={newAssignmentDueDate}
            onChange={e => setNewAssignmentDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleAddAssignment}
            disabled={assignmentLoading}
          >
            {assignmentLoading ? "Adding..." : "Add Assignment"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
