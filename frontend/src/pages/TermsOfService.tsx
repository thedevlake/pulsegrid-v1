import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useThemeStore } from "../store/themeStore";
import PublicNav from "../components/PublicNav";

export default function TermsOfService() {
  const { theme } = useThemeStore();

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-800/20 border border-blue-800/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Terms of Service
              </h1>
            </div>
            <p className="text-white/60 text-sm">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-white/70 leading-relaxed">
                By accessing and using PulseGrid ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                2. Description of Service
              </h2>
              <p className="text-white/70 leading-relaxed">
                PulseGrid is an infrastructure monitoring platform that provides real-time health checks, alerts, and analytics for your services. The Service monitors HTTP/HTTPS endpoints, TCP services, and ICMP targets to track uptime, latency, and performance metrics.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                3. User Accounts
              </h2>
              <div className="space-y-3 text-white/70">
                <p>To use PulseGrid, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and update your account information to keep it accurate</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Be at least 18 years old</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                4. Acceptable Use
              </h2>
              <p className="text-white/70 leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="space-y-2 text-white/70 list-disc list-inside">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction while using the Service</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Use the Service to monitor services you do not own or have permission to monitor</li>
                <li>Abuse, harass, or harm other users or third parties</li>
                <li>Transmit any viruses, malware, or malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                5. Public API Usage
              </h2>
              <div className="space-y-3 text-white/70">
                <p className="leading-relaxed">
                  The Public API endpoint (`/api/v1/public/status`) is provided for legitimate service health checking purposes only. By using the Public API, you agree to the following:
                </p>
                <div className="space-y-2">
                  <p className="font-medium text-white">Allowed Uses:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Checking services you own or have explicit permission to monitor</li>
                    <li>Validating third-party API availability before integration</li>
                    <li>Payment gateway selection and health verification</li>
                    <li>Pre-flight checks before critical operations</li>
                  </ul>
                </div>
                <div className="space-y-2 mt-4">
                  <p className="font-medium text-white">Prohibited Uses:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Automated monitoring of services you don't own (use authenticated API instead)</li>
                    <li>Attempting to bypass rate limits (60 requests/minute per IP)</li>
                    <li>Using the API for DDoS attacks, scraping, or bulk data collection</li>
                    <li>Monitoring internal/private services (blocked by design)</li>
                    <li>Any illegal or unauthorized activities</li>
                  </ul>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm leading-relaxed">
                    <strong>Consequences of Misuse:</strong> Violations may result in IP blocking, permanent API access revocation, and legal action for severe violations. We reserve the right to monitor and log all API usage.
                  </p>
                </div>
                <p className="text-sm mt-3 leading-relaxed">
                  For production monitoring, please use the authenticated API with proper service registration. See our <Link to="/docs#publicAPI" className="text-blue-400 hover:text-blue-300 underline">API Documentation</Link> for more details.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                6. Service Availability
              </h2>
              <p className="text-white/70 leading-relaxed">
                We strive to maintain high availability but do not guarantee uninterrupted or error-free service. The Service may be temporarily unavailable due to maintenance, updates, or unforeseen circumstances. We are not liable for any damages resulting from Service unavailability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                7. Data and Content
              </h2>
              <div className="space-y-3 text-white/70">
                <p>You retain ownership of all data and content you submit to the Service. By using PulseGrid, you grant us a license to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Store, process, and display your data to provide the Service</li>
                  <li>Use aggregated, anonymized data for platform improvement and analytics</li>
                </ul>
                <p className="mt-3">You are responsible for ensuring you have the right to monitor any services you add to the platform.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-white/70 leading-relaxed">
                PulseGrid is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                9. Account Termination
              </h2>
              <p className="text-white/70 leading-relaxed mb-3">
                We reserve the right to suspend or terminate your account at any time, with or without notice, for:
              </p>
              <ul className="space-y-2 text-white/70 list-disc list-inside">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Non-payment (if applicable)</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-3">
                You may terminate your account at any time by contacting us or using account deletion features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                10. Intellectual Property
              </h2>
              <p className="text-white/70 leading-relaxed">
                The Service, including its design, features, and functionality, is owned by PulseGrid and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                11. Changes to Terms
              </h2>
              <p className="text-white/70 leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. We will notify users of material changes via email or platform notification. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                11. Governing Law
              </h2>
              <p className="text-white/70 leading-relaxed">
                These Terms of Service are governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                12. Contact Information
              </h2>
              <p className="text-white/70 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:sofia.devx@gmail.com" className="text-blue-400 hover:text-blue-300 underline">
                  sofia.devx@gmail.com
                </a>
                {" "}or visit our{" "}
                <Link to="/docs#contact" className="text-blue-400 hover:text-blue-300 underline">
                  Contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

