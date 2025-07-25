import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, TextField, Link } from '@mui/material';
import '../styles/Register.css';

const TeacherRegister = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    institution: '',
    yearsOfExperience: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.institution.trim()) return 'Institution is required.';
    if (!form.yearsOfExperience.trim()) return 'Years of experience is required.';
    if (isNaN(Number(form.yearsOfExperience)) || Number(form.yearsOfExperience) < 0) {
      return 'Years of experience must be a positive number.';
    }
    if (!form.phoneNumber.trim()) return 'Phone number is required.';
    if (!form.password) return 'Password is required.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Split full name into first and last name
    const [first_name, ...rest] = form.name.trim().split(' ');
    const last_name = rest.join(' ');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'}register/teacher/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.email,
          email: form.email,
          first_name,
          last_name,
          institution: form.institution,
          years_of_experience: Number(form.yearsOfExperience),
          phone_number: form.phoneNumber,
          password: form.password,
          password2: form.confirmPassword,
          role: 'teacher',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err?.detail || 'Registration failed. Please try again.');
        return;
      }

      navigate('/login/teacher');
    } catch {
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
            name="name"
            required
            value={form.name}
            onChange={handleChange}
          />
          <TextField
            label="Email or Username"
            variant="outlined"
            fullWidth
            margin="normal"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
          />
          <TextField
            label="Institution"
            variant="outlined"
            fullWidth
            margin="normal"
            name="institution"
            required
            value={form.institution}
            onChange={handleChange}
          />
          <TextField
            label="Years of Experience"
            variant="outlined"
            fullWidth
            margin="normal"
            name="yearsOfExperience"
            required
            type="number"
            inputProps={{ min: 0 }}
            value={form.yearsOfExperience}
            onChange={handleChange}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            margin="normal"
            name="phoneNumber"
            required
            value={form.phoneNumber}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
          />
          <TextField
            label="Confirm Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            name="confirmPassword"
            required
            value={form.confirmPassword}
            onChange={handleChange}
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
