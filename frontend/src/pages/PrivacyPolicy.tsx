import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import PageTransition from "../components/PageTransition";
import { useThemeStore } from "../store/themeStore";
import PublicNav from "../components/PublicNav";

export default function PrivacyPolicy() {
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
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Privacy Policy
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
                1. Introduction
              </h2>
              <p className="text-white/70 leading-relaxed">
                PulseGrid ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our infrastructure monitoring platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                2. Information We Collect
              </h2>
              <div className="space-y-3 text-white/70">
                <p><strong className="text-white">Account Information:</strong> When you register, we collect your name, email address, and organization details.</p>
                <p><strong className="text-white">Service Data:</strong> We collect and monitor the URLs, endpoints, and health check data for services you add to PulseGrid.</p>
                <p><strong className="text-white">Usage Data:</strong> We automatically collect information about how you interact with our platform, including access times, pages viewed, and features used.</p>
                <p><strong className="text-white">Technical Data:</strong> We collect IP addresses, browser type, device information, and other technical data necessary for platform operation.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                3. How We Use Your Information
              </h2>
              <ul className="space-y-2 text-white/70 list-disc list-inside">
                <li>To provide, maintain, and improve our monitoring services</li>
                <li>To send you alerts and notifications about your services</li>
                <li>To process your requests and respond to your inquiries</li>
                <li>To detect, prevent, and address technical issues</li>
                <li>To comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                4. Data Storage and Security
              </h2>
              <p className="text-white/70 leading-relaxed mb-3">
                Your data is stored securely on AWS infrastructure with encryption at rest and in transit. We implement industry-standard security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="text-white/70 leading-relaxed">
                Health check data is retained for 13 months for monitoring and compliance purposes. You can delete your services and data at any time through the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-white/70 leading-relaxed mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="space-y-2 text-white/70 list-disc list-inside">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or respond to lawful requests</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>With service providers who assist in operating our platform (e.g., AWS, email services)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                6. Your Rights
              </h2>
              <p className="text-white/70 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="space-y-2 text-white/70 list-disc list-inside">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                7. Cookies and Tracking
              </h2>
              <p className="text-white/70 leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences, and analyze platform usage. You can control cookie settings through your browser, though this may affect platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                8. Third-Party Services
              </h2>
              <p className="text-white/70 leading-relaxed">
                Our platform integrates with third-party services (e.g., AWS, email providers, Slack) for functionality. These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-white/70 leading-relaxed">
                PulseGrid is not intended for users under the age of 18. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-white/70 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                11. Contact Us
              </h2>
              <p className="text-white/70 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
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

