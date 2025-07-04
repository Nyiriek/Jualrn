// src/components/ActionCards.tsx
import React from "react";
import { Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { useThemeMode } from "../context/ThemeContext"; // <-- Import theme context

const actions = [
  { title: "Add Lesson", color: "primary" },
  { title: "Schedule Quiz", color: "secondary" },
  { title: "Upload Resources", color: "success" },
];

const ActionCards: React.FC = () => {
  const { mode } = useThemeMode(); // <-- Get current theme mode

  return (
    <Stack direction="row" spacing={2} sx={{ my: 2 }}>
      {actions.map((action) => (
        <Card
          sx={{
            minWidth: 200,
            background: mode === "dark" ? "#2e313a" : "#f3f6fb",
            color: mode === "dark" ? "#fff" : "#23395d",
            boxShadow:
              mode === "dark"
                ? "0 0 18px #3895ff55"
                : "0 2px 8px rgba(0,0,0,0.06)",
            borderRadius: "12px",
            transition: "background 0.3s, color 0.3s, box-shadow 0.3s"
          }}
          key={action.title}
        >
          <CardContent>
            <Typography variant="h6">{action.title}</Typography>
            <Button
              variant="contained"
              color={action.color as any}
              sx={{
                mt: 2,
                boxShadow:
                  mode === "dark"
                    ? "0 0 8px #3895ff99"
                    : undefined,
                borderRadius: "20px"
              }}
              fullWidth
            >
              {action.title}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default ActionCards;
