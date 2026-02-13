import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Preferences from "./pages/Preferences";
import Newsletters from "./pages/Newsletters";
import OnboardingWizard from "./pages/OnboardingWizard";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import MyHates from "./pages/MyHates";
import "./i18n/config";

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/newsletters" /> : <Login />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/newsletters" /> : <Register />}
        />
        <Route
          path="/forgot-password"
          element={token ? <Navigate to="/newsletters" /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={token ? <Navigate to="/newsletters" /> : <ResetPassword />}
        />
        <Route
          path="/dashboard"
          element={<Navigate to="/newsletters" replace />}
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
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/hates"
          element={token ? <MyHates /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/newsletters" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
