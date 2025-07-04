import React from "react";
import { Typography, TextField, Button, Paper, Box } from "@mui/material";

const StudentFeedback = () => (
  <div style={{ padding: 32, maxWidth: 600 }}>
    <Typography variant="h4" gutterBottom>Feedback</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        We value your feedback. Let us know how we can improve your learning experience.
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

export default StudentFeedback;
