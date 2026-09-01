import React, { useMemo } from "react";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { useThemeMode } from "../context/ThemeContext";
import { ThemeProvider as MuiThemeProvider, createTheme, useMediaQuery, useTheme } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";
import JuaCompanion from "../components/JuaCompanion";
import { StudentDashboardPreferencesProvider, useStudentDashboardPreferences } from "../context/StudentDashboardPreferences";

const StudentDashboardContent: React.FC = () => {
  const { mode } = useThemeMode();
  const { accent, preferences } = useStudentDashboardPreferences();
  const baseTheme = useTheme();
  const isMobile = useMediaQuery("(max-width:900px)");
  const studentTheme = useMemo(() => createTheme(baseTheme, {
    palette: {
      primary: { main: accent, dark: darken(accent, .16) },
      secondary: { main: preferences.palette === "ocean" ? "#0f766e" : darken(accent, .28) },
      background: mode === "dark"
        ? { default: "#171a21", paper: preferences.style === "soft" ? alpha(accent, .16) : "#222731" }
        : { default: alpha(accent, preferences.style === "soft" ? .075 : .03), paper: preferences.style === "soft" ? alpha(accent, .055) : "#ffffff" },
    },
    shape: { borderRadius: preferences.style === "glass" ? 18 : preferences.style === "soft" ? 14 : 10 },
    typography: { fontSize: preferences.fontScale === "large" ? 15 : 14 },
    components: {
      MuiCard: { styleOverrides: { root: { borderColor: preferences.style === "glass" ? alpha(accent, .26) : undefined, backgroundColor: preferences.style === "glass" ? alpha(mode === "dark" ? "#1f2937" : "#ffffff", .72) : undefined, backdropFilter: preferences.style === "glass" ? "blur(12px)" : undefined, boxShadow: preferences.style === "soft" ? `0 10px 28px ${alpha(accent, .08)}` : undefined } } },
      MuiButton: { styleOverrides: { root: { borderRadius: preferences.style === "glass" ? 12 : 8 } } },
      MuiCardContent: { styleOverrides: { root: { padding: preferences.density === "compact" ? 14 : preferences.density === "spacious" ? 24 : 16 } } },
    },
  }), [baseTheme, accent, mode, preferences]);
  const rootStyle: React.CSSProperties = {
    display: "flex", minWidth: 0, background: mode === "dark" ? "#191b1f" : alpha(accent, .045),
    ["--student-accent" as string]: accent,
    ["--student-sidebar" as string]: darken(accent, .18),
    ["--student-surface" as string]: preferences.style === "glass" ? alpha(mode === "dark" ? "#222731" : "#ffffff", .84) : mode === "dark" ? "#222731" : "#ffffff",
    ["--student-text" as string]: mode === "dark" ? "#ffffff" : "#23395d",
    ["--student-dashboard-background" as string]: preferences.style === "glass" ? `linear-gradient(135deg, ${alpha(accent, .17)}, transparent 55%)` : mode === "dark" ? "#222731" : alpha(accent, preferences.style === "soft" ? .04 : .015),
  };

  return (
    <MuiThemeProvider theme={studentTheme}><div className="student-dashboard-scope" style={rootStyle}>
      <SideBar />
      <div style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--student-dashboard-background)",
        color: "var(--student-text)",
        transition: "background 0.3s, color 0.3s"
      }}>
        <TopBar />
        <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "1rem" : "2rem" }}>
          <Outlet />
        </main>
        <Footer />
        <JuaCompanion />
      </div>
    </div></MuiThemeProvider>
  );
};

const StudentDashboardLayout: React.FC = () => <StudentDashboardPreferencesProvider><StudentDashboardContent /></StudentDashboardPreferencesProvider>;

export default StudentDashboardLayout;
