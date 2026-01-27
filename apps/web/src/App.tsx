import { ApolloProvider } from "@apollo/client/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { apolloClient } from "./lib/apollo-client";
import LoginPage from "./pages/LoginPage";
import UserCreatePage from "./pages/UserCreatePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/it/user-create"
              element={
                <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
                  <UserCreatePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
