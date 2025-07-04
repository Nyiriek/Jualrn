import React from "react";
import { Card, CardContent, Typography, TextField, Button, Box } from "@mui/material";

const discussions = [
  { author: "Teacher", topic: "Math Homework", text: "If you have questions about the algebra assignment, post them here." },
  { author: "Student", topic: "English Essay", text: "Is it okay to write in the first person for this essay?" },
];

const StudentForum = () => (
  <div style={{ padding: 32, maxWidth: 800 }}>
    <Typography variant="h4" gutterBottom>Forum</Typography>
    <Box sx={{ mb: 3 }}>
      <TextField label="Start a new topic" fullWidth sx={{ mb: 1 }} />
      <Button variant="contained">Post</Button>
    </Box>
    {discussions.map((d, i) => (
      <Card key={i} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600}>{d.topic}</Typography>
          <Typography variant="body2" color="text.secondary">{d.text}</Typography>
          <Typography variant="caption" sx={{ float: "right", mt: 1 }}>By {d.author}</Typography>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default StudentForum;
