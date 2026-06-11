import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../types/index.js";
import { useAuth } from "../context/AuthContext.js";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
