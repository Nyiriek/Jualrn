import React from "react";
import { Typography, TextField, Button, Paper, Box } from "@mui/material";

const TeacherFeedback = () => (
  <div style={{ padding: 32, maxWidth: 600 }}>
    <Typography variant="h4" gutterBottom>Feedback</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Your feedback helps us improve the platform. Share your thoughts!
      </Typography>
      <Box component="form">
        <TextField
          label="Your Feedback"
          multiline
          minRows={4}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained">Send Feedback</Button>
      </Box>
    </Paper>
  </div>
);

export default TeacherFeedback;
