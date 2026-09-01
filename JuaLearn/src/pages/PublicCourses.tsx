import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import api from "../api/axios";
import { getCourseCover } from "../utils/courseCover";

type Course = { id: number; name: string; description: string; teacher_name?: string; resources?: unknown[] };

const PublicCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/public-courses/").then((response) => setCourses(response.data))
      .catch(() => setError("Courses could not be loaded right now. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6f5", color: "#152b43", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 } }}>
    <Box sx={{ maxWidth: 1180, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} sx={{ mb: 2, color: "#28796b" }}>Back to JuaLearn</Button>
      <Box sx={{ maxWidth: 720, mb: 4 }}><Typography color="#28796b" variant="overline" fontWeight={800} letterSpacing=".12em">Learning library</Typography><Typography variant="h3" sx={{ mt: .5, fontWeight: 800, letterSpacing: "-.05em", fontSize: { xs: "2.15rem", sm: "3.1rem" } }}>Explore published courses.</Typography><Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>Read course overviews and lesson content before enrolling. Enrolment unlocks your learning space, activities and assessments.</Typography></Box>
      {loading && <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {courses.map((course) => <Card key={course.id} sx={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 3, boxShadow: "0 10px 25px rgba(21,43,67,.09)" }}>
          <CardMedia component="img" image={getCourseCover(course.name)} alt="" height="172" sx={{ objectFit: "cover" }} />
          <CardContent sx={{ flexGrow: 1, p: 2.25 }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Chip icon={<MenuBookOutlinedIcon />} label="Course" size="small" color="success" variant="outlined" /><Typography variant="caption" color="text.secondary">{course.resources?.length || 0} resources</Typography></Stack><Typography variant="h6" sx={{ mt: 1.5, fontWeight: 800 }}>{course.name}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .75, lineHeight: 1.65 }}>{course.description || "Curriculum-aligned learning resources and lessons."}</Typography><Typography variant="body2" sx={{ mt: 2, color: "#516579" }}>Teacher: <strong>{course.teacher_name || "JuaLearn teacher"}</strong></Typography></CardContent>
          <CardActions sx={{ px: 2.25, pb: 2.25, gap: 1 }}><Button variant="outlined" fullWidth onClick={() => navigate(`/courses/${course.id}`)}>View course</Button><Button variant="contained" fullWidth onClick={() => navigate(`/student-access?course=${course.id}`)}>Enrol</Button></CardActions>
        </Card>)}
      </Box>}
      {!loading && !error && courses.length === 0 && <Alert severity="info">No published courses are available yet.</Alert>}
    </Box>
  </Box>;
};

export default PublicCourses;
