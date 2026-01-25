import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UserCreatePage from "./pages/UserCreatePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/it/user-create" element={<UserCreatePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
