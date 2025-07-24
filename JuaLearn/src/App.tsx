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
import AdminLogin from './pages/AdminLogin';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';
import DashboardHome from './pages/DashboardHome';
import AdminUsers from './pages/AdminUsers';
import AdminSubjects from './components/AdminSubjects';
import NotificationsPage from "./components/NotificationsPage";
import QuizDetail from './pages/QuizDetail';
import StudentTakeQuiz from './pages/StudentTakeQuiz';

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
import StudentQuizzes from './pages/StudentQuizzes';
import StudentGrades from './components/StudentGrades';
import StudentQuizInteractive from './pages/StudentQuizInteractive';

// Teacher pages:
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourses from './pages/TeacherCourses';
import TeacherAssignments from './pages/TeacherAssignment';
import TeacherQuizzes from './pages/TeacherQuizes';
import TeacherGradebook from './pages/TeacherGradeBook';
import TeacherReports from './pages/TeacherReports';
import TeacherForum from './pages/TeacherForum';
import TeacherFeedback from './pages/TeacherFeedback';
import TeacherStudentsTab from './components/TeacherStudentsTab';

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
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/student/quizzes/:id/interactive" element={<StudentQuizInteractive />} />
        <Route path="/student/quizzes/:quizId/take" element={<StudentTakeQuiz />} />
        <Route path="/teacher/quizzes/:quizId/*" element={<QuizDetail />} />
      

        {/* Admin login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin nested dashboard with role protection */}
        <Route
          path="/admin/*"
          element={
            user?.role === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="subjects" element={<AdminSubjects />} />
        </Route>

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
          <Route path="quizzes" element={<StudentQuizzes />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="forum" element={<StudentForum />} />
          <Route path="feedback" element={<StudentFeedback />} />
          <Route path="notifications" element={<NotificationsPage/>} />

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
          <Route path="assignments" element={<TeacherAssignments />} /> 
          <Route path="quizzes" element={<TeacherQuizzes />} />       
          <Route path="gradebook" element={<TeacherGradebook />} />
          <Route path="reports" element={<TeacherReports />} />
          <Route path="forum" element={<TeacherForum />} />
          <Route path="feedback" element={<TeacherFeedback />} />
          <Route path="students" element={<TeacherStudentsTab />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
