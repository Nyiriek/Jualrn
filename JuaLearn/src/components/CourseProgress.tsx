// src/components/CourseProgress.tsx
import React from "react";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";
import { useThemeMode } from "../context/ThemeContext";

const courses = [
  { name: "Mathematics", progress: 80 },
  { name: "Economics", progress: 50 },
  { name: "Citizenship", progress: 30 },
];

const CourseProgress: React.FC = () => {
  const { mode } = useThemeMode();
  return (
    <Box className="course-box" sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, color: mode === "dark" ? "#fff" : "#23395d" }}>
        Enrolled Courses
      </Typography>
      <Stack direction="row" spacing={2}>
        {courses.map((course) => (
          <Paper
            key={course.name}
            sx={{
              p: 2,
              flex: 1,
              minWidth: 200,
              textAlign: "center",
              background: mode === "dark" ? "#23262d" : "#f3f6fb",
              color: mode === "dark" ? "#fff" : "#23395d",
              boxShadow:
                mode === "dark"
                  ? "0 0 18px 3px #3895ff99, 0 2px 8px rgba(0,0,0,0.18)"
                  : "0 2px 8px rgba(0,0,0,0.06)",
              border: mode === "dark" ? "1.5px solid #333a" : "1.5px solid #e0e0e0",
              transition: "background 0.3s, color 0.3s, box-shadow 0.3s",
            }}
          >
            <Typography variant="h6">{course.name}</Typography>
            <Typography color={mode === "dark" ? "#bfc7d1" : "text.secondary"}>
              {course.progress}% - progress
            </Typography>
            <Button
              variant="contained"
              sx={{
                mt: 1,
                bgcolor: mode === "dark" ? "#3895ff" : undefined,
                color: mode === "dark" ? "#fff" : undefined
              }}
            >
              Continue
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default CourseProgress;
