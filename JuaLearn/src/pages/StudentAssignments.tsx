import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography, Button } from "@mui/material";

const assignments = [
  { title: "Algebra Homework", subject: "Mathematics", due: "2025-07-18", status: "Pending" },
  { title: "Essay: My Hero", subject: "English", due: "2025-07-20", status: "Submitted" },
  { title: "Photosynthesis Quiz", subject: "Biology", due: "2025-07-22", status: "Pending" },
];

const StudentAssignments = () => (
  <div style={{ padding: 32 }}>
    <Typography variant="h4" gutterBottom>Assignments</Typography>
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map(a => (
            <TableRow key={a.title}>
              <TableCell>{a.title}</TableCell>
              <TableCell>{a.subject}</TableCell>
              <TableCell>{a.due}</TableCell>
              <TableCell>{a.status}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color={a.status === "Submitted" ? "success" : "primary"}
                  disabled={a.status === "Submitted"}
                  size="small"
                >
                  {a.status === "Submitted" ? "Submitted" : "Submit"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </div>
);

export default StudentAssignments;
