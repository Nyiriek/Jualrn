import React from 'react';
import { Typography, Box } from '@mui/material';

const DashboardHome: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to the Admin Dashboard
      </Typography>
      <Typography variant="body1">
        Use the sidebar to manage users, subjects, and more.
      </Typography>
    </Box>
  );
};

export default DashboardHome;
