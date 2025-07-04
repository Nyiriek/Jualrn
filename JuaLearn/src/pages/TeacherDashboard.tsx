import React from "react";
import ActionCards from "../components/ActionCards";
import Widgets from "../components/Widgets";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();


  const containerStyle: React.CSSProperties = {
    padding: "2.5rem",
    minHeight: "100vh",
    background: mode === "dark" ? "#191b1f" : "#f8f9fd",
    color: mode === "dark" ? "#fff" : "#23395d",
    transition: "background 0.3s, color 0.3s",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box"
  };

  const headerStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: "1.5rem",
    color: mode === "dark" ? "#fff" : "#23395d",
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: ".5px"
  };

  const responsiveStyles = `
    @media (max-width: 700px) {
      .teacher-dashboard-container {
        padding: 1rem !important;
      }
      .teacher-dashboard-header {
        font-size: 1.25rem !important;
        margin-bottom: 1rem !important;
      }
      .action-cards,
      .widgets {
        flex-direction: column !important;
        gap: 1rem !important;
      }
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="teacher-dashboard-container" style={containerStyle}>
        <h2 className="teacher-dashboard-header" style={headerStyle}>
          Welcome, {user?.firstName || "Teacher"}!
        </h2>
        <div className="action-cards" style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem" }}>
          <ActionCards />
        </div>
        <div className="widgets" style={{ display: "flex", gap: "1.5rem" }}>
          <Widgets />
        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
