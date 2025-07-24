import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import axios from '../api/axios';

type Enrollment = {
  id: number;
  student: { id: number; username: string; };
  subject: { id: number; name: string; };
  enrolled_at: string;
};

const TeacherStudentsTab: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/enrollments/');
      setEnrollments(res.data);
      setError(null);
    } catch {
      setError("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Enrolled Students</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : enrollments.length === 0 ? (
        <Typography>No students enrolled yet.</Typography>
      ) : (
        <List>
          {enrollments.map(({ id, student, subject, enrolled_at }) => (
            <ListItem key={id}>
              <ListItemText
                primary={`${student.username} (Subject: ${subject.name})`}
                secondary={`Enrolled at: ${new Date(enrolled_at).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default TeacherStudentsTab;
