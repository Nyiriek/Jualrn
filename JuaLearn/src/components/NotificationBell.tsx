import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NotificationsIcon from "@mui/icons-material/Notifications";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useThemeMode } from "../context/ThemeContext";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

interface Notification {
  id: number;
  title: string;
  message?: string;
  url?: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

const NotificationBell: React.FC = () => {
  const { mode } = useThemeMode();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios
        .get("/notifications/")
        .then((res) => setNotifications(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleNotificationClick = async (id: number, url?: string) => {
    try {
      await axios.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setOpen(false);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleViewAllClick = () => {
    setOpen(false);
    if (user?.role === "teacher") {
      navigate("/teacher/notifications");
    } else if (user?.role === "student") {
      navigate("/student/notifications");
    } else {
      navigate("/notifications"); // fallback, e.g. admin
    }
  };

  const iconColor = mode === "dark" ? "#fff" : "#23395d";
  const glow = mode === "dark" ? { filter: "drop-shadow(0 0 6px #fff)" } : {};

  return (
    <>
      <IconButton
        ref={anchorRef}
        onClick={handleToggle}
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ color: iconColor, ...glow }} />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        style={{ zIndex: 1300, minWidth: 300 }}
      >
        <Paper elevation={4} sx={{ maxHeight: 400, overflowY: "auto" }}>
          {loading ? (
            <CircularProgress sx={{ m: 2 }} />
          ) : notifications.length === 0 ? (
            <ListItem>
              <ListItemText primary="No notifications" />
            </ListItem>
          ) : (
              <List dense>
                {notifications.map((n) => (
                  <ListItemButton
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id, n.url)}
                    sx={{
                      bgcolor: n.is_read
                        ? "inherit"
                        : mode === "dark"
                        ? "#333"
                        : "#e3f2fd",
                      fontWeight: !n.is_read ? "bold" : "normal",
                    }}
                  >
                    <ListItemText
                      primary={n.title}
                      secondary={new Date(n.created_at).toLocaleString()}
                      sx={{ whiteSpace: "normal" }}
                    />
                  </ListItemButton>
                ))}
                <ListItemButton
                  onClick={handleViewAllClick}
                  sx={{ justifyContent: "center" }}
                >
                  <Typography variant="body2" color="primary">
                    View All Notifications
                  </Typography>
                </ListItemButton>
              </List>
          )}
        </Paper>
      </Popper>
    </>
  );
};

export default NotificationBell;
