import { ApolloProvider } from "@apollo/client/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { apolloClient } from "./lib/apollo-client";
import LoginPage from "./pages/LoginPage";
import UserCreatePage from "./pages/UserCreatePage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import EmployeesPage from "./pages/hr/EmployeesPage";
import LeaveRequestsPage from "./pages/hr/LeaveRequestsPage";
import ApprovalsPage from "./pages/hr/ApprovalsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import DashboardLayout from "./components/layout/DashboardLayout";

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
              <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
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
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
