import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { canAccess } from "@/lib/permissions";
import type { ModulePermissions } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredModule?: keyof ModulePermissions;
  requiredAccess?: "read" | "write";
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredModule,
  requiredAccess = "read",
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && requiredRole.length > 0) {
    if (!requiredRole.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requiredModule) {
    if (!canAccess(user, requiredModule, requiredAccess)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
