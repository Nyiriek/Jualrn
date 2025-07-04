import React from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Paper } from "@mui/material";

const grades = [
  { student: "John Doe", course: "Mathematics", grade: "A" },
  { student: "Jane Smith", course: "English", grade: "B+" },
  { student: "Alice Brown", course: "Biology", grade: "A-" },
];

const TeacherGradeBook = () => (
  <div style={{ padding: 32 }}>
    <Typography variant="h4" gutterBottom>GradeBook</Typography>
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Student</TableCell>
            <TableCell>Course</TableCell>
            <TableCell>Grade</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {grades.map((g, idx) => (
            <TableRow key={idx}>
              <TableCell>{g.student}</TableCell>
              <TableCell>{g.course}</TableCell>
              <TableCell>{g.grade}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </div>
);

export default TeacherGradeBook;
