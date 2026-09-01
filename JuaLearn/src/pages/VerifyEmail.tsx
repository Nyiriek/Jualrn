import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import api from "../api/axios";
import "../styles/authPages.css";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") === "teacher" ? "teacher" : "student";
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error" | "resent">("idle");
  const [message, setMessage] = useState(searchParams.get("sent") ? "We sent a 4-digit verification code to your email." : "");

  const verify = async () => {
    if (!email.trim()) { setStatus("error"); setMessage("Enter the email address you used to register."); return; }
    if (!/^\d{4}$/.test(code.trim())) { setStatus("error"); setMessage("Enter the 4-digit code from your email."); return; }
    setStatus("verifying"); setMessage("");
    try {
      const response = await api.post("/auth/verify-email/", { email: email.trim(), code: code.trim() });
      setStatus("verified");
      setMessage(`${response.data.detail} Redirecting you to sign in…`);
      window.setTimeout(() => navigate(`/login/${role}`), 1400);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.response?.data?.detail || "We could not verify that code. Please try again.");
    }
  };

  const resend = async () => {
    if (!email.trim()) { setStatus("error"); setMessage("Enter the email address you used to register."); return; }
    setStatus("verifying"); setMessage("");
    try { const response = await api.post("/auth/resend-verification/", { email: email.trim() }); setStatus("resent"); setMessage(response.data.detail); }
    catch (error: any) { setStatus("error"); setMessage(error.response?.data?.detail || "We could not send a verification code right now."); }
  };

  return <Box className="auth-page"><Paper sx={{ width: "min(100%, 540px)", p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: "center", boxShadow: "0 24px 60px rgba(26,52,70,.14)" }}>
    <Box sx={{ width: 62, height: 62, display: "grid", placeItems: "center", mx: "auto", mb: 2, borderRadius: "50%", color: "#28796b", bgcolor: "#e2f3ed" }}><MarkEmailReadOutlinedIcon sx={{ fontSize: 32 }} /></Box>
    <Typography variant="overline" color="#28796b" fontWeight={800} letterSpacing=".12em">Email verification</Typography>
    <Typography variant="h4" fontWeight={800} sx={{ mt: .5 }}>Confirm your email.</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>Enter the 4-digit code we sent to your registration email. This keeps every JuaLearn account connected to a real, reachable address.</Typography>
    {status === "verifying" && <Stack alignItems="center" spacing={1.5} sx={{ my: 3 }}><CircularProgress /><Typography color="text.secondary">Confirming your code…</Typography></Stack>}
    {message && <Alert severity={status === "error" ? "error" : status === "verified" ? "success" : "info"} sx={{ mt: 3, textAlign: "left" }}>{message}</Alert>}
    {status === "verified" ? <Button variant="contained" fullWidth sx={{ mt: 3, bgcolor: "#28796b", "&:hover": { bgcolor: "#206459" } }} onClick={() => navigate(`/login/${role}`)}>Continue to {role} sign in</Button> : <Stack spacing={1.25} sx={{ mt: 3, textAlign: "left" }}><TextField id="verification-email" name="email" label="Registration email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" fullWidth /><TextField id="verification-code" name="code" label="4-digit verification code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))} autoComplete="one-time-code" inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 4 }} fullWidth /><Button variant="contained" onClick={verify} disabled={status === "verifying"} sx={{ bgcolor: "#28796b", "&:hover": { bgcolor: "#206459" } }}>Verify code</Button><Typography variant="subtitle2" sx={{ pt: 1 }}>Didn’t receive a code?</Typography><Button variant="outlined" startIcon={<ReplayOutlinedIcon />} onClick={resend} disabled={status === "verifying"}>Resend verification code</Button><Button color="inherit" onClick={() => navigate(`/login/${role}`)}>Back to sign in</Button></Stack>}
  </Paper></Box>;
};

export default VerifyEmail;
