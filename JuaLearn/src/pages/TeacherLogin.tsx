import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Box, Typography, Button, TextField, Link, IconButton, InputAdornment } from '@mui/material';
import { ArrowBack, AutoStoriesOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import '../styles/authPages.css';

const TeacherLogin = () => {
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

      navigate('/teacher');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your email and password.');
    }
  };

  return (
    <Box className="auth-page"><Box className="auth-shell auth-compact auth-teacher">
      <Box className="auth-aside"><div className="auth-brand"><span className="auth-brand-mark"><AutoStoriesOutlined fontSize="small" /></span><span>Jua<span>Learn</span></span></div><div className="auth-aside-copy"><Typography variant="overline" fontWeight={800} letterSpacing=".12em">Teacher workspace</Typography><h1>Guide every learner with clarity.</h1><p>Build courses, share resources and respond to progress with everything you need in one place.</p></div><div className="auth-aside-note"><i />Practical tools for real classrooms.</div></Box>
      <Box className="auth-form-card"><Button className="auth-back" startIcon={<ArrowBack />} onClick={() => navigate('/login')}>All sign-in options</Button><span className="auth-eyebrow">Welcome back</span><h2>Teacher sign in</h2><p>Sign in to manage your courses and support your learners.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <TextField
            id="teacher-login-username"
            name="username"
            label="Email or Username"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            id="teacher-login-password"
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
            color="success"
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
          <p className="auth-switch">New to JuaLearn? <Link href="/register/teacher">Create a teacher account</Link></p>
        </form>
      </Box>
    </Box></Box>
  );
};

export default TeacherLogin;
