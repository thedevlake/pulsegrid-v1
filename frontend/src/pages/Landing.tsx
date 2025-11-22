import { Link } from "react-router-dom";
import PageTransition from "../components/PageTransition";
import { useThemeStore } from "../store/themeStore";
import ColorBends from "../components/ColorBends";
import PublicNav from "../components/PublicNav";
import {
  Activity,
  Shield,
  Bell,
  BarChart3,
  Globe,
  ArrowRight,
  Server,
  Cloud,
  Sparkles,
  BookOpen,
  Github,
  Database,
  Monitor,
  Loader2,
  CheckCircle2,
  XCircle,
  Code,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import api from "../lib/api";

// Lazy load heavy components
const Particles = lazy(() => import("../components/Particles"));
const RotatingText = lazy(() => import("../components/RotatingText"));

// GitHub repository URL - Update this with your actual GitHub repo URL
const GITHUB_URL = "https://github.com/thedevlake/PULSEGRID-V1";

export default function Landing() {
  const { theme } = useThemeStore();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  // System Status state
  const [systemStatus, setSystemStatus] = useState({
    api: "checking",
    database: "checking",
    frontend: "operational",
  });

  // Defer particles loading until after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setParticlesLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Check system status on mount
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await api.get("/health");
        setSystemStatus((prev) => ({
          ...prev,
          api: response.data?.status === "healthy" ? "operational" : "degraded",
        }));
      } catch (error) {
        setSystemStatus((prev) => ({ ...prev, api: "degraded" }));
      }
    };
    checkSystemStatus();
    // Check every 60 seconds to reduce resource usage
    const interval = setInterval(checkSystemStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description:
        "Continuous health checks track uptime, latency, and performance metrics.",
      color: "from-blue-400/20 to-indigo-600/20",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description:
        "Instant notifications via email, SMS, or Slack when issues are detected.",
      color: "from-blue-400/20 to-indigo-600/20",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Visualize trends, export reports, and leverage AI-powered predictions.",
      color: "from-blue-400/20 to-indigo-600/20",
    },
    {
      icon: Shield,
      title: "Multi-Tenant Security",
      description:
        "Enterprise-grade data isolation ensures your organization's privacy.",
      color: "from-blue-400/20 to-indigo-600/20",
    },
    {
      icon: Globe,
      title: "Multi-Protocol Support",
      description:
        "Monitor HTTP/HTTPS endpoints, TCP services, and ICMP checks.",
      color: "from-blue-400/20 to-indigo-600/20",
    },
    {
      icon: Cloud,
      title: "Cloud-Native",
      description:
        "Built on AWS with auto-scaling for reliability and performance.",
      color: "from-blue-400/20 to-indigo-600/20",
    },
  ];

  const featureDetails: Record<
    string,
    { tag: string; accent: string; bullets: string[] }
  > = {
    "Real-Time Monitoring": {
      tag: "Latency Guard",
      accent: "from-blue-500/40 via-indigo-500/20 to-transparent",
      bullets: ["200+ global probes", "1-second sampling windows"],
    },
    "Smart Alerts": {
      tag: "Signal Routing",
      accent: "from-blue-500/30 via-indigo-500/20 to-transparent",
      bullets: ["Email • SMS • Slack", "Auto-escalation policies"],
    },
    "Analytics & Insights": {
      tag: "AI Insights",
      accent: "from-blue-500/30 via-indigo-500/20 to-transparent",
      bullets: ["Predictive baselines", "Exportable executive reports"],
    },
    "Multi-Tenant Security": {
      tag: "Zero-Trust",
      accent: "from-blue-500/30 via-indigo-500/20 to-transparent",
      bullets: ["Org-level RBAC", "Encrypted at rest & transit"],
    },
    "Multi-Protocol Support": {
      tag: "Protocol Mesh",
      accent: "from-blue-500/30 via-indigo-500/20 to-transparent",
      bullets: ["HTTP/S, TCP, ICMP", "Custom heartbeat scripts"],
    },
    "Cloud-Native": {
      tag: "AWS Backbone",
      accent: "from-blue-500/30 via-indigo-500/20 to-transparent",
      bullets: ["Auto-scaling clusters", "Global edge caching"],
    },
  };

  // Intersection Observer for scroll animations - optimized with passive listeners
  useEffect(() => {
    // Defer observer creation until after initial render
    const timeoutId = setTimeout(() => {
      const observers: IntersectionObserver[] = [];

      // Observe feature cards
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.add(index);
                  return newSet;
                });
                // Unobserve after first intersection for better performance
                observer.unobserve(card);
              }
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        observer.observe(card);
        observers.push(observer);
      });

      // Observe stats section
      if (statsRef.current) {
        const statsObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setStatsVisible(true);
                statsObserver.unobserve(statsRef.current!);
              }
            });
          },
          { threshold: 0.3 }
        );
        statsObserver.observe(statsRef.current);
        observers.push(statsObserver);
      }

      return () => {
        observers.forEach((observer) => observer.disconnect());
      };
    }, 100); // Small delay to prioritize initial render

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Magnetic hover effect handler - optimized with requestAnimationFrame
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    const card = cardRefs.current[index];
    if (!card) return;

    requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const moveX = (x - centerX) * 0.1;
      const moveY = (y - centerY) * 0.1;

      card.style.transform = `perspective(1000px) rotateY(${
        moveX * 0.05
      }deg) rotateX(${-moveY * 0.05}deg) translateZ(10px)`;
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;
    requestAnimationFrame(() => {
      card.style.transform =
        "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
    });
  };

  return (
    <PageTransition animationType="fade">
      <div
        className={`min-h-screen relative flex flex-col transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-r from-gray-950 via-slate-900 to-zinc-950"
            : "bg-gradient-to-r from-black via-[#002147] to-zinc-950"
        }`}
      >
        {/* ColorBends Background - Oxford Blue Gradient Feel */}
        <div className="fixed inset-0 w-full h-full z-[1] opacity-30 pointer-events-none">
          <ColorBends
            colors={
              theme === "dark"
                ? ["#002147", "#1e3a8a", "#3b82f6", "#60a5fa"]
                : ["#002147", "#1e40af", "#3b82f6", "#60a5fa"]
            }
            rotation={30}
            speed={0.2}
            scale={1.0}
            frequency={1.2}
            warpStrength={0.8}
            mouseInfluence={0.5}
            parallax={0.4}
            noise={0.05}
            transparent
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* Particles Background - Lazy loaded and deferred */}
        {particlesLoaded && (
          <div className="fixed inset-0 w-full h-full z-[1] pointer-events-none">
            <Suspense fallback={null}>
              <Particles
                particleColors={
                  theme === "dark"
                    ? ["#ffffff", "#e0e7ff", "#c7d2fe"]
                    : ["#ffffff", "#dbeafe", "#bfdbfe"]
                }
                particleCount={150}
                particleSpread={10}
                speed={0.1}
                particleBaseSize={70}
                sizeRandomness={0.6}
                moveParticlesOnHover={true}
                alphaParticles={false}
                disableRotation={false}
              />
            </Suspense>
          </div>
        )}

        {/* Navigation - Sticky */}
        <PublicNav />

        {/* Hero Section */}
        <section className="relative z-[2] flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 animate-fade-in animate-delay-100">
          <div className="w-full max-w-7xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-xl border border-white/20 bg-white/10 mb-6 sm:mb-8 animate-fade-in-up">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-white/90">
                Cloud-Native Infrastructure Monitoring
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight animate-fade-in-up animate-delay-100 px-2">
              Monitor Your Services
              <br className="hidden sm:block" />
              <span className="block sm:inline"> </span>
              <Suspense
                fallback={
                  <span
                    className={
                      theme === "dark" ? "text-blue-400" : "text-blue-300"
                    }
                  >
                    With Confidence
                  </span>
                }
              >
                <RotatingText
                  texts={[
                    "With Confidence",
                    "With Precision",
                    "With Ease",
                    "With Power",
                  ]}
                  mainClassName="inline-block  justify-center items-center"
                  elementLevelClassName={`inline-block ${
                    theme === "dark" ? "text-blue-400" : "text-blue-300"
                  }`}
                  staggerFrom={"last"}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={4000}
                  style={{
                    color: theme === "dark" ? "#60a5fa" : "#93c5fd",
                  }}
                />
              </Suspense>
            </h1>

            {/* Subheading */}
            <p
              className={`text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animate-delay-200 px-4 ${
                theme === "dark" ? "text-slate-300" : "text-blue-100"
              }`}
            >
              Track uptime, performance, and health of your web services and
              APIs. Get instant alerts and make data-driven decisions with
              AI-powered insights.
            </p>

            {/* CTA Buttons - Single set */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 animate-fade-in-up animate-delay-300 px-4">
              <Link
                to="/register"
                className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#002147] to-blue-800 text-white text-base sm:text-lg font-semibold rounded-xl hover:from-[#003366] hover:to-blue-900 transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
              >
                <span>Start Monitoring for Free</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-xl text-white text-base sm:text-lg font-semibold rounded-xl transition-all border border-white/20 bg-white/10 hover:bg-white/20 shadow-sm"
              >
                Sign In
              </Link>
            </div>

            {/* Stats Grid */}
            <div
              ref={statsRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto px-4 animate-fade-in-up animate-delay-200"
            >
              {[
                {
                  value: "99.9%",
                  label: "Uptime Tracking",
                  description:
                    "Global SLAs verified every 30 seconds from 14 regions.",
                  icon: Activity,
                  accent: "from-blue-500/60 via-indigo-500/40 to-transparent",
                  bgColor: "bg-white/5 backdrop-blur-xl",
                  textColor: "text-white",
                },
                {
                  value: "<1s",
                  label: "Alert Response",
                  description:
                    "Multi-channel routing hits on-call teams in under a second.",
                  icon: Bell,
                  accent: "from-blue-500/60 via-indigo-500/40 to-transparent",
                  bgColor: "bg-white/5 backdrop-blur-xl",
                  textColor: "text-white",
                },
                {
                  value: "24/7",
                  label: "Monitoring",
                  description:
                    "AI-assisted anomaly detection watches nights and weekends.",
                  icon: Monitor,
                  accent: "from-blue-500/60 via-indigo-500/40 to-transparent",
                  bgColor: "bg-white/5 backdrop-blur-xl",
                  textColor: "text-white",
                },
                {
                  value: "∞",
                  label: "Scalability",
                  description:
                    "Add unlimited services without touching your pipelines.",
                  icon: Cloud,
                  accent: "from-blue-500/60 via-indigo-500/40 to-transparent",
                  bgColor: "bg-white/5 backdrop-blur-xl",
                  textColor: "text-white",
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`relative overflow-hidden rounded-2xl border backdrop-blur-2xl p-5 sm:p-6 shadow-lg shadow-black/20 group stat-card bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 ${
                      statsVisible ? "stat-visible" : ""
                    }`}
                    style={{
                      animationDelay: `${idx * 150}ms`,
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-transparent"></div>
                    <div className="relative flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-blue-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border border-white/20 bg-white/10 backdrop-blur-sm text-blue-400">
                        PulseGrid
                      </div>
                    </div>
                    <div className="relative">
                      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {stat.value}
                      </div>
                      <p
                        className={`text-sm sm:text-base mt-1 font-semibold ${
                          theme === "dark" ? "text-slate-200" : "text-blue-100"
                        }`}
                      >
                        {stat.label}
                      </p>
                      <p
                        className={`text-xs sm:text-sm mt-3 leading-relaxed ${
                          theme === "dark" ? "text-slate-400" : "text-blue-200"
                        }`}
                      >
                        {stat.description}
                      </p>
                    </div>
                    <div
                      className={`relative mt-6 h-px bg-gradient-to-r from-transparent to-transparent ${
                        theme === "dark" ? "via-blue-500/60" : "via-blue-400/60"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 animate-fade-in-up animate-delay-300">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 px-4">
              Core Features
            </h2>
            <p
              className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 ${
                theme === "dark" ? "text-slate-300" : "text-blue-100"
              }`}
            >
              Essential monitoring capabilities for tracking and managing your
              infrastructure
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isVisible = visibleCards.has(index);
              const meta = featureDetails[feature.title] || {
                tag: "PulseGrid",
                accent: "from-blue-500/20 via-blue-400/10 to-transparent",
                bullets: ["Enterprise ready", "Secure by default"],
              };
              return (
                <div
                  key={index}
                  ref={(el) => (cardRefs.current[index] = el)}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  className={`group relative overflow-hidden border backdrop-blur-2xl rounded-2xl p-6 sm:p-7 shadow-lg shadow-black/20 feature-card bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 ${
                    isVisible ? "feature-visible" : "feature-hidden"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-transparent"></div>

                  <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-r from-blue-500/30 to-indigo-500/30 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg shadow-blue-500/20">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {feature.title}
                        </h3>
                        <p className="text-xs uppercase tracking-widest text-white/60">
                          {meta.tag}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase border border-white/20 bg-white/10 backdrop-blur-sm text-blue-400">
                        Feature
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-white/80">
                    {feature.description}
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-3">
                    {meta.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex items-center gap-2 text-xs sm:text-sm text-white/70"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live System Status Section */}
        <section className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 animate-fade-in-up animate-delay-300">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-xl border border-white/20 bg-white/10 mb-4 sm:mb-6">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-white/90">
                System Status
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 px-4">
              Live System Status
            </h2>
            <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 text-white/80">
              Real-time monitoring of PulseGrid infrastructure components
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/30 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm uppercase tracking-widest text-white/60">
                    Platform Health
                  </p>
                  <h3 className="text-3xl font-black text-white mt-1">
                    99.97%
                  </h3>
                  <p className="text-sm text-white/80">Last 30 days</p>
                </div>
                <div className="w-14 h-14 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-blue-400">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "Incident-Free",
                    value: "12 days",
                    icon: CheckCircle2,
                  },
                  {
                    label: "Avg. API Response",
                    value: "320ms",
                    icon: Activity,
                  },
                  { label: "Automations Triggered", value: "48", icon: Zap },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-blue-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-white/80">
                          {metric.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {metric.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                {
                  name: "API Server",
                  status: systemStatus.api,
                  icon: Server,
                  description: "Backend API",
                },
                {
                  name: "Database",
                  status: systemStatus.database,
                  icon: Database,
                  description: "PostgreSQL",
                },
                {
                  name: "Frontend",
                  status: systemStatus.frontend,
                  icon: Monitor,
                  description: "Web Interface",
                },
              ].map((component, index) => {
                const Icon = component.icon;
                const isOperational = component.status === "operational";
                const componentMeta: Record<
                  string,
                  { region: string; lastChecked: string }
                > = {
                  "API Server": {
                    region: "Global edge",
                    lastChecked: "a few seconds ago",
                  },
                  Database: {
                    region: "us-east-1 primary",
                    lastChecked: "syncing",
                  },
                  Frontend: {
                    region: "Worldwide CDN",
                    lastChecked: "moments ago",
                  },
                };
                const meta = componentMeta[component.name] || {
                  region: "Global",
                  lastChecked: "just now",
                };
                return (
                  <div
                    key={index}
                    className="backdrop-blur-xl rounded-2xl p-6 border border-white/10 bg-white/5 transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-white/10 hover:border-white/20 flex flex-col gap-4 group"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent rounded-2xl pointer-events-none"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-blue-400">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                            {component.name}
                          </h3>
                          <p className="text-xs truncate text-white/60">
                            {component.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {component.status === "checking" ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : isOperational ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide ${
                            isOperational
                              ? "text-emerald-500"
                              : component.status === "checking"
                              ? "text-blue-400"
                              : "text-rose-500"
                          }`}
                        >
                          {component.status === "checking"
                            ? "Checking..."
                            : isOperational
                            ? "Operational"
                            : "Degraded"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-white/70 relative z-10">
                      {isOperational
                        ? "All service-level objectives are currently green across every region."
                        : component.status === "checking"
                        ? "Running diagnostics to verify upstream dependencies."
                        : "We detected latency issues and are rerouting traffic."}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/10 relative z-10">
                      <span>Region: {meta.region}</span>
                      <span>Last check: {meta.lastChecked}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section - Compact */}
        <section className="relative z-[2] w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              How It Works
            </h2>
            <p
              className={`text-sm sm:text-base max-w-xl mx-auto ${
                theme === "dark" ? "text-slate-300" : "text-blue-100"
              }`}
            >
              Three simple steps to get started
            </p>
          </div>

          <div className="relative rounded-2xl p-6 sm:p-8 shadow-lg border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: "01",
                  title: "Add Your Services",
                  description:
                    "Register your URLs, APIs, or IP addresses. We'll start monitoring immediately.",
                },
                {
                  step: "02",
                  title: "Automatic Monitoring",
                  description:
                    "Our system continuously checks your services at configurable intervals with intelligent scheduling.",
                },
                {
                  step: "03",
                  title: "Get Instant Alerts",
                  description:
                    "Receive real-time notifications via email, SMS, or Slack when issues are detected.",
                },
              ].map((item, index) => {
                return (
                  <div
                    key={index}
                    className="relative flex flex-col items-center text-center group"
                  >
                    {/* Step Number */}
                    <div className="flex-shrink-0 relative z-10 mb-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl font-black text-white group-hover:scale-105 group-hover:bg-white/20 group-hover:border-white/30 transition-all duration-300 shadow-sm">
                        {item.step}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-base leading-relaxed text-white/80">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Public API Section */}
        <section className="relative z-[2] w-full py-12 sm:py-16 animate-fade-in-up animate-delay-500">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div
                className={`border rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-xl ${
                  theme === "dark"
                    ? "bg-slate-800/95 border-slate-700/50"
                    : "bg-blue-950/95 border-blue-900/50"
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
                  {/* Left: Content */}
                  <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
                    <div
                      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border ${
                        theme === "dark"
                          ? "bg-slate-700 border-slate-600"
                          : "bg-[#002147] border-blue-900"
                      }`}
                    >
                      <Code
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          theme === "dark" ? "text-blue-400" : "text-blue-300"
                        }`}
                      />
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          theme === "dark" ? "text-slate-200" : "text-blue-100"
                        }`}
                      >
                        Public API
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                      Check Service Status Programmatically
                    </h2>
                    <p
                      className={`text-base sm:text-lg leading-relaxed ${
                        theme === "dark" ? "text-slate-300" : "text-blue-100"
                      }`}
                    >
                      Use our free public API to check service availability
                      before integration. Perfect for payment gateways,
                      third-party APIs, or any external dependency.
                    </p>
                    <div className="space-y-2 sm:space-y-3">
                      <div
                        className={`flex items-center gap-2 sm:gap-3 ${
                          theme === "dark" ? "text-slate-300" : "text-blue-100"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                            theme === "dark" ? "text-blue-400" : "text-blue-300"
                          }`}
                        />
                        <span className="text-xs sm:text-sm">
                          No authentication required
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 sm:gap-3 ${
                          theme === "dark" ? "text-slate-300" : "text-blue-100"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                            theme === "dark" ? "text-blue-400" : "text-blue-300"
                          }`}
                        />
                        <span className="text-xs sm:text-sm">
                          60 requests/minute rate limit
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 sm:gap-3 ${
                          theme === "dark" ? "text-slate-300" : "text-blue-100"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                            theme === "dark" ? "text-blue-400" : "text-blue-300"
                          }`}
                        />
                        <span className="text-xs sm:text-sm">
                          30-second caching for performance
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs sm:text-sm text-amber-200 leading-relaxed">
                        <strong>⚠️ Usage Policy:</strong> This API is for
                        legitimate service health checks only. Abuse may result
                        in IP blocking. See{" "}
                        <Link
                          to="/terms"
                          className="underline hover:text-amber-100 transition-colors"
                        >
                          Terms of Service
                        </Link>{" "}
                        for details.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-2">
                      <Link
                        to="/docs#publicAPI"
                        className="group inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#002147] to-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg hover:from-[#003366] hover:to-blue-900 transition-all"
                      >
                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>View API Docs</span>
                      </Link>
                      <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-white text-xs sm:text-sm font-medium rounded-lg transition-all border ${
                          theme === "dark"
                            ? "bg-slate-700 hover:bg-slate-600 border-slate-600"
                            : "bg-[#002147] hover:bg-blue-900 border-blue-900"
                        }`}
                      >
                        <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>View on GitHub</span>
                      </a>
                    </div>
                  </div>

                  {/* Right: Code Example */}
                  <div className="relative order-1 lg:order-2">
                    <div className="bg-gray-900 border border-gray-300/30 rounded-xl overflow-hidden shadow-2xl">
                      <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="flex gap-1 sm:gap-1.5">
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5f56]"></div>
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#27c93f]"></div>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-400 font-mono ml-1 sm:ml-2">
                            example.js
                          </span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <pre className="text-[10px] sm:text-xs text-gray-100 font-mono leading-relaxed sm:leading-normal overflow-x-auto">
                          <code>{`const response = await fetch(
  'https://api.pulsegrid.com/api/v1/public/status?url=https://api.paystack.com'
);
const data = await response.json();

if (data.status === 'up') {
  // Service is available
  showPaymentOption('Paystack');
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Diagram Section */}
        <section className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 px-4">
              Architecture
            </h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto px-4 text-white/60">
              Built on AWS with modern DevOps practices
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10">
              {/* Architecture Flow - Simple Circular Design */}
              <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
                {[
                  {
                    icon: Monitor,
                    label: "Frontend",
                    tech: "React + TypeScript",
                    deploy: "AWS S3 + CloudFront",
                    gradient:
                      "from-[#002147]/30 via-blue-800/20 to-[#002147]/30",
                    iconBg: "from-[#002147] to-blue-800",
                    iconColor: "text-blue-200",
                    borderColor: "border-blue-600/40",
                  },
                  {
                    icon: Server,
                    label: "Backend",
                    tech: "Go (Gin)",
                    deploy: "AWS ECS Fargate",
                    gradient:
                      "from-[#002147]/30 via-blue-800/20 to-[#002147]/30",
                    iconBg: "from-[#002147] to-blue-800",
                    iconColor: "text-blue-200",
                    borderColor: "border-blue-600/40",
                  },
                  {
                    icon: Database,
                    label: "Database",
                    tech: "PostgreSQL 14",
                    deploy: "AWS RDS",
                    gradient:
                      "from-[#002147]/30 via-blue-800/20 to-[#002147]/30",
                    iconBg: "from-[#002147] to-blue-800",
                    iconColor: "text-blue-200",
                    borderColor: "border-blue-600/40",
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center group">
                      <div className="flex flex-col items-center gap-4 relative">
                        {/* Glow effect */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
                        ></div>

                        {/* Circular Icon */}
                        <div
                          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 ${item.borderColor} bg-gradient-to-br ${item.iconBg} backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}
                        >
                          <Icon
                            className={`w-10 h-10 sm:w-12 sm:h-12 ${item.iconColor}`}
                          />
                        </div>

                        {/* Label */}
                        <h3 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors duration-300">
                          {item.label}
                        </h3>

                        {/* Tech Info */}
                        <div className="text-center space-y-1">
                          <div className="text-sm text-white/70 font-medium">
                            {item.tech}
                          </div>
                          <div className="text-xs text-white/50">
                            {item.deploy}
                          </div>
                        </div>
                      </div>
                      {idx < 2 && (
                        <ArrowRight className="w-5 h-5 text-white/30 hidden lg:block mx-8 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Additional Info */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                  <div className="text-center group">
                    <div className="text-xl font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                      99.9%
                    </div>
                    <div className="text-xs text-white/50">Uptime SLA</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-xl font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                      Auto-Scale
                    </div>
                    <div className="text-xs text-white/50">
                      Dynamic Resources
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="text-xl font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                      Global CDN
                    </div>
                    <div className="text-xs text-white/50">
                      Edge Distribution
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-[2] w-full border-t border-white/10 mt-12 sm:mt-16 lg:mt-20 animate-fade-in animate-delay-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
              {/* Brand */}
              <div className="col-span-1 sm:col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#002147] to-blue-800">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <span className="text-white text-lg sm:text-xl font-bold">
                    PulseGrid
                  </span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Infrastructure monitoring made simple. Track uptime,
                  performance, and health of your services.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                  Product
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/docs"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Get Started
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      How It Works
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                  Company
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/about"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/docs#contact"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                  Support
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/docs#contact"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/docs"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacy"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-white/50 text-xs sm:text-sm text-center sm:text-left">
                © {new Date().getFullYear()} PulseGrid. All rights reserved.
              </div>
              <div className="text-white/50 text-xs sm:text-sm">
                Developed by{" "}
                <span className="text-white font-medium">Thedevlake</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
