import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableRow, Typography, Paper, TextField, Button,
} from "@mui/material";
import axios from "../api/axios";

interface Grade {
  id: number;
  student: string;
  studentId: number;
  course: string;
  assignmentId: number;
  grade: string | null;
}

const TeacherGradeBook: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [editing, setEditing] = useState<{ [assignmentId: number]: string }>({});
  const [loading, setLoading] = useState(false);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/assignments/");
      const data = res.data.map((a: any) => ({
        id: a.id,
        student: a.assigned_to.first_name + " " + a.assigned_to.last_name,
        studentId: a.assigned_to.id,
        course: a.subject.name,
        assignmentId: a.id,
        grade: a.grade !== null ? a.grade.toString() : "",
      }));
      setGrades(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handleGradeChange = (assignmentId: number, value: string) => {
    setEditing(prev => ({ ...prev, [assignmentId]: value }));
  };

  const handleSaveGrade = async (assignmentId: number) => {
    const gradeValue = editing[assignmentId];
    if (!gradeValue) return alert("Grade cannot be empty");
    try {
      await axios.patch(`/assignments/${assignmentId}/`, { grade: gradeValue });
      fetchGrades();
      setEditing(prev => {
        const copy = { ...prev };
        delete copy[assignmentId];
        return copy;
      });
    } catch (err) {
      alert("Failed to save grade");
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <Typography variant="h4" gutterBottom>GradeBook</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading...</TableCell>
              </TableRow>
            ) : (
              grades.map(g => (
                <TableRow key={g.assignmentId}>
                  <TableCell>{g.student}</TableCell>
                  <TableCell>{g.course}</TableCell>
                  <TableCell>
                    {editing[g.assignmentId] !== undefined ? (
                      <TextField
                        value={editing[g.assignmentId]}
                        onChange={e => handleGradeChange(g.assignmentId, e.target.value)}
                      />
                    ) : (
                      g.grade || "Not graded"
                    )}
                  </TableCell>
                  <TableCell>
                    {editing[g.assignmentId] !== undefined ? (
                      <Button variant="contained" onClick={() => handleSaveGrade(g.assignmentId)}>Save</Button>
                    ) : (
                      <Button variant="outlined" onClick={() => handleGradeChange(g.assignmentId, g.grade ?? "")}>Edit</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};

export default TeacherGradeBook;
