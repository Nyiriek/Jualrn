import React from 'react';
import Header from '../components/Header';
import SubjectCard from '../components/SubjectCard';
import AssignmentList from '../components/AssignmentList';
import PerformanceChart from '../components/PerformanceChart';
import ChatbotEmbed from '../components/ChatBotEmbed';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import useMediaQuery from '@mui/material/useMediaQuery';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:700px)');

  // Responsive flex direction and gaps
  const courseListStyle: React.CSSProperties = isMobile
    ? { display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }
    : { display: "flex", gap: "1.5rem", marginTop: "1.5rem" };

  const courseBoxStyle: React.CSSProperties = {
    background: mode === "dark" ? "#2e313a" : "#f3f6fb",
    color: mode === "dark" ? "#fff" : "#23395d",
    boxShadow: mode === "dark"
      ? "0 0 18px #3895ff55"
      : "0 2px 8px rgba(0,0,0,0.06)",
    borderRadius: "8px",
    padding: isMobile ? "1rem" : "1.5rem",
    flex: 1,
    margin: isMobile ? "0" : "0 0.75rem",
    textAlign: "center" as const,
    minWidth: 0,
    transition: "background 0.3s, color 0.3s",
  };

  const enrolledCoursesContainerStyle: React.CSSProperties = {
    background: mode === "dark" ? "#21243b" : "#fff",
    borderRadius: 8,
    boxShadow: mode === "dark"
      ? "0 2px 14px 0 #132c4f44"
      : "0 1px 6px rgba(30,55,90,0.05)",
    padding: isMobile ? 10 : 16,
    transition: "background 0.3s"
  };

  return (
    <div className="dashboard-container">
      <Header title={`Welcome, ${user?.firstName || "Student"}`} />
      <section style={{ marginBottom: isMobile ? "1rem" : "2rem" }}>
        <SubjectCard />
      </section>
      <section>
        <h2>Enrolled Courses</h2>
        <div style={enrolledCoursesContainerStyle}>
          <ul style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            listStyle: "none",
            padding: 0,
            margin: 0,
            color: mode === "dark" ? "#fff" : "#38598b"
          }}>
            <li style={{ marginRight: isMobile ? 0 : 16, marginBottom: isMobile ? 6 : 0, fontWeight: 600 }}>In progress</li>
            <li style={{ marginRight: isMobile ? 0 : 16, marginBottom: isMobile ? 6 : 0 }}>Explore</li>
            <li>Finished</li>
          </ul>
          <div style={courseListStyle}>
            <div style={courseBoxStyle}>
              <h3>Mathematics</h3>
              <p>80% - progress</p>
              <button style={{
                background: mode === "dark" ? "#3895ff" : "#38598b",
                color: "#fff",
                border: "none",
                padding: "0.4rem 1.2rem",
                borderRadius: "12px",
                marginTop: "1rem",
                cursor: "pointer",
                transition: "background 0.3s"
              }}>Continue</button>
            </div>
            <div style={courseBoxStyle}>
              <h3>Economics</h3>
              <p>50% - progress</p>
              <button style={{
                background: mode === "dark" ? "#3895ff" : "#38598b",
                color: "#fff",
                border: "none",
                padding: "0.4rem 1.2rem",
                borderRadius: "12px",
                marginTop: "1rem",
                cursor: "pointer",
                transition: "background 0.3s"
              }}>Continue</button>
            </div>
            <div style={courseBoxStyle}>
              <h3>Citizenship</h3>
              <p>30% - progress</p>
              <button style={{
                background: mode === "dark" ? "#3895ff" : "#38598b",
                color: "#fff",
                border: "none",
                padding: "0.4rem 1.2rem",
                borderRadius: "12px",
                marginTop: "1rem",
                cursor: "pointer",
                transition: "background 0.3s"
              }}>Continue</button>
            </div>
          </div>
        </div>
      </section>
      <section style={{ marginTop: isMobile ? "1.2rem" : "2.5rem" }}>
        <h2>Progress Tracker</h2>
        <PerformanceChart />
        <h2 style={{ marginTop: isMobile ? "1rem" : "2rem" }}>Assignments</h2>
        <AssignmentList />
      </section>
      <ChatbotEmbed />
    </div>
  );
};

export default StudentDashboard;
