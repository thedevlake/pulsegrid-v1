import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import Particles from "../components/Particles";
import CardSwap, { Card } from "../components/CardSwap";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Building2,
  Activity,
  Bell,
  BarChart3,
  Shield,
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    orgName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-black to-red-900 relative flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      {/* Particles Background */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <Particles
          particleColors={["black", "black"]}
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
      <div className="relative z-10 w-full max-w-6xl mx-auto mb-12 mt-20">
        <div className="flex flex-col items-center lg:items-start">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-red-400 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight">
              PulseGrid
            </h1>
          </div>
          <p className="text-lg text-white/80 font-medium">
            Cloud-Native Infrastructure Monitoring Platform
          </p>
          <p className="text-sm text-white/60 mt-2 max-w-2xl">
            Monitor your services, track uptime, and receive instant alerts.
            Built for startups, businesses, and tech communities.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start w-full">
          {/* Left Column - Signup Form */}
          <div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 border border-white/20">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold text-white tracking-tight">
                  Create account
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Get started with PulseGrid monitoring
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 backdrop-blur-sm">
                    <p className="text-sm text-red-200 font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Full Name Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-white/90"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-white/40" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all sm:text-sm"
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
                      className="text-sm font-medium text-white/90"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-white/40" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all sm:text-sm"
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
                      className="text-sm font-medium text-white/90"
                    >
                      Organization Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-white/40" />
                      </div>
                      <input
                        id="orgName"
                        name="orgName"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all sm:text-sm"
                        placeholder="Acme Inc"
                        value={formData.orgName}
                        onChange={(e) =>
                          setFormData({ ...formData, orgName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-white/90"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-white/40" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all sm:text-sm"
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
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
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                  <p className="text-sm text-white/70">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-white hover:text-white/80 transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - CardSwap Feature Showcase */}
          <div className="hidden lg:flex flex-col space-y-6 mt-20">
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
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                        <Activity className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                        Real-Time Monitoring
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                        Track your services with{" "}
                        <span className="font-semibold text-emerald-600">
                          live health checks
                        </span>{" "}
                        and instant status updates. Get notified the moment
                        something goes down.
                      </p>
                      <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span>Live updates every 5s</span>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                        <Bell className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                        Smart Alerts
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                        Receive{" "}
                        <span className="font-semibold text-amber-600">
                          instant notifications
                        </span>{" "}
                        via email, SMS, or Slack when your services experience
                        downtime or performance issues.
                      </p>
                      <div className="mt-auto flex items-center justify-center gap-2 text-xs">
                        <span className="px-2.5 py-1 bg-indigo-50 rounded-md border border-indigo-100 text-indigo-700 font-medium">
                          Email
                        </span>
                        <span className="px-2.5 py-1 bg-indigo-50 rounded-md border border-indigo-100 text-indigo-700 font-medium">
                          SMS
                        </span>
                        <span className="px-2.5 py-1 bg-indigo-50 rounded-md border border-indigo-100 text-indigo-700 font-medium">
                          Slack
                        </span>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                        <BarChart3 className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                        Analytics Dashboard
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                        Visualize{" "}
                        <span className="font-semibold text-indigo-600">
                          uptime trends
                        </span>
                        , response times, and performance metrics with
                        beautiful, interactive charts and reports.
                      </p>
                      <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Interactive charts & reports</span>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 tracking-tight">
                        Enterprise Ready
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm max-w-[260px] mb-5">
                        Built on{" "}
                        <span className="font-semibold text-purple-600">
                          AWS infrastructure
                        </span>{" "}
                        with multi-tenant isolation, role-based access control,
                        and enterprise-grade security.
                      </p>
                      <div className="mt-auto flex items-center justify-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                        <Shield className="w-3.5 h-3.5 text-purple-500" />
                        <span>99.9% uptime SLA</span>
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
  );
}
