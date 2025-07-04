// src/components/Widgets.tsx
import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useThemeMode } from "../context/ThemeContext";

const Widgets: React.FC = () => {
  const { mode } = useThemeMode();

  return (
    <Box sx={{ display: "flex", gap: 2, my: 2 }}>
      <Paper
        elevation={mode === "dark" ? 0 : 3}
        sx={{
          flex: 1,
          p: 2,
          background: mode === "dark" ? "#2e313a" : "#fff",
          color: mode === "dark" ? "#fff" : "#23395d",
          boxShadow:
            mode === "dark"
              ? "0 0 18px #3895ff55"
              : "0 2px 8px rgba(0,0,0,0.06)",
          borderRadius: "12px",
          transition: "background 0.3s, color 0.3s, box-shadow 0.3s"
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Class Performance
        </Typography>
        {/* Add chart, stats etc */}
        <Typography variant="body2">Performance Chart Widget</Typography>
      </Paper>
      <Paper
        elevation={mode === "dark" ? 0 : 3}
        sx={{
          flex: 1,
          p: 2,
          background: mode === "dark" ? "#2e313a" : "#fff",
          color: mode === "dark" ? "#fff" : "#23395d",
          boxShadow:
            mode === "dark"
              ? "0 0 18px #3895ff55"
              : "0 2px 8px rgba(0,0,0,0.06)",
          borderRadius: "12px",
          transition: "background 0.3s, color 0.3s, box-shadow 0.3s"
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Assignment Overview
        </Typography>
        {/* Add assignment list/summary here */}
        <Typography variant="body2">Assignments Summary Widget</Typography>
      </Paper>
    </Box>
  );
};

export default Widgets;
