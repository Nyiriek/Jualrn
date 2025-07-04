import React from "react";
import { Typography, LinearProgress, Box, Paper } from "@mui/material";

const progress = [
  { subject: "Mathematics", percent: 80 },
  { subject: "English", percent: 60 },
  { subject: "Biology", percent: 30 },
];

const StudentProgress = () => (
  <div style={{ padding: 32 }}>
    <Typography variant="h4" gutterBottom>Progress Tracker</Typography>
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      {progress.map((p, idx) => (
        <Box key={p.subject} sx={{ mb: idx < progress.length - 1 ? 3 : 0 }}>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{p.subject}</Typography>
          <LinearProgress variant="determinate" value={p.percent} sx={{ height: 12, borderRadius: 6 }} />
          <Typography variant="caption">{p.percent}% complete</Typography>
        </Box>
      ))}
    </Paper>
  </div>
);

export default StudentProgress;
