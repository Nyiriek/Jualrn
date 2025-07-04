import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, TextField, Link } from '@mui/material';
import '../styles/Register.css';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  interface RegisterStudentRequest {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
  }

  interface RegisterErrorResponse {
    detail?: string;
    [key: string]: any;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Split full name into first and last name
    const [first_name, ...rest] = name.trim().split(' ');
    const last_name = rest.join(' ');

    try {
      const requestBody: RegisterStudentRequest = {
        username: email,  
        email: email,
        password: password,
        first_name,
        last_name,
        role: "student"
      };

      const response = await fetch('http://127.0.0.1:8000/api/register/student/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err: RegisterErrorResponse = await response.json();
        setError(err?.detail || "Registration failed. Please try again.");
        return;
      }

      // Registration successful: navigate to login
      navigate('/login/student');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Box className="register-form-root">
      <Paper elevation={2} className="register-form-paper">
        <Typography variant="h5" gutterBottom>
          Student Registration
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
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Register
          </Button>
          <Box mt={2} textAlign="center">
            <Link href="/login/student">Already have an account? Login</Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default StudentRegister;
