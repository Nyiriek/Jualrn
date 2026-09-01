import React from "react";
import IconButton from "@mui/material/IconButton";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "../context/ThemeContext";

type ThemeToggleProps = { color?: string };

const ThemeToggle: React.FC<ThemeToggleProps> = ({ color }) => {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <IconButton onClick={toggleTheme} aria-label="toggle colour theme">
      {mode === "dark" ? (
        <LightModeIcon sx={{ color: "#ffeb3b" }} />
      ) : (
        <DarkModeIcon sx={{ color: color || "#23395d" }} />
      )}
    </IconButton>
  );
};


export default ThemeToggle;
