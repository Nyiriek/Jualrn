import React, { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({
  children,
  allowed,
}: {
  children: ReactNode;
  allowed: "student" | "teacher" | "admin";
}) => {
  const { user } = useAuth();
  return user?.role === allowed ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
