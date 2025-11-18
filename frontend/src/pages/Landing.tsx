import { Link } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";
import Particles from "../components/Particles";
import ThemeToggle from "../components/ThemeToggle";
import PageTransition from "../components/PageTransition";
import {
  Activity,
  Shield,
  Zap,
  Bell,
  BarChart3,
  Globe,
  ArrowRight,
  Server,
  TrendingUp,
  Users,
  Cloud,
  Lock,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Landing() {
  const { theme } = useThemeStore();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  const features = [
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description:
        "Continuous health checks track uptime, latency, and performance metrics.",
      color: "from-blue-500/20 to-blue-600/20",
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      description:
        "Instant notifications via email, SMS, or Slack when issues are detected.",
      color: "from-indigo-500/20 to-indigo-600/20",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description:
        "Visualize trends, export reports, and leverage AI-powered predictions.",
      color: "from-blue-500/20 to-indigo-500/20",
    },
    {
      icon: Shield,
      title: "Multi-Tenant Security",
      description:
        "Enterprise-grade data isolation ensures your organization's privacy.",
      color: "from-indigo-500/20 to-blue-600/20",
    },
    {
      icon: Globe,
      title: "Multi-Protocol Support",
      description:
        "Monitor HTTP/HTTPS endpoints, TCP services, and ICMP checks.",
      color: "from-blue-600/20 to-indigo-500/20",
    },
    {
      icon: Cloud,
      title: "Cloud-Native",
      description:
        "Built on AWS with auto-scaling for reliability and performance.",
      color: "from-indigo-600/20 to-blue-500/20",
    },
  ];

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Observe feature cards
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((prev) => new Set(prev).add(index));
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
  }, []);

  // Magnetic hover effect handler
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    const card = cardRefs.current[index];
    if (!card) return;

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
  };

  const handleMouseLeave = (index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;
    card.style.transform =
      "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  };

  return (
    <PageTransition animationType="fade">
      <div
        className={`min-h-screen relative flex flex-col transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950"
            : "bg-gradient-to-b from-black via-slate-950 to-blue-950"
        }`}
      >
        {/* Particles Background - matching Layout */}
        <div className="fixed inset-0 w-full h-full z-[1] pointer-events-none">
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

        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/20 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-blue-600/80 to-indigo-700/80"
                    : "bg-gradient-to-br from-blue-800/80 to-indigo-900/80"
                }`}
              >
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                PulseGrid
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 bg-white/10 backdrop-blur-xl text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-all border border-white/20 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-[2] flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
          <div className="w-full max-w-7xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/80 font-medium">
                Cloud-Native Infrastructure Monitoring
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight animate-slide-up">
              Monitor Your Services
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
                With Confidence
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up-delay">
              Track uptime, performance, and health of your web services and
              APIs. Get instant alerts and make data-driven decisions with
              AI-powered insights.
            </p>

            {/* CTA Buttons - Single set */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-delay">
              <Link
                to="/register"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-lg font-semibold rounded-xl hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                <span>Start Monitoring Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white/10 backdrop-blur-xl text-white text-lg font-semibold rounded-xl hover:bg-white/15 transition-all border border-white/20 shadow-sm"
              >
                Sign In
              </Link>
            </div>

            {/* Stats Grid */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            >
              {[
                { value: "99.9%", label: "Uptime Tracking" },
                { value: "<1s", label: "Alert Response" },
                { value: "24/7", label: "Monitoring" },
                { value: "∞", label: "Scalability" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10 group stat-card ${
                    statsVisible ? "stat-visible" : ""
                  }`}
                  style={{
                    animationDelay: `${idx * 150}ms`,
                  }}
                >
                  <div className="text-2xl font-bold text-white mb-2 group-hover:scale-110 transition-transform bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-indigo-500/10 group-hover:to-blue-500/10 transition-all duration-500 -z-10 blur-xl"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Comprehensive monitoring tools designed for modern cloud
              infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isVisible = visibleCards.has(index);
              return (
                <div
                  key={index}
                  ref={(el) => (cardRefs.current[index] = el)}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  className={`group relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all duration-500 hover:bg-white/10 feature-card ${
                    isVisible ? "feature-visible" : "feature-hidden"
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-indigo-500/20 group-hover:to-blue-500/20 transition-all duration-500 -z-10 blur-2xl opacity-0 group-hover:opacity-100"></div>

                  {/* Animated gradient border */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} p-[1px]`}
                    >
                      <div className="h-full w-full rounded-2xl bg-transparent"></div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/10 shadow-lg group-hover:shadow-blue-500/50`}
                    >
                      <Icon className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-indigo-400 group-hover:bg-clip-text transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-white/60 leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>

                  {/* Floating particles effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.2}s`,
                          animationDuration: `${2 + Math.random()}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Get started in minutes with our simple setup process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-600/20" />

            {[
              {
                step: "1",
                icon: Server,
                title: "Add Your Services",
                description:
                  "Register your URLs, APIs, or IP addresses to start monitoring",
              },
              {
                step: "2",
                icon: Activity,
                title: "Automatic Monitoring",
                description:
                  "Our system continuously checks your services at configurable intervals",
              },
              {
                step: "3",
                icon: Bell,
                title: "Get Instant Alerts",
                description:
                  "Receive notifications when issues are detected and stay informed",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="text-center relative how-it-works-card"
                  style={{
                    animationDelay: `${index * 200}ms`,
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-blue-600/20 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-blue-500/0 group-hover:from-blue-500/30 group-hover:via-indigo-500/30 group-hover:to-blue-500/30 transition-all duration-500 animate-pulse-slow"></div>
                    <Icon className="w-10 h-10 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-indigo-400 group-hover:bg-clip-text transition-all duration-300">
                    {item.title}
                  </h3>
                  <p className="text-white/60 group-hover:text-white/80 transition-colors duration-300">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-blue-700/10 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-black text-white mb-6">
                  Why Choose PulseGrid?
                </h2>
                <div className="space-y-4 mb-8">
                  {[
                    "Reduce downtime with proactive monitoring",
                    "Save time with automated health checks",
                    "Improve reliability with instant alerts",
                    "Make informed decisions with detailed analytics",
                  ].map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform border border-blue-400/20">
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-white/80 text-lg">{benefit}</p>
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 transition-all shadow-sm hover:shadow-md"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: TrendingUp,
                    title: "Real-Time",
                    desc: "Analytics Dashboard",
                    color: "text-blue-400",
                  },
                  {
                    icon: Lock,
                    title: "Secure",
                    desc: "Multi-Tenant Architecture",
                    color: "text-indigo-400",
                  },
                  {
                    icon: Users,
                    title: "Team",
                    desc: "Collaboration Ready",
                    color: "text-blue-500",
                  },
                  {
                    icon: Zap,
                    title: "Smart",
                    desc: "AI-Powered Predictions",
                    color: "text-indigo-500",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10 group"
                    >
                      <Icon
                        className={`w-8 h-8 ${item.color} mb-3 group-hover:scale-110 transition-transform`}
                      />
                      <div className="text-2xl font-bold text-white mb-1">
                        {item.title}
                      </div>
                      <div className="text-sm text-white/60">{item.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-[2] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                    : "bg-gradient-to-br from-blue-800 to-indigo-900"
                }`}
              >
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/60 font-medium">PulseGrid</span>
            </div>
            <div className="text-white/40 text-sm">
              © {new Date().getFullYear()} PulseGrid. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
