import { ApolloProvider } from "@apollo/client/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { apolloClient } from "./lib/apollo-client";
import LoginPage from "./pages/LoginPage";
import UserCreatePage from "./pages/UserCreatePage";

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/it/user-create" element={<UserCreatePage />} />
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
