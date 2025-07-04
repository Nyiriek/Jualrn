// src/components/NotificationBell.tsx
import React from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import { useThemeMode } from "../context/ThemeContext";

const NotificationBell: React.FC<{ count?: number }> = ({ count }) => {
  const { mode } = useThemeMode();
  // Use #23395d in light, white in dark
  const iconColor = mode === "dark" ? "#fff" : "#23395d";
  // Optional: Add a glow effect in dark mode
  const glow = mode === "dark"
    ? { filter: "drop-shadow(0 0 6px #fff)" }
    : {};

  return (
    <IconButton>
      <Badge badgeContent={count} color="error">
        <NotificationsIcon sx={{ color: iconColor, ...glow }} />
      </Badge>
    </IconButton>
  );
};

export default NotificationBell;
