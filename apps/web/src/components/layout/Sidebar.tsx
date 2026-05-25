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
  Truck,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { canAccess, getPermissions } from "@/lib/permissions";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "IT / Users", href: "/users", icon: Users },
  { title: "Employees", href: "/hr/employees", icon: UserCheck },
  { title: "Leave Requests", href: "/hr/leave-requests", icon: Calendar },
  { title: "Approvals", href: "/hr/approvals", icon: Briefcase },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  {
    title: "Stock & Warehouse",
    href: "/stock",
    icon: Package,
    children: [
      { title: "Overview", href: "/stock", icon: Boxes },
      { title: "Products", href: "/stock/products", icon: Package },
      { title: "Warehouses", href: "/stock/warehouses", icon: Building2 },
      { title: "Movements", href: "/stock/movements", icon: Briefcase },
      { title: "Purchase Orders", href: "/stock/purchase-orders", icon: Truck },
    ],
  },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Payroll", href: "/payroll", icon: WalletCards },
  {
    title: "Finance",
    href: "/finance",
    icon: DollarSign,
    children: [
      { title: "Partners", href: "/finance/partners", icon: Building2 },
      { title: "Invoices", href: "/finance/invoices", icon: Receipt },
    ],
  },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Fleet", href: "/fleet", icon: Car },
  { title: "Profile", href: "/profile", icon: UserCircle },
  { title: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      menuItems.forEach((item) => {
        if (item.children && location.pathname.startsWith(item.href)) {
          initial[item.href] = true;
        }
      });
      return initial;
    },
  );

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  const isVisible = (item: MenuItem): boolean => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;

    switch (item.href) {
      case "/dashboard":
      case "/profile":
      case "/hr/leave-requests":
        return true;
      case "/hr/employees":
      case "/hr/employees/new":
        return canAccess(user, "hr");
      case "/hr/approvals":
        return canAccess(user, "leaveApprovals", true);
      case "/documents":
        return canAccess(user, "hr");
      case "/payroll":
        return canAccess(user, "payroll");
      case "/finance":
      case "/finance/partners":
      case "/finance/invoices":
        return canAccess(user, "finance");
      case "/stock":
      case "/stock/products":
      case "/stock/warehouses":
      case "/stock/movements":
      case "/stock/purchase-orders":
        return canAccess(user, "stock");
      case "/fleet":
        return canAccess(user, "fleet");
      case "/projects":
        return canAccess(user, "projects");
      case "/reports": {
        const perms = getPermissions(user);
        return perms ? perms.reports !== "none" : false;
      }
      case "/users":
      case "/it/user-create":
      case "/settings":
        return false;
      default:
        return false;
    }
  };

  const visibleMenuItems = menuItems.filter(isVisible);

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.href];
    // Only the leaf route the user is currently on gets highlighted.
    // - Parents (with children) never highlight themselves; their chevron and expansion convey state.
    // - Child items use exact-match so "/stock" (Overview) doesn't stay lit while on "/stock/warehouses".
    // - Other leaf top-level items still match nested URLs (e.g. /projects/abc → Projects).
    const isActive = isChild
      ? location.pathname === item.href
      : !hasChildren &&
        (location.pathname === item.href ||
          (item.href !== "/dashboard" &&
            location.pathname.startsWith(item.href + "/")));

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
              "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
              isCollapsed && "justify-center",
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
                    isExpanded && "rotate-180",
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
          isChild && "text-[13px]",
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
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <img
              src="/corpex_complete_logo.png"
              alt="Corpex ERP"
              className="h-12 w-auto"
            />
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

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {visibleMenuItems.map((item) => renderMenuItem(item))}
        </nav>

        <Separator />
        <div className="p-3">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-10 w-10 rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
              )}
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
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-10 w-10 flex-shrink-0 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 capitalize truncate">
                    {user?.department ?? user?.role.toLowerCase()}
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
