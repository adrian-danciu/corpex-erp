import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check role if required
  if (requiredRole && requiredRole.length > 0) {
    if (!requiredRole.includes(user.role)) {
      // User doesn't have required role - redirect to login or unauthorized page
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
