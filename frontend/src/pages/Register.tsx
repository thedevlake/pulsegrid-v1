import { useState, lazy, Suspense, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import api from "../lib/api";

const Particles = lazy(() => import("../components/Particles"));
import CardSwap, { Card } from "../components/CardSwap";
import ThemeToggle from "../components/ThemeToggle";
import PageTransition from "../components/PageTransition";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Building2,
  Activity,
  Home,
  BookOpen,
  Github,
} from "lucide-react";

const GITHUB_URL = "https://github.com/thedevlake/PULSEGRID-V1";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    orgName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();

  // Defer particles loading until after initial render
  useEffect(() => {
    const timer = setTimeout(() => setParticlesLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Convert camelCase to snake_case for backend
      const requestData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        org_name: formData.orgName, // Backend expects snake_case
      };

      const response = await api.post("/auth/register", requestData);
      console.log("Register response:", response.data);
      if (response.data.token && response.data.user) {
        setAuth(response.data.token, response.data.user);
        navigate("/dashboard", { replace: true });
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      // Handle validation errors more gracefully
      if (err.response?.data?.error) {
        const errorMsg = err.response.data.error;
        // Extract field-specific errors
        if (errorMsg.includes("Password") && errorMsg.includes("min")) {
          setError("Password must be at least 8 characters long");
        } else if (
          errorMsg.includes("OrgName") ||
          errorMsg.includes("org_name")
        ) {
          setError("Organization name is required");
        } else {
          setError(errorMsg);
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition animationType="fade">
      <div
        className={`min-h-screen relative flex flex-col transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950"
            : "bg-gradient-to-b from-black via-slate-950 to-blue-950"
        }`}
        style={{ minHeight: "100vh" }}
      >
        {/* Navigation - Sticky */}
        <nav className="sticky top-0 z-[100] w-full bg-gradient-to-b from-gray-950/95 via-slate-950/95 to-transparent backdrop-blur-xl pb-4 sm:pb-6 shadow-lg shadow-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Link
                to="/"
                className="flex items-center space-x-2 sm:space-x-3 group"
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/20 ${
                    theme === "dark" ? "bg-blue-800" : "bg-blue-900"
                  }`}
                >
                  <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                  PulseGrid
                </h1>
              </Link>
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Mobile Navigation Links */}
                <div className="flex sm:hidden items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-1.5 py-1 backdrop-blur-xl">
                  <Link
                    to="/"
                    className={`p-2 rounded-full transition-colors ${
                      location.pathname === "/"
                        ? "text-white bg-blue-800/30"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    title="Home"
                  >
                    <Home className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/docs"
                    className={`p-2 rounded-full transition-colors ${
                      location.pathname === "/docs"
                        ? "text-white bg-blue-800/30"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    title="Documentation"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full text-white/70 hover:text-white transition-colors hover:bg-white/10"
                    title="GitHub Repository"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>

                {/* Desktop Navigation Links */}
                <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-xl">
                  <Link
                    to="/"
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full flex items-center gap-1.5 transition-colors ${
                      location.pathname === "/"
                        ? "text-white bg-blue-800/30 border border-blue-800/50"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    title="Home"
                  >
                    <Home className="w-4 h-4" />
                    <span className="hidden md:inline">Home</span>
                  </Link>
                  <Link
                    to="/docs"
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full flex items-center gap-1.5 transition-colors ${
                      location.pathname === "/docs"
                        ? "text-white bg-blue-800/30 border border-blue-800/50"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    title="Documentation"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden md:inline">Docs</span>
                  </Link>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-white/70 hover:text-white transition-colors text-xs sm:text-sm font-medium rounded-full flex items-center gap-1.5 hover:bg-white/10"
                    title="GitHub Repository"
                  >
                    <Github className="w-4 h-4" />
                    <span className="hidden md:inline">GitHub</span>
                  </a>
                </div>

                {/* Auth Buttons - Desktop */}
                <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 backdrop-blur-xl shadow-lg">
                  <Link
                    to="/login"
                    className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors ${
                      location.pathname === "/login"
                        ? "text-white bg-blue-800/30 border border-blue-800/50"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className={`px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-all shadow-lg ${
                      location.pathname === "/register"
                        ? "bg-blue-700 text-white"
                        : "bg-blue-800 text-white hover:bg-blue-700"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>

                {/* Theme Toggle - Always visible, well positioned */}
                <div className="flex-shrink-0">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Particles Background - Lazy loaded and reduced */}
        {particlesLoaded && (
          <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
            <Suspense fallback={null}>
              <Particles
                particleColors={["#ffffff", "#ffffff", "#ffffff"]}
                particleCount={100}
                particleSpread={10}
                speed={0.08}
                particleBaseSize={70}
                moveParticlesOnHover={false}
                alphaParticles={false}
                disableRotation={false}
              />
            </Suspense>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            {/* Left Column - Signup Form */}
            <div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sm:p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl mb-4 border border-white/20">
                    <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                    Create your account
                  </h2>
                  <p className="mt-2 text-sm text-white/90">
                    Start monitoring your services in minutes
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 backdrop-blur-sm">
                      <p className="text-sm text-red-200 font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Full Name Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-medium text-white"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          required
                          className={`block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                            theme === "dark"
                              ? "focus:ring-slate-400/50 focus:border-slate-400/50"
                              : "focus:ring-blue-800/50 focus:border-blue-800/50"
                          }`}
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-white"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className={`block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                            theme === "dark"
                              ? "focus:ring-slate-400/50 focus:border-slate-400/50"
                              : "focus:ring-blue-800/50 focus:border-blue-800/50"
                          }`}
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Organization Name Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="orgName"
                        className="text-sm font-medium text-white"
                      >
                        Organization Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          id="orgName"
                          name="orgName"
                          type="text"
                          required
                          className={`block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                            theme === "dark"
                              ? "focus:ring-slate-400/50 focus:border-slate-400/50"
                              : "focus:ring-blue-800/50 focus:border-blue-800/50"
                          }`}
                          placeholder="Acme Inc"
                          value={formData.orgName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              orgName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-white"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-white/60" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          className={`block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                            theme === "dark"
                              ? "focus:ring-slate-400/50 focus:border-slate-400/50"
                              : "focus:ring-blue-800/50 focus:border-blue-800/50"
                          }`}
                          placeholder="Minimum 8 characters"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                        />
                      </div>
                      {formData.password.length > 0 &&
                        formData.password.length < 8 && (
                          <p className="mt-1.5 text-xs text-yellow-300">
                            Password must be at least 8 characters
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        (formData.password.length > 0 &&
                          formData.password.length < 8)
                      }
                      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-blue-800 via-blue-800 to-blue-900 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 focus:ring-blue-400"
                          : "bg-gradient-to-r from-blue-800 via-blue-800 to-blue-900 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 focus:ring-blue-400"
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating account...
                        </>
                      ) : (
                        "Sign up"
                      )}
                    </button>
                  </div>

                  {/* Sign in link */}
                  <div className="text-center">
                    <p className="text-sm text-white/90">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className={`font-semibold transition-colors ${
                          theme === "dark"
                            ? "text-slate-300 hover:text-slate-200"
                            : "text-blue-400 hover:text-blue-300"
                        }`}
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column - CardSwap Feature Showcase */}
            <div className="hidden lg:flex flex-col space-y-6">
              <div className="flex items-center justify-center h-[500px] relative overflow-visible">
                <div className="relative w-full h-full">
                  <CardSwap
                    width={380}
                    height={420}
                    cardDistance={50}
                    verticalDistance={60}
                    delay={5000}
                    pauseOnHover={false}
                  >
                    <Card>
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/45 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mb-5 shadow-md">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                          Your Dashboard Awaits
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                          Access your{" "}
                          <span className="font-semibold text-blue-800">
                            real-time metrics
                          </span>{" "}
                          and service health data. View uptime statistics,
                          response times, and performance insights at a glance.
                        </p>
                        <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                          <svg
                            className="w-3.5 h-3.5 text-blue-700"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          <span>Instant access to all services</span>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/35 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                          Stay Informed
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                          Get{" "}
                          <span className="font-semibold text-emerald-600">
                            instant alerts
                          </span>{" "}
                          when your services go down or experience issues. Never
                          miss a critical incident with our multi-channel
                          notifications.
                        </p>
                        <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                          <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span>Active monitoring 24/7</span>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/45 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                          Historical Insights
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                          Analyze{" "}
                          <span className="font-semibold text-purple-600">
                            performance trends
                          </span>{" "}
                          over time with detailed charts and reports. Make
                          data-driven decisions to improve your infrastructure.
                        </p>
                        <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                          <svg
                            className="w-3.5 h-3.5 text-purple-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <span>Comprehensive analytics</span>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/45 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                          Secure & Reliable
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                          Your data is protected with{" "}
                          <span className="font-semibold text-amber-600">
                            enterprise-grade security
                          </span>
                          . Built on AWS with role-based access control and
                          encrypted data storage.
                        </p>
                        <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                          <svg
                            className="w-3.5 h-3.5 text-amber-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          <span>Bank-level security</span>
                        </div>
                      </div>
                    </Card>
                  </CardSwap>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 w-full border-t border-white/10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="text-center space-y-2">
              <p className="text-sm text-white/60">
                © 2025 PulseGrid. All rights reserved.
              </p>
              <p className="text-xs text-white/50">Developed by Thedevlake</p>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
