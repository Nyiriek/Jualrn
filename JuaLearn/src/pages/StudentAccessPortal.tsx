import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { useNavigate } from "react-router-dom";

const StudentAccessPortal = () => {
  const navigate = useNavigate();
  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2, py: 4, bgcolor: "#f3f6f5", background: "radial-gradient(circle at 80% 10%, #dcefe9 0, transparent 32%), #f3f6f5" }}>
    <Box sx={{ width: "min(100%, 880px)" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/courses")} sx={{ mb: 2, color: "#28796b" }}>Back to courses</Button>
      <Card sx={{ overflow: "hidden", borderRadius: 4, boxShadow: "0 24px 60px rgba(21,43,67,.13)" }}>
        <Box sx={{ p: { xs: 3, sm: 5 }, color: "#f6fbfa", bgcolor: "#1e4854", background: "linear-gradient(130deg, #193b57, #28796b)" }}><SchoolOutlinedIcon sx={{ fontSize: 38, mb: 1 }} /><Typography variant="overline" fontWeight={800} letterSpacing=".12em">Student access</Typography><Typography variant="h3" fontWeight={800} sx={{ mt: .5, fontSize: { xs: "2rem", sm: "2.7rem" } }}>Enrol to take course.</Typography><Typography sx={{ mt: 1, maxWidth: 570, color: "#d9eeea", lineHeight: 1.7 }}>Sign in to your student account to enrol in published courses, track progress, submit work and take quizzes. New to JuaLearn? Create a free student account first.</Typography></Box>
        <CardContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: "#fff" }}><Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1, p: 2, border: "1px solid", borderColor: "#dce4e8", borderRadius: 3 }}><LoginIcon color="primary" /><Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>I already have an account</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, minHeight: { sm: 42 } }}>Sign in, then choose the course you would like to enrol in.</Typography><Button variant="contained" fullWidth startIcon={<LoginIcon />} sx={{ mt: 2 }} onClick={() => navigate("/login/student")}>Student login</Button></Box>
          <Box sx={{ flex: 1, p: 2, border: "1px solid", borderColor: "#b9d9d1", borderRadius: 3, bgcolor: "#f4faf8" }}><PersonAddAltOutlinedIcon sx={{ color: "#28796b" }} /><Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>I am new to JuaLearn</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5, minHeight: { sm: 42 } }}>Create a student account to start building your learning journey.</Typography><Button variant="outlined" fullWidth startIcon={<PersonAddAltOutlinedIcon />} sx={{ mt: 2, borderColor: "#28796b", color: "#28796b" }} onClick={() => navigate("/register/student")}>Create student account</Button></Box>
        </Stack></CardContent>
      </Card>
    </Box>
  </Box>;
};

export default StudentAccessPortal;
