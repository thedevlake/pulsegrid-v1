import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import {
  LogOut,
  LayoutDashboard,
  Server,
  Bell,
  Users,
  Activity,
  Brain,
  BookOpen,
  LucideIcon,
} from "lucide-react";
import GlassSurface from "./GlassSurface";
import CardNav, { CardNavItem } from "./CardNav";
import ThemeToggle from "./ThemeToggle";
import Particles from "./Particles";
import BackButton from "./BackButton";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

function NavLink({ to, icon: Icon, label, isActive }: NavLinkProps) {
  const { theme } = useThemeStore();
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
        <div
          className={`absolute inset-0 rounded-lg ${
            theme === "dark"
              ? "bg-gradient-to-r from-slate-500/10 to-gray-500/10"
              : "bg-gradient-to-r from-blue-500/10 to-indigo-500/10"
          }`}
        ></div>
      )}
      <Icon
        className={`w-4 h-4 mr-2 relative z-10 ${
          isActive
            ? theme === "dark"
              ? "text-slate-300"
              : "text-blue-400"
            : "group-hover:text-white"
        } transition-colors`}
      />
      <span className="relative z-10">{label}</span>
      {isActive && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
            theme === "dark"
              ? "bg-gradient-to-r from-slate-400 to-gray-400"
              : "bg-gradient-to-r from-blue-500 to-indigo-500"
          }`}
        ></div>
      )}
    </Link>
  );
}

export default function Layout() {
  const { user, token, logout } = useAuthStore();
  const { theme } = useThemeStore();
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

  // Create logo SVG data URL
  const logo = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>'
  )}`;

  // Navigation items for CardNav - Vibrant, exciting glassmorphism design
  const navItems: CardNavItem[] = [
    {
      label: "Monitoring",
      bgColor:
        theme === "dark"
          ? "linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(67, 56, 202, 0.5) 50%, rgba(79, 70, 229, 0.4) 100%)" // vibrant indigo gradient
          : "linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.6) 50%, rgba(29, 78, 216, 0.5) 100%)", // vibrant blue gradient
      textColor: "#fff",
      links: [
        {
          label: "Dashboard",
          href: "/dashboard",
          ariaLabel: "Go to Dashboard",
        },
        { label: "Services", href: "/services", ariaLabel: "View Services" },
      ],
    },
    {
      label: "Alerts & Insights",
      bgColor:
        theme === "dark"
          ? "linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(147, 51, 234, 0.5) 50%, rgba(126, 34, 206, 0.4) 100%)" // vibrant purple gradient
          : "linear-gradient(135deg, rgba(96, 165, 250, 0.5) 0%, rgba(59, 130, 246, 0.6) 50%, rgba(37, 99, 235, 0.5) 100%)", // vibrant blue-purple gradient
      textColor: "#fff",
      links: [
        { label: "Alerts", href: "/alerts", ariaLabel: "View Alerts" },
        {
          label: "Predictions",
          href: "/predictions",
          ariaLabel: "AI Predictions",
        },
      ],
    },
    ...(user?.role === "admin" || user?.role === "super_admin"
      ? [
          {
            label: "Admin",
            bgColor:
              theme === "dark"
                ? "linear-gradient(135deg, rgba(236, 72, 153, 0.4) 0%, rgba(219, 39, 119, 0.5) 50%, rgba(190, 24, 93, 0.4) 100%)" // vibrant pink gradient
                : "linear-gradient(135deg, rgba(37, 99, 235, 0.5) 0%, rgba(29, 78, 216, 0.6) 50%, rgba(30, 64, 175, 0.5) 100%)", // vibrant deep blue gradient
            textColor: "#fff",
            links: [
              {
                label: "Admin Panel",
                href: "/admin",
                ariaLabel: "Admin Panel",
              },
            ],
          },
        ]
      : []),
    {
      label: "Resources",
      bgColor:
        theme === "dark"
          ? "linear-gradient(135deg, rgba(14, 165, 233, 0.4) 0%, rgba(56, 189, 248, 0.5) 50%, rgba(59, 130, 246, 0.4) 100%)"
          : "linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(96, 165, 250, 0.5) 50%, rgba(129, 212, 250, 0.4) 100%)",
      textColor: "#fff",
      links: [
        {
          label: "Docs & Guides",
          href: "/docs",
          ariaLabel: "PulseGrid Documentation",
        },
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen relative transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950"
          : "bg-gradient-to-b from-black via-slate-950 to-blue-950"
      }`}
    >
      {/* Particles Background */}
      <div
        className="fixed inset-0 w-full h-full z-0"
        style={{ position: "fixed", width: "100%", height: "100%" }}
      >
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

      {/* Content */}
      <div className="relative z-10">
        {/* Mobile/Tablet Navigation - CardNav */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50">
          <CardNav
            logo={logo}
            logoAlt="PulseGrid Logo"
            items={navItems}
            baseColor="rgba(255, 255, 255, 0.1)" // glassy white with low opacity
            menuColor="#fff"
            buttonBgColor="#1e3a8a" // blue-900
            buttonTextColor="#fff"
            buttonLabel="Logout"
            onButtonClick={handleLogout}
            ease="power3.out"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="fixed top-0 left-0 right-0 w-full hidden md:block z-50">
          <GlassSurface
            width="100%"
            height={80}
            displace={15}
            distortionScale={-150}
            redOffset={5}
            greenOffset={15}
            blueOffset={25}
            brightness={60}
            opacity={0.8}
            mixBlendMode="screen"
            className="border-b border-white/20"
            style={{ borderRadius: 0 }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full h-full">
              <div className="flex items-center justify-between h-20">
                {/* Brand Section - Enhanced */}
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-3 group relative"
                >
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-lg blur-md group-hover:blur-lg transition-all duration-300 ${
                        theme === "dark"
                          ? "bg-gradient-to-br from-slate-500/20 to-gray-500/20"
                          : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
                      }`}
                    ></div>
                    <div
                      className={`relative w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg ${
                        theme === "dark"
                          ? "bg-gradient-to-br from-slate-600 to-gray-700 shadow-slate-500/20"
                          : "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20"
                      }`}
                    >
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1
                      className="text-xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent group-hover:from-white transition-all duration-300 tracking-tight"
                      style={{
                        backgroundImage:
                          theme === "dark"
                            ? "linear-gradient(to right, white, white, rgba(255,255,255,0.8))"
                            : "linear-gradient(to right, white, white, rgba(255,255,255,0.8))",
                      }}
                      onMouseEnter={(e) => {
                        if (theme === "dark") {
                          e.currentTarget.style.backgroundImage =
                            "linear-gradient(to right, white, rgb(203, 213, 225), rgb(226, 232, 240))";
                        } else {
                          e.currentTarget.style.backgroundImage =
                            "linear-gradient(to right, white, rgb(191, 219, 254), rgb(199, 210, 254))";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundImage =
                          "linear-gradient(to right, white, white, rgba(255,255,255,0.8))";
                      }}
                    >
                      PulseGrid
                    </h1>
                    <div
                      className={`h-0.5 w-0 group-hover:w-full transition-all duration-300 mt-0.5 ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-slate-400 to-gray-400"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500"
                      }`}
                    ></div>
                  </div>
                </Link>

                {/* Navigation Links - Enhanced with Active States */}
                <div className="flex items-center space-x-2">
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
                  <NavLink
                    to="/docs"
                    icon={BookOpen}
                    label="Docs"
                    isActive={location.pathname === "/docs"}
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
                  <ThemeToggle />
                  <div className="hidden sm:block text-right pr-4 border-r border-white/10 dark:border-white/20">
                    <p className="text-sm text-left font-semibold text-white dark:text-white">
                      {user?.name
                        ? user.name.split(" ")[0]
                        : user?.email?.split("@")[0] || user?.email}
                    </p>
                    {user?.role && (
                      <p className="text-xs text-white/50 dark:text-white/60 capitalize font-medium">
                        {user.role}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white/70 dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-white/30"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </GlassSurface>
        </nav>
        <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 md:pt-24">
          {location.pathname !== "/dashboard" && (
            <div className="mb-6">
              <BackButton />
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
