import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { apolloClient } from "./lib/apollo-client";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import DashboardLayout from "./components/layout/DashboardLayout";
import { PageLoading } from "@/components/ui/page-loading";
import { Toaster } from "@/components/ui/sonner";
import type { ModulePermissions } from "@/lib/permissions";

const UserCreatePage = lazy(() => import("./pages/UserCreatePage"));
const UsersAdminPage = lazy(() => import("./pages/UsersAdminPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EmployeesPage = lazy(() => import("./pages/hr/EmployeesPage"));
const EmployeeCreatePage = lazy(() => import("./pages/hr/EmployeeCreatePage"));
const EmployeeDetailPage = lazy(() => import("./pages/hr/EmployeeDetailPage"));
const LeaveRequestsPage = lazy(() => import("./pages/hr/LeaveRequestsPage"));
const ApprovalsPage = lazy(() => import("./pages/hr/ApprovalsPage"));
const OrgChartPage = lazy(() => import("./pages/hr/OrgChartPage"));
const FinanceOverviewPage = lazy(
  () => import("./pages/finance/FinanceOverviewPage"),
);
const PartnersPage = lazy(() => import("./pages/finance/PartnersPage"));
const PartnerCreatePage = lazy(
  () => import("./pages/finance/PartnerCreatePage"),
);
const PartnerDetailPage = lazy(
  () => import("./pages/finance/PartnerDetailPage"),
);
const InvoicesPage = lazy(() => import("./pages/finance/InvoicesPage"));
const InvoiceCreatePage = lazy(
  () => import("./pages/finance/InvoiceCreatePage"),
);
const InvoiceDetailPage = lazy(
  () => import("./pages/finance/InvoiceDetailPage"),
);
const StockOverviewPage = lazy(
  () => import("./pages/stock/StockOverviewPage"),
);
const ProductsPage = lazy(() => import("./pages/stock/ProductsPage"));
const ProductCreatePage = lazy(
  () => import("./pages/stock/ProductCreatePage"),
);
const WarehousesPage = lazy(() => import("./pages/stock/WarehousesPage"));
const StockMovementsPage = lazy(
  () => import("./pages/stock/StockMovementsPage"),
);
const PurchaseOrdersPage = lazy(
  () => import("./pages/stock/PurchaseOrdersPage"),
);
const PurchaseOrderCreatePage = lazy(
  () => import("./pages/stock/PurchaseOrderCreatePage"),
);
const PurchaseOrderDetailPage = lazy(
  () => import("./pages/stock/PurchaseOrderDetailPage"),
);
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const PayrollPage = lazy(() => import("./pages/payroll/PayrollPage"));
const VehiclesPage = lazy(() => import("./pages/fleet/VehiclesPage"));
const VehicleCreatePage = lazy(
  () => import("./pages/fleet/VehicleCreatePage"),
);
const VehicleDetailPage = lazy(
  () => import("./pages/fleet/VehicleDetailPage"),
);
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProjectsPage = lazy(() => import("./pages/projects/ProjectsPage"));
const ProjectCreatePage = lazy(
  () => import("./pages/projects/ProjectCreatePage"),
);
const ProjectDetailPage = lazy(
  () => import("./pages/projects/ProjectDetailPage"),
);
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

type ProtectedPageProps = {
  component: ComponentType;
  requiredRole?: string[];
  requiredModule?: keyof ModulePermissions;
  requiredAccess?: "read" | "write";
};

function LazyDashboard({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoading message="Loading page..." />}>
        {children}
      </Suspense>
    </DashboardLayout>
  );
}

function ProtectedPage({
  component: Page,
  requiredRole,
  requiredModule,
  requiredAccess,
}: ProtectedPageProps) {
  return (
    <ProtectedRoute
      requiredRole={requiredRole}
      requiredModule={requiredModule}
      requiredAccess={requiredAccess}
    >
      <LazyDashboard>
        <Page />
      </LazyDashboard>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Toaster richColors closeButton position="bottom-right" />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <LoginPage />
              </Layout>
            }
          />

          <Route path="/dashboard" element={<ProtectedPage component={DashboardPage} />} />
          <Route path="/profile" element={<ProtectedPage component={ProfilePage} />} />

          <Route
            path="/it/user-create"
            element={
              <ProtectedPage component={UserCreatePage} requiredRole={["ADMIN"]} />
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedPage component={UsersAdminPage} requiredRole={["ADMIN"]} />
            }
          />

          <Route
            path="/hr/employees"
            element={
              <ProtectedPage
                component={EmployeesPage}
                requiredModule="hr"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/hr/employees/new"
            element={
              <ProtectedPage
                component={EmployeeCreatePage}
                requiredModule="hr"
                requiredAccess="write"
              />
            }
          />
          <Route
            path="/hr/employees/:id"
            element={
              <ProtectedPage
                component={EmployeeDetailPage}
                requiredModule="hr"
                requiredAccess="read"
              />
            }
          />
          <Route path="/hr/org-chart" element={<ProtectedPage component={OrgChartPage} />} />
          <Route
            path="/hr/leave-requests"
            element={<ProtectedPage component={LeaveRequestsPage} />}
          />
          <Route
            path="/hr/approvals"
            element={
              <ProtectedPage
                component={ApprovalsPage}
                requiredModule="leaveApprovals"
              />
            }
          />

          <Route
            path="/finance"
            element={
              <ProtectedPage
                component={FinanceOverviewPage}
                requiredModule="finance"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/finance/partners"
            element={
              <ProtectedPage
                component={PartnersPage}
                requiredModule="finance"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/finance/partners/new"
            element={
              <ProtectedPage
                component={PartnerCreatePage}
                requiredModule="finance"
                requiredAccess="write"
              />
            }
          />
          <Route
            path="/finance/partners/:id"
            element={
              <ProtectedPage
                component={PartnerDetailPage}
                requiredModule="finance"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/finance/invoices"
            element={
              <ProtectedPage
                component={InvoicesPage}
                requiredModule="finance"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/finance/invoices/new"
            element={
              <ProtectedPage
                component={InvoiceCreatePage}
                requiredModule="finance"
                requiredAccess="write"
              />
            }
          />
          <Route
            path="/finance/invoices/:id"
            element={
              <ProtectedPage
                component={InvoiceDetailPage}
                requiredModule="finance"
                requiredAccess="read"
              />
            }
          />

          <Route
            path="/stock"
            element={
              <ProtectedPage
                component={StockOverviewPage}
                requiredModule="stock"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/stock/products"
            element={
              <ProtectedPage
                component={ProductsPage}
                requiredModule="stock"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/stock/products/new"
            element={
              <ProtectedPage
                component={ProductCreatePage}
                requiredModule="stock"
                requiredAccess="write"
              />
            }
          />
          <Route
            path="/stock/warehouses"
            element={
              <ProtectedPage
                component={WarehousesPage}
                requiredModule="stock"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/stock/movements"
            element={
              <ProtectedPage
                component={StockMovementsPage}
                requiredModule="stock"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/stock/purchase-orders"
            element={
              <ProtectedPage
                component={PurchaseOrdersPage}
                requiredModule="stock"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/stock/purchase-orders/new"
            element={
              <ProtectedPage
                component={PurchaseOrderCreatePage}
                requiredModule="stock"
                requiredAccess="write"
              />
            }
          />
          <Route
            path="/stock/purchase-orders/:id"
            element={
              <ProtectedPage
                component={PurchaseOrderDetailPage}
                requiredModule="stock"
                requiredAccess="read"
              />
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedPage
                component={DocumentsPage}
                requiredModule="hr"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedPage
                component={PayrollPage}
                requiredModule="payroll"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/reports"
            element={<ProtectedPage component={ReportsPage} requiredModule="reports" />}
          />

          <Route
            path="/fleet"
            element={
              <ProtectedPage
                component={VehiclesPage}
                requiredModule="fleet"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/fleet/create"
            element={
              <ProtectedPage
                component={VehicleCreatePage}
                requiredModule="fleet"
                requiredAccess="write"
              />
            }
          />
          <Route
            path="/fleet/:id"
            element={
              <ProtectedPage
                component={VehicleDetailPage}
                requiredModule="fleet"
                requiredAccess="read"
              />
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedPage
                component={ProjectsPage}
                requiredModule="projects"
                requiredAccess="read"
              />
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedPage
                component={ProjectCreatePage}
                requiredModule="projects"
                requiredAccess="write"
              />
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedPage
                component={ProjectDetailPage}
                requiredModule="projects"
                requiredAccess="read"
              />
            }
          />

          <Route
            path="/notifications"
            element={<ProtectedPage component={NotificationsPage} />}
          />
          <Route
            path="/settings"
            element={
              <ProtectedPage component={SettingsPage} requiredRole={["ADMIN"]} />
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
