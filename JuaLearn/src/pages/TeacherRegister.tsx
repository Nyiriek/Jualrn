import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Link, IconButton, InputAdornment } from '@mui/material';
import { ArrowBack, AutoStoriesOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import '../styles/authPages.css';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const registrationError = (payload: any) => {
    if (!payload) return 'Registration failed. Please try again.';
    if (typeof payload === 'string') return payload;
    if (payload.detail) return payload.detail;
    return Object.values(payload).flat().filter(Boolean).join(' ') || 'Registration failed. Please try again.';
  };

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
        setError(registrationError(err));
        return;
      }

      // Standard registration: the account is immediately available to sign in.
      navigate('/login/teacher');
    } catch {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Box className="auth-page"><Box className="auth-shell auth-teacher">
      <Box className="auth-aside"><div className="auth-brand"><span className="auth-brand-mark"><AutoStoriesOutlined fontSize="small" /></span><span>Jua<span>Learn</span></span></div><div className="auth-aside-copy"><Typography variant="overline" fontWeight={800} letterSpacing=".12em">Build better learning</Typography><h1>Bring your teaching together.</h1><p>Create courses from trusted resources, manage assessments and see how your learners are progressing.</p></div><div className="auth-aside-note"><i />Purposeful tools, designed for teachers.</div></Box>
      <Box className="auth-form-card"><Button className="auth-back" startIcon={<ArrowBack />} onClick={() => navigate('/login')}>All sign-in options</Button><span className="auth-eyebrow">Create your account</span><h2>Join as a teacher</h2><p>Tell us a little about your teaching context to get started.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <TextField
            id="teacher-register-name"
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
            id="teacher-register-email"
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
            id="teacher-register-institution"
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
            id="teacher-register-experience"
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
            id="teacher-register-phone"
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
            id="teacher-register-password"
            label="Password"
            variant="outlined"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((shown) => !shown)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
          />
          <TextField
            id="teacher-register-password-confirmation"
            label="Confirm Password"
            variant="outlined"
            type={showConfirmation ? "text" : "password"}
            fullWidth
            margin="normal"
            name="confirmPassword"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmation((shown) => !shown)} edge="end">{showConfirmation ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
          />
          {error && <Typography className="auth-error" color="error" variant="body2">{error}</Typography>}
          <Button
            type="submit"
            variant="contained"
            color="success"
            fullWidth
            sx={{ mt: 2 }}
          >
            Register
          </Button>
          <p className="auth-switch">Already have an account? <Link href="/login/teacher">Teacher sign in</Link></p>
        </form>
      </Box>
    </Box></Box>
  );
};

export default TeacherRegister;
