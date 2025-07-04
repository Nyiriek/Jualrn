import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, TextField, Link } from '@mui/material';
import '../styles/Register.css';

const TeacherRegister = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Split full name
    const [first_name, ...rest] = name.trim().split(' ');
    const last_name = rest.join(' ');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/register/teacher/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email, // You can use email as username
          email,
          password,
          first_name,
          last_name,
          role: "teacher",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err?.detail || "Registration failed. Please try again.");
        return;
      }

      navigate('/login/teacher');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Box className="register-form-root">
      <Paper elevation={2} className="register-form-paper">
        <Typography variant="h5" gutterBottom>
          Teacher Registration
        </Typography>
        <form onSubmit={handleSubmit} className="register-form">
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Email or Username"
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
            color="success"
            fullWidth
            sx={{ mt: 2 }}
          >
            Register
          </Button>
          <Box mt={2} textAlign="center">
            <Link href="/login/teacher">Already have an account? Login</Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default TeacherRegister;
