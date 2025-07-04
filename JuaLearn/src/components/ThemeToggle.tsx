import React from "react";
import IconButton from "@mui/material/IconButton";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "../context/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <IconButton onClick={toggleTheme}>
      {mode === "dark" ? (
        <LightModeIcon sx={{ color: "#ffeb3b" }} />
      ) : (
        <DarkModeIcon sx={{ color: "#23395d" }} />
      )}
    </IconButton>
  );
};


export default ThemeToggle;
