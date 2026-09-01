import React, { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

const ProtectedRoute = ({
  children,
  allowed,
}: {
  children: ReactNode;
  allowed: "student" | "teacher" | "admin";
}) => {
  const { user, accessToken, refreshToken, isAuthReady } = useAuth();
  if (!isAuthReady) {
    return <Box minHeight="100vh" display="grid" sx={{ placeItems: "center" }}><CircularProgress aria-label="Restoring your session" /></Box>;
  }
  return user?.role === allowed && accessToken && refreshToken
    ? <>{children}</>
    : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
