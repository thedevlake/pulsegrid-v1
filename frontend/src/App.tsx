import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
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
  const { token, _hasHydrated } = useAuthStore();
  const { theme } = useThemeStore();

  // Wait for auth store to hydrate from localStorage
  if (!_hasHydrated) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-gray-900' 
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
        <Route
          path="/login"
          element={!token ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={!token ? <Register /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/"
          element={
            token ? (
              <>
               
                <Layout />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:id" element={<ServiceDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="alerts/subscriptions" element={<AlertSubscriptions />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
