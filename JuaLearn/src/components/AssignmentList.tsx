import { useEffect, useState } from "react";
import { Alert, CircularProgress, List, ListItem, ListItemText, Typography } from "@mui/material";
import api from "../api/axios";

interface AssignmentListProps { isTeacher?: boolean }
type Assignment = { id: number; title: string; due_date: string; created_at?: string; subject: { name: string }; submitted_at?: string | null };

const AssignmentList = ({ isTeacher = false }: AssignmentListProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/assignments/")
      .then((response) => setAssignments(response.data))
      .catch(() => setError("Assignments are unavailable right now."));
  }, []);

  return <div style={{ marginTop: "2rem" }}>
    <Typography variant="h6">{isTeacher ? "Assigned homework" : "Upcoming assignments"}</Typography>
    {error ? <Alert severity="warning">{error}</Alert> : assignments.length ? <List>
      {assignments.slice(0, 5).map((assignment) => <ListItem key={assignment.id}><ListItemText primary={assignment.title} secondary={`${assignment.subject.name} · Created ${assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : "Not recorded"} · Due ${new Date(assignment.due_date).toLocaleDateString()}${assignment.submitted_at ? " · Submitted" : ""}`} /></ListItem>)}
    </List> : <Typography color="text.secondary" sx={{ mt: 1 }}>No assignments yet.</Typography>}
  </div>;
};

export default AssignmentList;
