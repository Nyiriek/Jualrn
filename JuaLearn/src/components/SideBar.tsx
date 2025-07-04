import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Box, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import BookIcon from '@mui/icons-material/Book';
import ForumIcon from '@mui/icons-material/Forum';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { useThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const menuConfig = {
  student: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { text: 'Subjects', icon: <BookIcon />, path: '/student/subjects' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
    { text: 'Progress', icon: <BarChartIcon />, path: '/student/progress' },
    { text: 'Forum', icon: <ForumIcon />, path: '/student/forum' },
    { text: 'Feedback', icon: <FeedbackIcon />, path: '/student/feedback' },
  ],
  teacher: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/teacher' },
    { text: 'My Courses', icon: <BookIcon />, path: '/teacher/courses' },
    { text: 'Gradebook', icon: <AssignmentIcon />, path: '/teacher/gradebook' },
    { text: 'Reports', icon: <BarChartIcon />, path: '/teacher/reports' },
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

  if (!user) return null;
  const menuItems =
    user.role && (user.role === "student" || user.role === "teacher")
      ? menuConfig[user.role]
      : [];

  // Sidebar background color (dark/light)
  const sideBarBg = mode === "dark" ? "#21243b" : "#23395d";

  // Drawer content (logo removed)
  const drawerContent = (
    <Box sx={{
      background: sideBarBg,
      color: "#fff",
      height: "100%",
      minWidth: collapsed ? 60 : drawerWidth,
      transition: "min-width 0.2s"
    }}>
      <Divider sx={{ bgcolor: "#3c5687" }} />
      <List>
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
      {/* Collapse/Expand Button */}
      <Box sx={{
        display: 'flex',
        justifyContent: collapsed ? "center" : "flex-end",
        mt: 1, mb: 2
      }}>
        <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: "#fff" }}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ bgcolor: "#3c5687" }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => { logout(); navigate('/login'); }}
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
      {/* Hamburger menu only on mobile */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 2000,
            background: sideBarBg,
            color: "#fff"
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Sidebar (permanent on desktop, temporary on mobile) */}
      <Drawer
        className="sideBar-drawer"
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: collapsed ? 60 : drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: collapsed ? 60 : drawerWidth,
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
