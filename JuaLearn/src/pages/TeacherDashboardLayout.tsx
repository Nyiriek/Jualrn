import React, { useMemo } from "react";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { useThemeMode } from "../context/ThemeContext";
import { ThemeProvider as MuiThemeProvider, createTheme, useMediaQuery, useTheme } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";
import JuaCompanion from "../components/JuaCompanion";
import { TeacherDashboardPreferencesProvider, useTeacherDashboardPreferences } from "../context/TeacherDashboardPreferences";

const TeacherDashboardContent: React.FC = () => {
  const { mode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:900px)");
  const baseTheme = useTheme();
  const { accent, preferences } = useTeacherDashboardPreferences();
  const teacherTheme = useMemo(() => createTheme(baseTheme, {
    palette: { primary: { main: accent, dark: darken(accent, .16) }, secondary: { main: darken(accent, .22) }, background: mode === "dark" ? { default: "#191b1f", paper: "#23262d" } : { default: alpha(accent, .045), paper: "#fff" } },
    typography: { fontSize: preferences.fontScale === "large" ? 15 : 14 },
    // Do not override `spacing` here: when extending an existing MUI theme it
    // can replace MUI's spacing function and break components such as Divider.
  }), [accent, baseTheme, mode, preferences.fontScale]);
  const rootStyle: React.CSSProperties = {
    display: "flex", minWidth: 0, background: mode === "dark" ? "#191b1f" : alpha(accent, .045),
    ["--teacher-sidebar" as string]: darken(accent, .22), ["--teacher-surface" as string]: mode === "dark" ? "#23262d" : "#fff", ["--teacher-text" as string]: mode === "dark" ? "#fff" : "#23395d",
  };

  return (
    <MuiThemeProvider theme={teacherTheme}><div className="teacher-dashboard-scope" style={rootStyle}>
      <SideBar />
      <div style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--teacher-surface)",
        color: "var(--teacher-text)",
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

const TeacherDashboardLayout: React.FC = () => <TeacherDashboardPreferencesProvider><TeacherDashboardContent /></TeacherDashboardPreferencesProvider>;

export default TeacherDashboardLayout;
