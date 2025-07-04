import React from "react";
import Grid from '@mui/material/Grid';
import { Card, CardContent, Typography, Button } from "@mui/material";

const courses = [
  { title: "Mathematics", students: 42 },
  { title: "English", students: 39 },
  { title: "Biology", students: 31 },
];

const TeacherCourses = () => (
  <div style={{ padding: 32 }}>
    <Typography variant="h4" gutterBottom>My Courses</Typography>
    <Grid container columns={12} columnSpacing={3} rowSpacing={3} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 3 }}>
      {courses.map(course => (
        <Card sx={{ height: "100%" }} key={course.title}>
          <CardContent>
            <Typography variant="h6">{course.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {course.students} students enrolled
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>Manage</Button>
          </CardContent>
        </Card>
      ))}
    </Grid>
  </div>
);

export default TeacherCourses;
