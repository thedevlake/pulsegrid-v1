import { Link, useLocation } from "react-router-dom";
import { Activity, Home, BookOpen, Github } from "lucide-react";
import { useThemeStore } from "../store/themeStore";
import ThemeToggle from "./ThemeToggle";

const GITHUB_URL = "https://github.com/thedevlake/PULSEGRID-V1";

export default function PublicNav() {
  const { theme } = useThemeStore();
  const location = useLocation();

  return (
    <nav
      className={`sticky top-0 z-[100] w-full backdrop-blur-xl pb-4 sm:pb-6 shadow-lg shadow-black/20 border-b ${
        theme === "dark"
          ? "bg-gradient-to-b from-gray-950/95 via-slate-950/95 to-transparent border-slate-800/50"
          : "bg-gradient-to-b from-black/95 via-slate-950/95 to-transparent border-blue-900/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to="/"
            className="flex items-center space-x-2 sm:space-x-3 group"
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/20 ${
                theme === "dark" ? "bg-[#002147]" : "bg-[#002147]"
              }`}
            >
              <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
              PulseGrid
            </h1>
          </Link>
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-2 rounded-full px-2 py-1 backdrop-blur-xl border border-white/20 bg-white/10">
              <Link
                to="/"
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full flex items-center gap-1.5 transition-colors ${
                  location.pathname === "/"
                    ? "text-white bg-white/20 border border-white/30"
                    : "text-white/80 hover:text-white hover:bg-white/15"
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
                    ? "text-white bg-white/20 border border-white/30"
                    : "text-white/80 hover:text-white hover:bg-white/15"
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
                className="px-3 py-1.5 text-white/80 hover:text-white transition-colors text-xs sm:text-sm font-medium rounded-full flex items-center gap-1.5 hover:bg-white/15"
                title="GitHub Repository"
              >
                <Github className="w-4 h-4" />
                <span className="hidden md:inline">GitHub</span>
              </a>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full px-2 py-1 sm:px-3 sm:py-2 backdrop-blur-xl shadow-sm border border-white/20 bg-white/10">
              <Link
                to="/login"
                className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-colors ${
                  location.pathname === "/login"
                    ? "text-white bg-white/20 border border-white/30"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-all shadow-sm bg-gradient-to-r from-[#002147] to-blue-800 text-white hover:from-[#003366] hover:to-blue-900"
              >
                Get Started
              </Link>
            </div>
            <div className="sm:block hidden">
              <ThemeToggle />
            </div>
            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-1.5 py-1 backdrop-blur-xl">
                <Link
                  to="/"
                  className={`p-2 rounded-full transition-colors ${
                    location.pathname === "/"
                      ? "text-white bg-white/20"
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
                      ? "text-white bg-white/20"
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

