import React, { useState } from "react";
import { Box, Typography, TextField, Button, Alert, CircularProgress, IconButton, InputAdornment } from "@mui/material";
import { ArrowBack, AdminPanelSettingsOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../styles/authPages.css";

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post("/auth/admin-login/", {
        username,
        password,
      });

      const data = response.data;

      if (data.access) {
        login({
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
          access: data.access,
          refresh: data.refresh,
        });

        // Store the session first, then replace the login route so the admin
        // guard never evaluates against a stale login history entry.
        navigate("/admin", { replace: true });
      } else {
        setError(data.detail || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="auth-page"><Box className="auth-shell auth-compact auth-admin">
      <Box className="auth-aside"><div className="auth-brand"><span className="auth-brand-mark"><AdminPanelSettingsOutlined fontSize="small" /></span><span>Jua<span>Learn</span></span></div><div className="auth-aside-copy"><Typography variant="overline" fontWeight={800} letterSpacing=".12em">Administration</Typography><h1>Keep learning quality on track.</h1><p>Review published courses, manage users and maintain a trusted learning platform.</p></div><div className="auth-aside-note"><i />Restricted administration access.</div></Box>
      <Box className="auth-form-card"><Button className="auth-back" startIcon={<ArrowBack />} onClick={() => navigate('/')}>Back to JuaLearn</Button><span className="auth-eyebrow">Separate administration portal</span><h2>Admin sign in</h2><p>Use your administrator credentials to continue. Student and teacher accounts use their own sign-in portal.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <TextField
            id="admin-login-username"
            name="username"
            label="Username"
            fullWidth
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <TextField
            id="admin-login-password"
            name="password"
            label="Password"
            fullWidth
            variant="outlined"
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((shown) => !shown)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
          />
          {error && <Alert className="auth-error" severity="error">{error}</Alert>}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            type="submit"
            sx={{ mt: 2, py: 1 }}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </form>
      </Box>
    </Box></Box>
  );
};

export default AdminLogin;
