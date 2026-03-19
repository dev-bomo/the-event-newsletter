import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import api from "./lib/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Desktop from "./components/Desktop";
import Layout from "./components/Layout";
import OnboardingWizard from "./pages/OnboardingWizard";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import MyHates from "./pages/MyHates";
import LandingPage from "./pages/LandingPage";
import Pricing from "./pages/Pricing";
import Subscribe from "./pages/Subscribe";
import TestLoading from "./pages/TestLoading";
import Testing from "./pages/Testing";
import "./i18n/config";

function isLocalhost() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function App() {
  const { token, setUser, clearAuth } = useAuthStore();

  // Refresh user from API when we have a token (e.g. after Paddle webhook updates subscription)
  useEffect(() => {
    if (!token) return;
    api
      .get("/auth/me")
      .then((res) => {
        if (res.data?.user) setUser(res.data.user);
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          clearAuth();
        }
      });
  }, [token, setUser, clearAuth]);

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
          element={token ? <Layout><Desktop /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/newsletters"
          element={token ? <Layout><Desktop /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/onboarding"
          element={token ? <OnboardingWizard /> : <Navigate to="/login" />}
        />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/test-loading" element={<TestLoading />} />
        <Route
          path="/testing"
          element={
            token && isLocalhost() ? <Testing /> : <Navigate to="/newsletters" />
          }
        />
        <Route
          path="/hates"
          element={token ? <MyHates /> : <Navigate to="/login" />}
        />
        <Route
          path="/subscribe"
          element={token ? <Subscribe /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={token ? <Navigate to="/newsletters" /> : <LandingPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
