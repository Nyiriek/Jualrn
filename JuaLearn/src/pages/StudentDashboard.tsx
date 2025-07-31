import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SubjectCard from '../components/SubjectCard';
import AssignmentList from '../components/AssignmentList';
import PerformanceChart from '../components/PerformanceChart';
import ChatbotEmbed from '../components/ChatBotEmbed';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import axios from '../api/axios';

type Subject = {
  id: number;
  name: string;
  description?: string;
  image?: string;
};

type Enrollment = {
  id: number;
  subject: Subject | null;
  enrolled_at: string;
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const navigate = useNavigate();

  // Responsive breakpoints
  const isSmartphone = useMediaQuery('(max-width:640px)');
  const isTablet = useMediaQuery('(max-width:768px)');
  const isDesktop = useMediaQuery('(max-width:1200px)');
  const isLargeDesktop = useMediaQuery('(max-width:1400px)');
  
  const isMobile = useMediaQuery('(max-width:700px)');
  const topBarHeight = isMobile ? 56 : 72;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [errorEnrollments, setErrorEnrollments] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoadingEnrollments(true);
      try {
        const res = await axios.get('/student/enrollments/');
        setEnrollments(res.data);
        setErrorEnrollments(null);
      } catch (err) {
        setErrorEnrollments('Failed to load enrolled courses.');
      } finally {
        setLoadingEnrollments(false);
      }
    };

    fetchEnrollments();
  }, []);

  // Flexbox style for enrolled courses container
  const courseListStyle: React.CSSProperties = (isSmartphone || isTablet)
    ? { display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }
    : { display: "flex", gap: "1.5rem", marginTop: "1.5rem", flexWrap: "wrap" };

  const courseBoxStyle: React.CSSProperties = {
    background: mode === "dark" ? "#2e313a" : "#f3f6fb",
    color: mode === "dark" ? "#fff" : "#23395d",
    boxShadow: mode === "dark"
      ? "0 0 18px #3895ff55"
      : "0 2px 8px rgba(0,0,0,0.06)",
    borderRadius: "8px",
    padding: (isSmartphone || isTablet) ? "1rem" : "1.5rem",
    flex: isSmartphone || isTablet ? "none" : 2,
    width: isSmartphone ? "100%" : isTablet ? "48%" : "auto",
    margin: isSmartphone || isTablet ? "0 0 1rem 0" : "0 0.75rem",
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
    padding: (isSmartphone || isTablet) ? 10 : 16,
    transition: "background 0.3s"
  };

  return (
    <div
      className="dashboard-container"
      style={{
        padding: isSmartphone ? '0.5rem' : '1rem 2rem',
        paddingTop: topBarHeight + (isMobile ? 8 : 16),
        boxSizing: 'border-box',
        minHeight: '100vh',
      }}
    >
      <Header title={`Welcome, ${user?.firstName || "Student"}`} />
      
      <section style={{ marginBottom: isSmartphone ? "1rem" : "2rem" }}>
        <SubjectCard />
      </section>

      <section>
        <h2>Enrolled Courses</h2>
        <div style={enrolledCoursesContainerStyle}>
          {loadingEnrollments ? (
            <p>Loading courses...</p>
          ) : errorEnrollments ? (
            <p style={{ color: "red" }}>{errorEnrollments}</p>
          ) : enrollments.length === 0 ? (
            <p>You have not enrolled in any courses yet.</p>
          ) : (
            <div style={courseListStyle}>
              {enrollments.map(({ id, subject }) => (
                <div key={id} style={courseBoxStyle}>
                  <h3>{subject?.name ?? "Unnamed Subject"}</h3>
                  <button
                    style={{
                      background: mode === "dark" ? "#3895ff" : "#38598b",
                      color: "#fff",
                      border: "none",
                      padding: "0.4rem 1.2rem",
                      borderRadius: "12px",
                      marginTop: "1rem",
                      cursor: "pointer",
                      transition: "background 0.3s",
                      width: "100%",
                      maxWidth: 180,
                    }}
                    onClick={() => subject?.id && navigate(`/student/subject/${subject.id}`)}
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: isSmartphone ? "1.2rem" : "2.5rem" }}>
        <h2>Progress Tracker</h2>
        <PerformanceChart />
        
        <h2 style={{ marginTop: isSmartphone ? "1rem" : "2rem" }}>Assignments</h2>
        <AssignmentList />
      </section>

      <ChatbotEmbed />
    </div>
  );
};

export default StudentDashboard;
