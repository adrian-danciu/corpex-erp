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
import LeaveRequestsPage from "./pages/hr/LeaveRequestsPage";
import ApprovalsPage from "./pages/hr/ApprovalsPage";
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

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes with basic layout */}
          <Route path="/" element={<Layout><LoginPage /></Layout>} />

          {/* Protected routes with dashboard layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/it/user-create"
            element={
              <ProtectedRoute requiredRole={["ADMIN"]}>
                <DashboardLayout>
                  <UserCreatePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* HR Module Routes */}
          <Route
            path="/hr/employees"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "HR", "MANAGER"]}>
                <DashboardLayout>
                  <EmployeesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees/new"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "HR", "MANAGER"]}>
                <DashboardLayout>
                  <EmployeeCreatePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/leave-requests"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeaveRequestsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/approvals"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <ApprovalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Finance Module Routes */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "FINANCE", "MANAGER"]}>
                <DashboardLayout>
                  <FinanceOverviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/partners"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "FINANCE", "MANAGER"]}>
                <DashboardLayout>
                  <PartnersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/partners/new"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "FINANCE", "MANAGER"]}>
                <DashboardLayout>
                  <PartnerCreatePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/partners/:id"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "FINANCE", "MANAGER"]}>
                <DashboardLayout>
                  <PartnerDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "FINANCE", "MANAGER"]}>
                <DashboardLayout>
                  <InvoicesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices/new"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "FINANCE", "MANAGER"]}>
                <DashboardLayout>
                  <InvoiceCreatePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/invoices/:id"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "FINANCE", "MANAGER"]}>
                <DashboardLayout>
                  <InvoiceDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <UsersAdminPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <StockOverviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/products"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <ProductsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/products/new"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <ProductCreatePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/warehouses"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <WarehousesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/movements"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <StockMovementsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
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
