import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

const Login = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Box width={{ xs: '90%', sm: '70%', md: '50%' }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Welcome to <strong>JuaLearn</strong>
          </Typography>
          <Typography variant="subtitle1" align="center" sx={{ mb: 3 }}>
            Select your role to continue
          </Typography>

          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={4}
            justifyContent="center"
          >
            {/* Student Login */}
            <Box flex={1}>
              <Paper
                elevation={1}
                sx={{
                  textAlign: 'center',
                  padding: 3,
                  '&:hover': { boxShadow: 6 },
                  cursor: 'pointer'
                }}
              >
                <Avatar sx={{ bgcolor: '#1976d2', margin: '0 auto', mb: 1 }}>
                  <SchoolIcon />
                </Avatar>
                <Typography variant="h6">Student</Typography>
                <Typography variant="body2" color="text.secondary">
                  Access learning materials, assessments, and personalized help.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/login/student')}
                >
                  Login as Student
                </Button>
              </Paper>
            </Box>

            {/* Teacher Login */}
            <Box flex={1}>
              <Paper
                elevation={1}
                sx={{
                  textAlign: 'center',
                  padding: 3,
                  '&:hover': { boxShadow: 6 },
                  cursor: 'pointer'
                }}
              >
                <Avatar sx={{ bgcolor: '#388e3c', margin: '0 auto', mb: 1 }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6">Teacher</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage content, track students, and support learning.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/login/teacher')}
                >
                  Login as Teacher
                </Button>
              </Paper>
            </Box>
          </Box>

          <Divider sx={{ mt: 4 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            align="center"
            sx={{ mt: 2 }}
          >
            Designed for low-resource environments.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
