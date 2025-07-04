import React from "react";
import { Typography, Paper, List, ListItem, ListItemText } from "@mui/material";

const reports = [
  { title: "Term 1 Mathematics Performance", date: "2025-07-10" },
  { title: "English Essay Submissions", date: "2025-07-12" },
  { title: "Biology Quiz Results", date: "2025-07-14" },
];

const TeacherReports = () => (
  <div style={{ padding: 32, maxWidth: 600 }}>
    <Typography variant="h4" gutterBottom>Reports</Typography>
    <Paper sx={{ p: 2 }}>
      <List>
        {reports.map((r, idx) => (
          <ListItem key={idx} divider>
            <ListItemText
              primary={r.title}
              secondary={`Date: ${r.date}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  </div>
);

export default TeacherReports;
