import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Box, useMediaQuery, Avatar, Typography
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import BookIcon from '@mui/icons-material/Book';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import ForumIcon from '@mui/icons-material/Forum';
import FeedbackIcon from '@mui/icons-material/Feedback';
import QuizIcon from '@mui/icons-material/Quiz';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { profileInitials, profilePictureUrl } from '../utils/profilePicture';

const drawerWidth = 240;

const menuConfig = {
  student: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { text: 'Subjects', icon: <BookIcon />, path: '/student/subjects' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
    { text: 'Progress', icon: <BarChartIcon />, path: '/student/progress' },
    { text: 'Forum', icon: <ForumIcon />, path: '/student/forum' },
    { text: 'Quizzes', icon: <AssignmentIcon />, path: '/student/quizzes' },
    { text: 'Grades', icon: <BarChartIcon />, path: '/student/grades' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/student/feedback' },
  ],
  teacher: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/teacher' },
    { text: 'Courses', icon: <BookIcon />, path: '/teacher/courses' },
    { text: 'Resources', icon: <LibraryBooksOutlinedIcon />, path: '/teacher/resources' },
    { text: 'Submissions', icon: <AssignmentIcon />, path: '/teacher/submissions' },
    { text: 'Gradebook', icon: <AssignmentIcon />, path: '/teacher/gradebook' },
    { text: 'Reports', icon: <BarChartIcon />, path: '/teacher/reports' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/teacher/assignments' },
    { text: 'Quizzes', icon: <QuizIcon />, path: '/teacher/quizzes' },
    { text: 'Teacher Training', icon: <WorkspacePremiumIcon />, path: '/teacher/training' },
    { text: 'Forum', icon: <ForumIcon />, path: '/teacher/forum' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/teacher/feedback' },
  ]
};

const SideBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode } = useThemeMode();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const openNavigation = () => setMobileOpen(true);
    const closeNavigation = () => setMobileOpen(false);
    window.addEventListener('jualearn:open-navigation', openNavigation);
    window.addEventListener('jualearn:close-navigation', closeNavigation);
    return () => {
      window.removeEventListener('jualearn:open-navigation', openNavigation);
      window.removeEventListener('jualearn:close-navigation', closeNavigation);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('jualearn:navigation-state', { detail: mobileOpen }));
  }, [mobileOpen]);

  if (!user) return null;
  const menuItems =
    user.role && (user.role === "student" || user.role === "teacher")
      ? menuConfig[user.role]
      : [];

  // Sidebar background color (dark/light)
  const sideBarBg = user.role === "student" ? "var(--student-sidebar, #23395d)" : user.role === "teacher" ? "var(--teacher-sidebar, #23395d)" : mode === "dark" ? "#21243b" : "#23395d";
  const notificationPath = user.role === 'teacher' ? '/teacher/notifications' : '/student/notifications';

  // Drawer content (logo removed)
  const drawerContent = (
    <Box sx={{
      background: sideBarBg,
      color: "#fff",
      height: "100%",
      minWidth: collapsed ? 60 : drawerWidth,
      transition: "min-width 0.2s"
    }}>
      <Box sx={{ px: collapsed ? 1 : 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar
          src={profilePictureUrl(user.profilePicture)}
          alt={user.username}
          sx={{ width: 38, height: 38, bgcolor: '#fff', color: sideBarBg, fontWeight: 700 }}
        >
          {profileInitials(user.firstName, user.lastName, user.username)}
        </Avatar>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap fontWeight={700} fontSize="0.9rem">{user.firstName || user.username}</Typography>
            <Typography noWrap variant="caption" sx={{ opacity: 0.78 }}>{user.role}</Typography>
          </Box>
        )}
      </Box>
      <Divider sx={{ bgcolor: "#3c5687" }} />
      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => {
              window.dispatchEvent(new Event('jualearn:open-profile'));
              setMobileOpen(false);
            }}
            sx={{ color: '#fff', m: '4px 8px', borderRadius: '8px', px: collapsed ? 2 : 3, justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <ListItemIcon sx={{ color: '#fff', minWidth: collapsed ? 0 : 40 }}><PersonOutlineIcon /></ListItemIcon>
            {!collapsed && <ListItemText primary="My profile" />}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => { navigate(notificationPath); setMobileOpen(false); }}
            sx={{ color: '#fff', m: '4px 8px', borderRadius: '8px', px: collapsed ? 2 : 3, justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <ListItemIcon sx={{ color: '#fff', minWidth: collapsed ? 0 : 40 }}><NotificationsNoneIcon /></ListItemIcon>
            {!collapsed && <ListItemText primary="Notifications" />}
          </ListItemButton>
        </ListItem>
        <ListItem sx={{ color: '#fff', m: '4px 8px', px: collapsed ? 0 : 2, justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && <ListItemText primary="Appearance" />}
          <ThemeToggle color="#fff" />
        </ListItem>
        <Divider sx={{ bgcolor: "#3c5687", my: 1 }} />
        {menuItems.map(({ text, icon, path }) => (
          <ListItem key={text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => {
                navigate(path);
                setMobileOpen(false);
              }}
              sx={{
                color: location.pathname === path ? '#1976d2' : '#fff',
                background: location.pathname === path ? "#e3f2fd" : "transparent",
                borderRadius: "8px",
                m: "4px 8px",
                px: collapsed ? 2 : 3,
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === path ? '#1976d2' : '#fff', minWidth: collapsed ? 0 : 40 }}>
                {icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {/* Collapse/Expand Button (desktop only) */}
      {!isMobile && (
        <Box sx={{
          display: 'flex',
          justifyContent: collapsed ? "center" : "flex-end",
          mt: 1, mb: 2
        }}>
          <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: "#fff" }}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}
      <Divider sx={{ bgcolor: "#3c5687" }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={logout}
            sx={{ color: "#f45d48", mt: 2, justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <ListItemIcon sx={{ color: "#f45d48", minWidth: collapsed ? 0 : 40 }}>
              <ExitToAppIcon />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Logout" />}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Mobile drawer closes over content
  return (
    <>
      {/* Sidebar (permanent on desktop, temporary on mobile) */}
      <Drawer
        className="sideBar-drawer"
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? drawerWidth : (collapsed ? 60 : drawerWidth),
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: isMobile ? "min(82vw, 300px)" : (collapsed ? 60 : drawerWidth),
            background: sideBarBg,
            color: "#fff",
            boxSizing: "border-box",
            borderRight: "none",
            transition: "width 0.2s"
          },
        }}
        PaperProps={{
          elevation: 2,
          style: {
            background: sideBarBg,
            overflowX: "hidden"
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default SideBar;
