import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import api from "../lib/api";
import Particles from "../components/Particles";
import CardSwap, { Card } from "../components/CardSwap";
import ThemeToggle from "../components/ThemeToggle";
import PageTransition from "../components/PageTransition";
import { LogIn, Mail, Lock, Activity } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { theme } = useThemeStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);
      if (response.data.token && response.data.user) {
        setAuth(response.data.token, response.data.user);
        navigate("/dashboard", { replace: true });
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition animationType="fade">
      <div
        className={`min-h-screen relative flex flex-col py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950"
            : "bg-gradient-to-b from-black via-slate-950 to-blue-950"
        }`}
      >
        {/* Theme Toggle - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Particles Background */}
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <Particles
            particleColors={
              theme === "dark"
                ? ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa"]
                : ["#ffffff", "#ffffff"]
            }
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>

        {/* PULSEGRID Branding */}
        <div className="relative z-10 w-full max-w-6xl mx-auto mb-12">
          <div className="flex flex-col items-center lg:items-start">
            <div className="flex items-center space-x-3 mb-2 mt-20">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-slate-600 to-gray-700"
                    : "bg-gradient-to-br from-blue-800 to-indigo-900"
                }`}
              >
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight">
                PulseGrid
              </h1>
            </div>
            <p className="text-lg text-white font-medium">
              Cloud-Native Infrastructure Monitoring Platform
            </p>
            <p className="text-sm text-white/80 mt-2 max-w-2xl text-center sm:text-left">
              Monitor your services, track uptime, and receive instant alerts.
              Built for startups, businesses, and tech communities.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start w-full">
            {/* Left Column - Login Form */}
            <div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 border border-white/20">
                    <LogIn className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-semibold text-white tracking-tight">
                    Sign in to PulseGrid
                  </h2>
                  <p className="mt-2 text-sm text-white/90">
                    Access your monitoring dashboard
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
                              : "focus:ring-blue-700/50 focus:border-blue-700/50"
                          }`}
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                          autoComplete="current-password"
                          required
                          className={`block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                            theme === "dark"
                              ? "focus:ring-slate-400/50 focus:border-slate-400/50"
                              : "focus:ring-blue-700/50 focus:border-blue-700/50"
                          }`}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 focus:ring-blue-400"
                          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 focus:ring-blue-400"
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
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </button>
                  </div>

                  {/* Sign up link */}
                  <div className="text-center">
                    <p className="text-sm text-white/90">
                      Don't have an account?{" "}
                      <Link
                        to="/register"
                        className={`font-semibold transition-colors ${
                          theme === "dark"
                            ? "text-slate-300 hover:text-slate-200"
                            : "text-blue-500 hover:text-blue-400"
                        }`}
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column - CardSwap Feature Showcase */}
            <div className="hidden lg:flex flex-col space-y-6 ">
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
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
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
                          <span className="font-semibold text-indigo-600">
                            real-time metrics
                          </span>{" "}
                          and service health data. View uptime statistics,
                          response times, and performance insights at a glance.
                        </p>
                        <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                          <svg
                            className="w-3.5 h-3.5 text-indigo-500"
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
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
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
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
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
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
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
      </div>
    </PageTransition>
  );
}
