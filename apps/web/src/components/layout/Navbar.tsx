import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "../ui/button";
import { LogOut, Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <nav className="sticky top-0 z-20 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side: hamburger + brand (mobile only — desktop has them in the sidebar) */}
        <div className="flex items-center gap-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-xl font-bold text-slate-900">Corpex ERP</div>
        </div>

        {/* Spacer pushes the right-side group to the end on desktop */}
        <div className="hidden md:block" />

        {/* Right side: bell (always) + user info & logout (mobile only) */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="flex items-center gap-3 md:hidden">
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
      </div>
    </nav>
  );
}
