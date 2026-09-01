import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import PersonIcon from '@mui/icons-material/AutoStoriesOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../styles/authPages.css';

const Login = () => {
  const navigate = useNavigate();

  return (
    <Box className="auth-choice-page"><Box sx={{ width: 'min(100%, 920px)' }}><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2, color: '#28796b' }}>Back to JuaLearn</Button><Paper className="auth-choice-card"><Box className="auth-choice-head"><Typography variant="overline" fontWeight={800} color="#28796b" letterSpacing=".12em">Welcome to JuaLearn</Typography><h1>Choose your learning space.</h1><p>Continue to the role that matches the way you learn, teach and grow.</p></Box><Box className="auth-role-grid"><Box className="auth-role-option"><Box className="auth-role-icon student"><SchoolIcon /></Box><Typography variant="h6">Student</Typography><Typography>Open courses, practise with assessments and make steady progress at your own pace.</Typography><Button variant="contained" fullWidth onClick={() => navigate('/login/student')} sx={{ bgcolor: '#28796b', '&:hover': { bgcolor: '#206459' } }}>Continue as student</Button></Box><Box className="auth-role-option"><Box className="auth-role-icon teacher"><PersonIcon /></Box><Typography variant="h6">Teacher</Typography><Typography>Create purposeful learning, manage your courses and support every learner.</Typography><Button variant="contained" fullWidth onClick={() => navigate('/login/teacher')} sx={{ bgcolor: '#284d70', '&:hover': { bgcolor: '#1d3b58' } }}>Continue as teacher</Button></Box></Box><Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 3 }}>Designed for learning that works across devices and classrooms.</Typography></Paper></Box></Box>
  );
};

export default Login;
