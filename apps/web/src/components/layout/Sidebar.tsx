import { useState } from "react";
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
  ChevronDown,
  UserCircle,
  UserCheck,
  Calendar,
  Briefcase,
  Building2,
  Receipt,
  Boxes,
  Car,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  children?: MenuItem[];
}

// Menu items with role-based access control
const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [],
  },
  {
    title: "IT / Users",
    href: "/users",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "Employees",
    href: "/hr/employees",
    icon: UserCheck,
    roles: ["ADMIN", "HR", "MANAGER"],
  },
  {
    title: "Leave Requests",
    href: "/hr/leave-requests",
    icon: Calendar,
    roles: [],
  },
  {
    title: "Approvals",
    href: "/hr/approvals",
    icon: Briefcase,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: [],
  },
  {
    title: "Stock & Warehouse",
    href: "/stock",
    icon: Package,
    roles: ["ADMIN", "MANAGER"],
    children: [
      {
        title: "Overview",
        href: "/stock",
        icon: Boxes,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Products",
        href: "/stock/products",
        icon: Package,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Warehouses",
        href: "/stock/warehouses",
        icon: Building2,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Movements",
        href: "/stock/movements",
        icon: Briefcase,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
    roles: [],
  },
  {
    title: "Finance",
    href: "/finance",
    icon: DollarSign,
    roles: ["ADMIN", "FINANCE", "MANAGER"],
    children: [
      {
        title: "Partners",
        href: "/finance/partners",
        icon: Building2,
        roles: ["ADMIN", "FINANCE", "MANAGER"],
      },
      {
        title: "Invoices",
        href: "/finance/invoices",
        icon: Receipt,
        roles: ["ADMIN", "FINANCE", "MANAGER"],
      },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    title: "Fleet",
    href: "/fleet",
    icon: Car,
    roles: [],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCircle,
    roles: [],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Track which parent menus are expanded
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    // Auto-expand parent if we're on a child route
    const initial: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.children && location.pathname.startsWith(item.href)) {
        initial[item.href] = true;
      }
    });
    return initial;
  });

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Get user initials for avatar
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  // Filter menu items based on user role
  const isVisible = (item: MenuItem) => {
    if (item.roles.length === 0) return true;
    return user && item.roles.includes(user.role);
  };

  const visibleMenuItems = menuItems.filter(isVisible);

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.href];
    const isActive =
      location.pathname === item.href ||
      (!hasChildren && item.href !== "/dashboard" && location.pathname.startsWith(item.href + "/"));
    const isParentActive = hasChildren && location.pathname.startsWith(item.href);

    if (hasChildren) {
      const visibleChildren = item.children!.filter(isVisible);
      if (visibleChildren.length === 0) return null;

      return (
        <div key={item.href}>
          <button
            onClick={() => {
              toggleMenu(item.href);
              navigate(item.href);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isParentActive
                ? "bg-primary text-primary-foreground"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? item.title : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2">
              {visibleChildren.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
          isCollapsed && "justify-center",
          isChild && "text-[13px]"
        )}
        title={isCollapsed ? item.title : undefined}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", isChild && "h-4 w-4")} />
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    );
  };

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
          {visibleMenuItems.map((item) => renderMenuItem(item))}
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
