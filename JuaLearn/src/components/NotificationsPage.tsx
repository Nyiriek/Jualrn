import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "../api/axios";

type Notification = {
  id: number;
  title: string;
  message?: string;
  url?: string;
  is_read: boolean;
  created_at: string;
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/notifications/");
      setNotifications(res.data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && notifications.length === 0 && (
        <Typography>No notifications found.</Typography>
      )}

      <List>
        {notifications.map((n) => (
          <ListItem
            key={n.id}
            sx={{ bgcolor: n.is_read ? "inherit" : "action.selected" }}
            component="div"
            onClick={() => {
              // Mark as read and navigate
              axios.patch(`/notifications/${n.id}/`, { is_read: true });
              if (n.url) window.location.href = n.url;
            }}
          >
            <ListItemText
              primary={n.title}
              secondary={
                <>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(n.created_at).toLocaleString()}
                  </Typography>
                  {n.message && <Typography>{n.message}</Typography>}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default NotificationsPage;
