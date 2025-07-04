import React from "react";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { useThemeMode } from "../context/ThemeContext";

const TeacherDashboardLayout: React.FC = () => {
  const { mode } = useThemeMode();

  return (
    <div style={{ display: "flex", background: mode === "dark" ? "#191b1f" : "#f8f9fd" }}>
      <SideBar />
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: mode === "dark" ? "#23262d" : "#fff",
        color: mode === "dark" ? "#fff" : "#23395d",
        transition: "background 0.3s, color 0.3s"
      }}>
        <TopBar />
        <main style={{ flex: 1, padding: "2rem" }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default TeacherDashboardLayout;
