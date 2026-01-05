import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Preferences from "./pages/Preferences";
import Newsletters from "./pages/Newsletters";
import OnboardingWizard from "./pages/OnboardingWizard";
import "./i18n/config";

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" /> : <Register />}
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/preferences"
          element={token ? <Preferences /> : <Navigate to="/login" />}
        />
        <Route
          path="/newsletters"
          element={token ? <Newsletters /> : <Navigate to="/login" />}
        />
        <Route
          path="/onboarding"
          element={token ? <OnboardingWizard /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
