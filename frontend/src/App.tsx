import { useEffect, useState, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import api from "./lib/api";

// Lazy load pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Admin = lazy(() => import("./pages/Admin"));
const Predictions = lazy(() => import("./pages/Predictions"));
const AlertSubscriptions = lazy(() => import("./pages/AlertSubscriptions"));
const Layout = lazy(() => import("./components/Layout"));
const Docs = lazy(() => import("./pages/Docs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));

// Route transition wrapper to prevent flash and handle scroll
function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme } = useThemeStore();

  useEffect(() => {
    // Ensure background is set immediately on route change
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    
    const bgColor = theme === 'dark' ? '#030712' : '#000000';
    html.style.background = bgColor;
    body.style.background = bgColor;
    if (root) {
      root.style.background = bgColor;
    }
  }, [location.pathname, theme]);

  // Scroll to top on route change, then handle hash if present
  useEffect(() => {
    // Always scroll to top first when pathname changes (immediate, no animation)
    // Use scrollTo(0, 0) for instant scroll without animation
    window.scrollTo(0, 0);
    
    // If there's a hash in the URL, wait for the page to render, then scroll to it smoothly
    if (location.hash) {
      const timer = setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  return <>{children}</>;
}


function App() {
  const { token, _hasHydrated, setAuth, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const [isValidating, setIsValidating] = useState(true);

  // Validate token on app startup - non-blocking
  useEffect(() => {
    const validateToken = async () => {
      if (!_hasHydrated) {
        return;
      }

      // If no token, no need to validate - show app immediately
      if (!token) {
        setIsValidating(false);
        return;
      }

      // Set validating to false immediately to show app, validate in background
      setIsValidating(false);

      try {
        // Validate token by calling /auth/me endpoint (non-blocking)
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

  // Loading component
  const LoadingFallback = () => (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950' 
        : 'bg-gradient-to-b from-black via-slate-950 to-blue-950'
    }`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading...</p>
      </div>
    </div>
  );

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950' 
          : 'bg-gradient-to-b from-black via-slate-950 to-blue-950'
      }`}
      style={{ minHeight: '100vh' }}
    >
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <RouteTransition>
          <Suspense fallback={<LoadingFallback />}>
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
              {!token && (
                <Route
                  path="/docs"
                  element={<Docs />}
                />
              )}
              <Route
                path="/privacy"
                element={<PrivacyPolicy />}
              />
              <Route
                path="/terms"
                element={<TermsOfService />}
              />
              <Route
                path="/about"
                element={<About />}
              />
              {/* Protected routes - keep existing paths for backward compatibility */}
              {token && (
                <Route
                  element={<Layout />}
                >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="services" element={<Services />} />
                  <Route path="services/:id" element={<ServiceDetail />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="alerts/subscriptions" element={<AlertSubscriptions />} />
                  <Route path="predictions" element={<Predictions />} />
                  <Route path="admin" element={<Admin />} />
                  <Route path="docs" element={<Docs />} />
                </Route>
              )}
              
              {/* Catch all */}
              <Route
                path="*"
                element={<Navigate to={token ? "/dashboard" : "/"} replace />}
              />
            </Routes>
          </Suspense>
        </RouteTransition>
      </Router>
    </div>
  );
}

export default App;
