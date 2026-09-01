import React, { createContext, useState, useMemo, useContext } from "react";
import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";

type ThemeMode = "light" | "dark";
type ThemeContextProps = {
  mode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextProps>({
  mode: "light",
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem("theme") as ThemeMode) || "light"
  );

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  const value = useMemo(() => ({ mode, toggleTheme }), [mode]);
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: "#2563eb", dark: "#1d4ed8" },
      secondary: { main: "#0f766e" },
      background: mode === "dark"
        ? { default: "#111827", paper: "#1f2937" }
        : { default: "#f6f8fc", paper: "#ffffff" },
    },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h4: { fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" },
      h6: { fontWeight: 700 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 8, textTransform: "none", fontWeight: 650 } },
      },
      MuiCard: { styleOverrides: { root: { border: mode === "dark" ? "1px solid #374151" : "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)" } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiTextField: { defaultProps: { size: "small" } },
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
