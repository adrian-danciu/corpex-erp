import { ReactNode, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Package,
  UserCircle,
  UserCheck,
  Calendar,
  Briefcase,
  Building2,
  Receipt,
  ChevronDown,
  Boxes,
  Car,
  Truck,
  WalletCards,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  children?: MenuItem[];
}

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
    roles: ["ADMIN", "HR", "IT", "MANAGER"],
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
      {
        title: "Adjustments",
        href: "/stock/adjustments",
        icon: AlertTriangle,
        roles: ["ADMIN"],
      },
      {
        title: "Purchase Orders",
        href: "/stock/purchase-orders",
        icon: Truck,
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
    title: "Payroll",
    href: "/payroll",
    icon: WalletCards,
    roles: ["ADMIN", "HR", "FINANCE", "MANAGEMENT"],
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
        title: "Client Invoices",
        href: "/finance/client-invoices",
        icon: Receipt,
        roles: ["ADMIN", "FINANCE", "MANAGER"],
      },
      {
        title: "Supplier Invoices",
        href: "/finance/supplier-invoices",
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
    roles: ["ADMIN", "FLEET", "MANAGEMENT"],
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isVisible = (item: MenuItem) => {
    if (item.roles.length === 0) return true;
    return (
      user &&
      (item.roles.includes(user.role) ||
        (user.department ? item.roles.includes(user.department) : false))
    );
  };

  const visibleMenuItems = menuItems.filter(isVisible);

  const renderMobileMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isActive =
      location.pathname === item.href ||
      (!hasChildren &&
        item.href !== "/dashboard" &&
        location.pathname.startsWith(item.href + "/"));
    const isParentActive =
      hasChildren && location.pathname.startsWith(item.href);
    const isExpanded = expandedMenus[item.href];

    if (hasChildren) {
      const visibleChildren = item.children!.filter(isVisible);
      if (visibleChildren.length === 0) return null;

      return (
        <div key={item.href}>
          <button
            onClick={() => {
              setExpandedMenus((prev) => ({
                ...prev,
                [item.href]: !prev[item.href],
              }));
              navigate(item.href);
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isParentActive
                ? "bg-primary text-primary-foreground"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180",
              )}
            />
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2">
              {visibleChildren.map((child) =>
                renderMobileMenuItem(child, true),
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
          isChild && "text-[13px]",
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isChild && "h-4 w-4")} />
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar - notification bell on desktop, full nav on mobile */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>

      {/* Desktop Sidebar - always visible on desktop */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="flex h-full w-64 flex-col p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>
              <span className="sr-only">Menu</span>
              <img
                src="/corpex_complete_logo.png"
                alt="Corpex ERP"
                className="h-10 w-auto"
              />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {visibleMenuItems.map((item) => renderMobileMenuItem(item))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
