import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LogOut,
  LayoutDashboard,
  Server,
  Bell,
  Users,
  Activity,
  Brain,
  LucideIcon,
} from "lucide-react";
import Particles from "./Particles";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

function NavLink({ to, icon: Icon, label, isActive }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`relative inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
        isActive
          ? "text-white bg-white/10"
          : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 to-red-400/10 rounded-lg"></div>
      )}
      <Icon
        className={`w-4 h-4 mr-2 relative z-10 ${
          isActive ? "text-indigo-300" : "group-hover:text-white"
        } transition-colors`}
      />
      <span className="relative z-10">{label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-red-400 rounded-full"></div>
      )}
    </Link>
  );
}

export default function Layout() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // If we have a token but no user yet, still show the layout
  // The user might be loading from localStorage
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Not authenticated. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-black to-red-900 relative">
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

      {/* Content */}
      <div className="relative z-10">
        <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Brand Section - Enhanced */}
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 group relative"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-red-400/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative w-9 h-9 bg-gradient-to-br from-indigo-400 to-red-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent group-hover:from-white group-hover:via-indigo-200 group-hover:to-red-200 transition-all duration-300 tracking-tight">
                    PulseGrid
                  </h1>
                  <div className="h-0.5 w-0 bg-gradient-to-r from-indigo-400 to-red-400 group-hover:w-full transition-all duration-300 mt-0.5"></div>
                </div>
              </Link>

              {/* Navigation Links - Enhanced with Active States */}
              <div className="hidden md:flex items-center space-x-2">
                <NavLink
                  to="/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  isActive={
                    location.pathname === "/dashboard" ||
                    location.pathname === "/"
                  }
                />
                <NavLink
                  to="/services"
                  icon={Server}
                  label="Services"
                  isActive={location.pathname.startsWith("/services")}
                />
                <NavLink
                  to="/alerts"
                  icon={Bell}
                  label="Alerts"
                  isActive={location.pathname === "/alerts"}
                />
                <NavLink
                  to="/predictions"
                  icon={Brain}
                  label="Predictions"
                  isActive={location.pathname === "/predictions"}
                />
                {(user?.role === "admin" || user?.role === "super_admin") && (
                  <NavLink
                    to="/admin"
                    icon={Users}
                    label="Admin"
                    isActive={location.pathname === "/admin"}
                  />
                )}
              </div>

              {/* User Section - Enhanced */}
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right pr-4 border-r border-white/10">
                  <p className="text-sm font-semibold text-white">
                    {user?.name || user?.email}
                  </p>
                  {user?.role && (
                    <p className="text-xs text-white/50 capitalize font-medium">
                      {user.role}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 border border-transparent hover:border-white/20"
                >
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
