import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  UserCheck,
  Calendar,
  Briefcase,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Menu items with role-based access control
const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [], // Available to all authenticated users
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    roles: ["ADMIN", "MANAGER"], // Only admins and managers
  },
  {
    title: "Employees",
    href: "/hr/employees",
    icon: UserCheck,
    roles: ["ADMIN", "HR", "MANAGER"], // HR module access
  },
  {
    title: "Leave Requests",
    href: "/hr/leave-requests",
    icon: Calendar,
    roles: [], // All employees can request leave
  },
  {
    title: "Approvals",
    href: "/hr/approvals",
    icon: Briefcase,
    roles: ["ADMIN", "MANAGER"], // Only managers can approve
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: [], // Available to all for now
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: [], // Available to all for now
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
    roles: [], // Available to all for now
  },
  {
    title: "Finance",
    href: "/finance",
    icon: DollarSign,
    roles: ["ADMIN", "FINANCE", "MANAGER"], // Finance module access
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"], // Reports for management
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCircle,
    roles: [], // Available to all authenticated users
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"], // Only admins can access settings
  },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get user initials for avatar
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    // If no roles specified, show to all users
    if (item.roles.length === 0) return true;
    // Otherwise, check if user has one of the required roles
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 h-screen border-r bg-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo/Brand at the top */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <div className="text-xl font-bold text-slate-900">Corpex ERP</div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn("h-8 w-8", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info and logout at bottom */}
        <Separator />
        <div className="p-3">
          {isCollapsed ? (
            // Collapsed view - just avatar and logout icon
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            // Expanded view - full user info and logout button
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 capitalize truncate">
                    {user?.role.toLowerCase()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
