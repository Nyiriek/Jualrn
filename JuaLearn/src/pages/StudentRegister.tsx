import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Link, IconButton, InputAdornment } from '@mui/material';
import { ArrowBack, SchoolOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import '../styles/authPages.css';

const StudentRegister = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const registrationError = (payload: RegisterErrorResponse | undefined) => {
    if (!payload) return 'Registration failed. Please try again.';
    if (typeof payload === 'string') return payload;
    if (payload.detail) return payload.detail;
    return Object.values(payload).flat().filter(Boolean).join(' ') || 'Registration failed. Please try again.';
  };

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

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/' }register/student/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err: RegisterErrorResponse = await response.json();
        setError(registrationError(err));
        return;
      }

      // Standard registration: the account is immediately available to sign in.
      navigate('/login/student');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Box className="auth-page"><Box className="auth-shell auth-student">
      <Box className="auth-aside"><div className="auth-brand"><span className="auth-brand-mark"><SchoolOutlined fontSize="small" /></span><span>Jua<span>Learn</span></span></div><div className="auth-aside-copy"><Typography variant="overline" fontWeight={800} letterSpacing=".12em">Start learning</Typography><h1>Your next course is waiting.</h1><p>Create your student account to enrol, study at your own pace and keep track of every step forward.</p></div><div className="auth-aside-note"><i />Courses, quizzes and progress in one place.</div></Box>
      <Box className="auth-form-card"><Button className="auth-back" startIcon={<ArrowBack />} onClick={() => navigate('/student-access')}>Back to student access</Button><span className="auth-eyebrow">Create your account</span><h2>Join as a student</h2><p>It only takes a moment to set up your learning space.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <TextField
            id="student-register-name"
            name="name"
            label="Full Name"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            id="student-register-email"
            name="email"
            label="Email or Username"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            id="student-register-password"
            name="password"
            label="Password"
            variant="outlined"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            required
            autoComplete="new-password"
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
            Register
          </Button>
          <p className="auth-switch">Already have an account? <Link href="/login/student">Student sign in</Link></p>
        </form>
      </Box>
    </Box></Box>
  );
};

export default StudentRegister;
