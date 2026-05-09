import { ApolloProvider } from "@apollo/client/react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { apolloClient } from "./lib/apollo-client";
import LoginPage from "./pages/LoginPage";
import UserCreatePage from "./pages/UserCreatePage";
import UsersAdminPage from "./pages/UsersAdminPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import EmployeesPage from "./pages/hr/EmployeesPage";
import EmployeeCreatePage from "./pages/hr/EmployeeCreatePage";
import EmployeeDetailPage from "./pages/hr/EmployeeDetailPage";
import LeaveRequestsPage from "./pages/hr/LeaveRequestsPage";
import ApprovalsPage from "./pages/hr/ApprovalsPage";
import OrgChartPage from "./pages/hr/OrgChartPage";
import FinanceOverviewPage from "./pages/finance/FinanceOverviewPage";
import PartnersPage from "./pages/finance/PartnersPage";
import PartnerCreatePage from "./pages/finance/PartnerCreatePage";
import PartnerDetailPage from "./pages/finance/PartnerDetailPage";
import InvoicesPage from "./pages/finance/InvoicesPage";
import InvoiceCreatePage from "./pages/finance/InvoiceCreatePage";
import InvoiceDetailPage from "./pages/finance/InvoiceDetailPage";
import StockOverviewPage from "./pages/stock/StockOverviewPage";
import ProductsPage from "./pages/stock/ProductsPage";
import ProductCreatePage from "./pages/stock/ProductCreatePage";
import WarehousesPage from "./pages/stock/WarehousesPage";
import StockMovementsPage from "./pages/stock/StockMovementsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ReportsPage from "./pages/ReportsPage";
import VehiclesPage from "./pages/fleet/VehiclesPage";
import VehicleCreatePage from "./pages/fleet/VehicleCreatePage";
import VehicleDetailPage from "./pages/fleet/VehicleDetailPage";
import SettingsPage from "./pages/SettingsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ProjectCreatePage from "./pages/projects/ProjectCreatePage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout><LoginPage /></Layout>} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout><DashboardPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout><ProfilePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin-only */}
          <Route
            path="/it/user-create"
            element={
              <ProtectedRoute requiredRole={["ADMIN"]}>
                <DashboardLayout><UserCreatePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRole={["ADMIN"]}>
                <DashboardLayout><UsersAdminPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* HR Module */}
          <Route
            path="/hr/employees"
            element={
              <ProtectedRoute requiredModule="hr" requiredAccess="read">
                <DashboardLayout><EmployeesPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees/new"
            element={
              <ProtectedRoute requiredModule="hr" requiredAccess="write">
                <DashboardLayout><EmployeeCreatePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees/:id"
            element={
              <ProtectedRoute requiredModule="hr" requiredAccess="read">
                <DashboardLayout><EmployeeDetailPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/org-chart"
            element={
              <ProtectedRoute>
                <DashboardLayout><OrgChartPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/leave-requests"
            element={
              <ProtectedRoute>
                <DashboardLayout><LeaveRequestsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/approvals"
            element={
              <ProtectedRoute requiredModule="leaveApprovals">
                <DashboardLayout><ApprovalsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Finance Module */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute requiredModule="finance" requiredAccess="read">
                <DashboardLayout><FinanceOverviewPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/partners"
            element={
              <ProtectedRoute requiredModule="finance" requiredAccess="read">
                <DashboardLayout><PartnersPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/partners/new"
            element={
              <ProtectedRoute requiredModule="finance" requiredAccess="write">
                <DashboardLayout><PartnerCreatePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/partners/:id"
            element={
              <ProtectedRoute requiredModule="finance" requiredAccess="read">
                <DashboardLayout><PartnerDetailPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices"
            element={
              <ProtectedRoute requiredModule="finance" requiredAccess="read">
                <DashboardLayout><InvoicesPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices/new"
            element={
              <ProtectedRoute requiredModule="finance" requiredAccess="write">
                <DashboardLayout><InvoiceCreatePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices/:id"
            element={
              <ProtectedRoute requiredModule="finance" requiredAccess="read">
                <DashboardLayout><InvoiceDetailPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Stock Module */}
          <Route
            path="/stock"
            element={
              <ProtectedRoute requiredModule="stock" requiredAccess="read">
                <DashboardLayout><StockOverviewPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/products"
            element={
              <ProtectedRoute requiredModule="stock" requiredAccess="read">
                <DashboardLayout><ProductsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/products/new"
            element={
              <ProtectedRoute requiredModule="stock" requiredAccess="write">
                <DashboardLayout><ProductCreatePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/warehouses"
            element={
              <ProtectedRoute requiredModule="stock" requiredAccess="read">
                <DashboardLayout><WarehousesPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/movements"
            element={
              <ProtectedRoute requiredModule="stock" requiredAccess="read">
                <DashboardLayout><StockMovementsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredModule="reports">
                <DashboardLayout><ReportsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fleet Module */}
          <Route
            path="/fleet"
            element={
              <ProtectedRoute requiredModule="fleet" requiredAccess="read">
                <DashboardLayout><VehiclesPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/create"
            element={
              <ProtectedRoute requiredModule="fleet" requiredAccess="write">
                <DashboardLayout><VehicleCreatePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/:id"
            element={
              <ProtectedRoute requiredModule="fleet" requiredAccess="read">
                <DashboardLayout><VehicleDetailPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Projects Module */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute requiredModule="projects" requiredAccess="read">
                <DashboardLayout><ProjectsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute requiredModule="projects" requiredAccess="write">
                <DashboardLayout><ProjectCreatePage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute requiredModule="projects" requiredAccess="read">
                <DashboardLayout><ProjectDetailPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRole={["ADMIN"]}>
                <DashboardLayout><SettingsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
