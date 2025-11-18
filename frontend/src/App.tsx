import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import api from "./lib/api";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Alerts from "./pages/Alerts";
import Admin from "./pages/Admin";
import Predictions from "./pages/Predictions";
import AlertSubscriptions from "./pages/AlertSubscriptions";
import Layout from "./components/Layout";


function App() {
  const { token, _hasHydrated, setAuth, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const [isValidating, setIsValidating] = useState(true);

  // Validate token on app startup
  useEffect(() => {
    const validateToken = async () => {
      if (!_hasHydrated) {
        return;
      }

      // If no token, no need to validate
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        // Validate token by calling /auth/me endpoint
        const response = await api.get("/auth/me");
        if (response.data?.user) {
          // Token is valid, update user info in case it changed
          setAuth(token, response.data.user);
        } else {
          // Invalid response, clear auth
          logout();
        }
      } catch (error: any) {
        // Token is invalid or expired, clear auth
        console.log("Token validation failed:", error.response?.status || error.message);
        logout();
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [_hasHydrated, token, setAuth, logout]);

  // Wait for auth store to hydrate from localStorage and token validation
  if (!_hasHydrated || isValidating) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950' 
          : 'bg-gradient-to-b from-black via-slate-950 to-blue-950'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 dark:border-slate-400/40 mx-auto"></div>
          <p className="mt-4 text-white/70 dark:text-slate-300/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={!token ? <Landing /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/login"
          element={!token ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={!token ? <Register /> : <Navigate to="/dashboard" replace />}
        />
        
        {/* Protected routes - keep existing paths for backward compatibility */}
        <Route
          element={
            token ? (
              <Layout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:id" element={<ServiceDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="alerts/subscriptions" element={<AlertSubscriptions />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        
        {/* Catch all */}
        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
