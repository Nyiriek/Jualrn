import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { Button, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';

type Assignment = {
  id: number;
  title: string;
  subject: { id: number; name: string };
  due_date: string;
  published: boolean;
  grade?: number | null;
};

const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/assignments/');
        const publishedAssignments = response.data.filter((a: Assignment) => a.published);
        setAssignments(publishedAssignments);
        setError(null);
      } catch {
        setError('Failed to load assignments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleSubmitAssignment = async (assignmentId: number) => {
    setSubmittingAssignmentId(assignmentId);
    try {
      await axios.post(`/assignments/${assignmentId}/submit/`, {});
      alert('Assignment submitted successfully! The teacher will grade it soon.');
    } catch {
      alert('Failed to submit assignment.');
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <List>
      {assignments.map((assignment) => (
        <ListItem key={assignment.id} divider>
          <ListItemText
            primary={assignment.title}
            secondary={`Subject: ${assignment.subject.name} | Due: ${new Date(assignment.due_date).toLocaleDateString()}`}
          />
          <Button
            variant="contained"
            onClick={() => handleSubmitAssignment(assignment.id)}
            disabled={submittingAssignmentId === assignment.id || assignment.grade != null}
          >
            {assignment.grade != null ? 'Graded' : submittingAssignmentId === assignment.id ? 'Submitting...' : 'Submit'}
          </Button>
        </ListItem>
      ))}
      {assignments.length === 0 && <p>No published assignments available.</p>}
    </List>
  );
};

export default StudentAssignments;
