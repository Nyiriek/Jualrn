import { useEffect, useState } from "react";
import { Alert, LinearProgress, Paper, Typography } from "@mui/material";
import api from "../api/axios";

type Grade = { grade: number };

const PerformanceChart = () => {
  const [average, setAverage] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/student/grades/assignments/"), api.get("/student/grades/quizzes/")])
      .then(([assignments, quizzes]) => {
        const grades = [...assignments.data, ...quizzes.data].map((item: Grade) => item.grade).filter((grade: unknown): grade is number => typeof grade === "number");
        setAverage(grades.length ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length) : null);
      })
      .catch(() => setError("Performance is unavailable right now."));
  }, []);

  return <Paper sx={{ p: 2, mt: 2 }}>
    <Typography variant="h6">Performance overview</Typography>
    {error ? <Alert severity="warning" sx={{ mt: 1 }}>{error}</Alert> : average === null ? <Typography color="text.secondary" sx={{ mt: 1 }}>Complete a quiz or receive an assignment grade to see your average.</Typography> : <><LinearProgress variant="determinate" value={average} sx={{ height: 10, borderRadius: 5, my: 1.5 }} /><Typography>{average}% average across graded work</Typography></>}
  </Paper>;
};

export default PerformanceChart;
