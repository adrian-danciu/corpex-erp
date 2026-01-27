import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // If no user is logged in, don't show navbar
  if (!user) {
    return null;
  }

  // Get user initials for avatar
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <nav className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold text-slate-900">
            Corpex ERP
          </div>
        </div>

        {/* Right side - User info and logout */}
        <div className="flex items-center gap-4">
          {/* User Avatar and Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                Hey, {user.firstName}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user.role.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
