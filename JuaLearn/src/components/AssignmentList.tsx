import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';

interface AssignmentListProps {
  isTeacher?: boolean;
}

const mockAssignments = [
  { title: 'Algebra Worksheet', due: '2025-06-10' },
  { title: 'Essay on Ecosystems', due: '2025-06-12' },
];

const AssignmentList: React.FC<AssignmentListProps> = ({ isTeacher }) => (
  <div style={{ marginTop: '2rem' }}>
    <Typography variant="h6">
      {isTeacher ? 'Assigned Homework' : 'Upcoming Assignments'}
    </Typography>
    <List>
      {mockAssignments.map((item, index) => (
        <ListItem key={index}>
          <ListItemText primary={item.title} secondary={`Due: ${item.due}`} />
        </ListItem>
      ))}
    </List>
  </div>
);

export default AssignmentList;
