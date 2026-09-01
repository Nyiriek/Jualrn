import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Box, Typography, Button, TextField, Link, IconButton, InputAdornment } from '@mui/material';
import { ArrowBack, SchoolOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import '../styles/authPages.css';

const StudentLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('token/', {
        username: email,
        password,
      });

      // Pass entire user info + tokens object to login
      login({
        id: res.data.id,
        username: res.data.username,
        email: res.data.email,
        role: res.data.role,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        profilePicture: res.data.profilePicture,
        access: res.data.access,
        refresh: res.data.refresh,
      });

      navigate('/student');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your email and password.');
    }
  };

  return (
    <Box className="auth-page"><Box className="auth-shell auth-compact auth-student">
      <Box className="auth-aside"><div className="auth-brand"><span className="auth-brand-mark"><SchoolOutlined fontSize="small" /></span><span>Jua<span>Learn</span></span></div><div className="auth-aside-copy"><Typography variant="overline" fontWeight={800} letterSpacing=".12em">Student space</Typography><h1>Keep your learning moving.</h1><p>Return to your courses, activities, quizzes and progress in one calm, organised place.</p></div><div className="auth-aside-note"><i />Your learning journey is saved securely.</div></Box>
      <Box className="auth-form-card"><Button className="auth-back" startIcon={<ArrowBack />} onClick={() => navigate('/login')}>All sign-in options</Button><span className="auth-eyebrow">Welcome back</span><h2>Student sign in</h2><p>Enter your details to continue learning where you left off.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <TextField
            id="student-login-username"
            name="username"
            label="Email or username"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            id="student-login-password"
            name="password"
            label="Password"
            variant="outlined"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((shown) => !shown)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
          />
          {error && <Typography className="auth-error" color="error" variant="body2">{error}</Typography>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
          <p className="auth-switch">New to JuaLearn? <Link href="/register/student">Create a student account</Link></p>
        </form>
      </Box>
    </Box></Box>
  );
};

export default StudentLogin;
