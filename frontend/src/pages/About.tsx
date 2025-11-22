import { Link } from "react-router-dom";
import { Info, Activity, Brain, Shield, Zap } from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useThemeStore } from "../store/themeStore";
import PublicNav from "../components/PublicNav";

export default function About() {
  const { theme } = useThemeStore();

  const features = [
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description: "Continuous health checks across HTTP, HTTPS, TCP, and ICMP protocols",
    },
    {
      icon: Brain,
      title: "AI-Powered Predictions",
      description: "Proactive issue detection using machine learning and statistical analysis",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Multi-tenant isolation with role-based access control and data encryption",
    },
    {
      icon: Zap,
      title: "Smart Alerts",
      description: "Multi-channel notifications via email, SMS, and Slack integrations",
    },
  ];

  return (
    <PageTransition animationType="fade">
      <div
        className={`min-h-screen relative transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-b from-gray-950 via-slate-950 to-zinc-950"
            : "bg-gradient-to-b from-black via-slate-950 to-blue-950"
        }`}
      >
        <PublicNav />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-800/20 border border-blue-800/30 flex items-center justify-center">
                <Info className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                About PulseGrid
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Mission Section */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Our Mission
              </h2>
              <p className="text-white/70 leading-relaxed text-lg">
                PulseGrid is a cloud-native infrastructure monitoring platform designed to keep every critical service observable, auditable, and predictable. We empower teams to act with confidence by providing real-time insights, AI-enhanced predictions, and intelligent alerting.
              </p>
            </section>

            {/* What We Do */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                What We Do
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-800/20 border border-blue-800/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-white/60 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Technology Stack */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Technology Stack
              </h2>
              <div className="space-y-4 text-white/70">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Frontend</h3>
                  <p>React, TypeScript, Tailwind CSS, Zustand, React Router</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Backend</h3>
                  <p>Go (Gin Framework), PostgreSQL, JWT Authentication</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Infrastructure</h3>
                  <p>AWS (ECS Fargate, RDS, S3, CloudFront), Docker, Terraform</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">AI & Integrations</h3>
                  <p>OpenAI API, AWS SES, AWS SNS, Slack Webhooks</p>
                </div>
              </div>
            </section>

            {/* Enterprise Solution */}
            <section className="bg-blue-800/10 border border-blue-800/20 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Enterprise-Grade Solution
              </h2>
              <p className="text-white/70 leading-relaxed mb-4">
                PulseGrid is a production-ready, full-stack cloud-native web application demonstrating enterprise-grade software engineering, modern web development practices, cloud architecture, and DevOps principles. It showcases:
              </p>
              <ul className="space-y-2 text-white/70 list-disc list-inside">
                <li>Full-stack development with React and Go</li>
                <li>Cloud-native architecture on AWS</li>
                <li>Real-time monitoring and alerting systems</li>
                <li>AI integration for predictive analytics</li>
                <li>Multi-tenant SaaS architecture</li>
                <li>DevOps and infrastructure as code</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-4">
                Developed by{" "}
                <span className="text-white font-medium">Thedevlake</span> as a demonstration of production-ready software development skills.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-800 via-blue-800 to-blue-900 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-800/50"
              >
                Get Started with PulseGrid
              </Link>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

