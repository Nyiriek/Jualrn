// src/pages/StudentLogin.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Box, Paper, Typography, Button, TextField, Link } from '@mui/material';
import '../styles/StudentLogin.css';

const StudentLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('auth/login/', {
        username: email,
        password,
      });
      // This expects the backend to return: { access, refresh, role, ... }
      login(res.data); // Store user+token in context/localStorage
      navigate('/student');
    } catch (err: any) {
      setError('Login failed. Please check your email and password.');
    }
  };

  return (
    <Box className="login-form-root">
      <Paper elevation={2} className="login-form-paper">
        <Typography variant="h5" gutterBottom>
          Student Login
        </Typography>
        <form onSubmit={handleSubmit} className="login-form">
          <TextField
            label="Email or username"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Login
          </Button>
          <Box mt={2} textAlign="center">
            <Link href="/register/student">Don't have an account? Register</Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default StudentLogin;
