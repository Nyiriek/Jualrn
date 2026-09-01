import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardActions, CardContent, CardMedia, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getCourseCover } from "../utils/courseCover";

type Subject = { id: number; name: string; description: string; published: boolean; teacher_name?: string };
type Enrollment = { subject: Subject };

const StudentSubjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.get("/subjects/"), api.get("/student/enrollments/")])
      .then(([subjectResponse, enrollmentResponse]) => {
        setSubjects(subjectResponse.data);
        setEnrolledIds(enrollmentResponse.data.map((enrollment: Enrollment) => enrollment.subject.id));
      })
      .catch(() => setError("We could not load courses. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, []);

  const enroll = async (subjectId: number) => {
    setBusyId(subjectId);
    try {
      await api.post("/enrollments/", { subject_id: subjectId });
      setEnrolledIds((current) => [...current, subjectId]);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Unable to enrol in this course.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Box sx={{ p: 4 }}><CircularProgress /></Box>;
  if (error && subjects.length === 0) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" gutterBottom>Explore courses</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Choose a published course, enrol once, and access its lessons and assessments.</Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
        {subjects.map((subject) => {
          const enrolled = enrolledIds.includes(subject.id);
          return <Card key={subject.id} sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <CardMedia component="img" height="148" image={getCourseCover(subject.name)} alt={`${subject.name} course cover`} sx={{ objectFit: "cover" }} />
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Button variant="text" color="inherit" onClick={() => navigate(`/student/subject/${subject.id}`)} sx={{ p: 0, minWidth: 0, textTransform: "none", textAlign: "left", mb: 0.5 }}><Typography variant="h6">{subject.name}</Typography></Button><Chip size="small" color="success" label="Published" /></Stack>
              <Typography color="text.secondary">{subject.description || "Curriculum-aligned learning resources."}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Teacher: <strong>{subject.teacher_name || "JuaLearn teacher"}</strong></Typography>
            </CardContent>
            <CardActions>
              {enrolled ? <Button fullWidth variant="contained" onClick={() => navigate(`/student/subject/${subject.id}`)}>Open course</Button> :
                <Button fullWidth variant="outlined" disabled={busyId === subject.id} onClick={() => enroll(subject.id)}>{busyId === subject.id ? "Enrolling…" : "Enrol"}</Button>}
            </CardActions>
          </Card>;
        })}
      </Box>
    </Box>
  );
};

export default StudentSubjects;
