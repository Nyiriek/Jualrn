import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import TeacherLogin from './pages/TeacherLogin';
import StudentRegister from './pages/StudentRegister';
import TeacherRegister from './pages/TeacherRegister';
import SubjectContent from './pages/SubjectContent';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';

// Dashboard layouts:
import StudentDashboardLayout from './pages/StudentDashboardLayout';
import TeacherDashboardLayout from './pages/TeacherDashboardLayout';

// Student pages:
import StudentDashboard from './pages/StudentDashboard';
import StudentSubjects from './pages/StudentSubjects';
import StudentAssignments from './pages/StudentAssignments';
import StudentProgress from './pages/StudentProgress';
import StudentForum from './pages/StudentForum';
import StudentFeedback from './pages/StudentFeedback';

// Teacher pages:
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourses from './pages/TeacherCourses';
import TeacherGradebook from './pages/TeacherGradeBook';
import TeacherReports from './pages/TeacherReports';
import TeacherForum from './pages/TeacherForum';
import TeacherFeedback from './pages/TeacherFeedback';

const App = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/login/teacher" element={<TeacherLogin />} />
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/register/teacher" element={<TeacherRegister />} />
        <Route path="/student/subject/:id" element={<SubjectContent />} />
        <Route
          path="/admin"
          element={user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/login" />}
        />

        {/* STUDENT NESTED DASHBOARD */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowed="student">
              <StudentDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="subjects" element={<StudentSubjects />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="progress" element={<StudentProgress />} />
          <Route path="forum" element={<StudentForum />} />
          <Route path="feedback" element={<StudentFeedback />} />
        </Route>

        {/* TEACHER NESTED DASHBOARD */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowed="teacher">
              <TeacherDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="gradebook" element={<TeacherGradebook />} />
          <Route path="reports" element={<TeacherReports />} />
          <Route path="forum" element={<TeacherForum />} />
          <Route path="feedback" element={<TeacherFeedback />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
