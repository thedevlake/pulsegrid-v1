import React, {
  useMemo,
  useEffect,
  useState,
  useRef,
  lazy,
  Suspense,
} from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  Layers,
  Server,
  LineChart,
  Shield,
  Users,
  Bell,
  CheckCircle2,
  BookOpen,
  Brain,
  Database,
  LifeBuoy,
  Mail,
  Activity,
  LogIn,
  UserPlus,
  Home,
  Github,
  Code,
  Copy,
  Check,
  Search,
  X,
} from "lucide-react";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import ThemeToggle from "../components/ThemeToggle";
import PageTransition from "../components/PageTransition";

const Particles = lazy(() => import("../components/Particles"));

const sectionIcons: Record<string, React.ElementType | undefined> = {
  overview: Compass,
  onboarding: Layers,
  services: Server,
  observability: LineChart,
  security: Shield,
  roles: Users,
  alerts: Bell,
  bestPractices: CheckCircle2,
  predictions: Brain,
  reports: Database,
  publicAPI: Code,
  support: LifeBuoy,
  contact: Mail,
};

const sections = [
  {
    id: "overview",
    title: "Platform Overview",
    summary:
      "PulseGrid is a cloud-native infrastructure monitoring platform that keeps every critical service observable, auditable, and predictable so your teams can act with confidence.",
    bullets: [
      "Real-time monitoring across HTTP, HTTPS, TCP, and ICMP protocols",
      "AI-enhanced predictions for proactive incident mitigation",
      "Multi-tenant isolation with granular role-based access control",
      "Unified alerting through email, SMS, and Slack integrations",
      "Enterprise-grade security with data encryption at rest and in transit",
      "Cloud-native architecture built on AWS with auto-scaling capabilities",
    ],
    details: [
      "Monitor any website, API, or server by simply adding its URL. PulseGrid automatically checks it regularly and alerts you if something goes wrong.",
      "Get instant notifications via email, SMS, or Slack when your services have issues, so you can fix problems before your users notice.",
      "View beautiful dashboards that show you at a glance which services are healthy and which need attention, with charts showing trends over time.",
      "AI-powered predictions analyze your service patterns and warn you about potential issues before they become real problems.",
      "All your data is securely stored and encrypted. Each organization's data is completely separate for privacy and security.",
      "Export reports anytime to share with your team, track uptime for SLAs, or keep records for compliance purposes.",
    ],
  },
  {
    id: "onboarding",
    title: "Getting Started",
    summary:
      "Complete onboarding guide to get your team up and running with PulseGrid in under 45 minutes.",
    bullets: [
      "Create an organization account and invite your core team members",
      "Add your first service with baseline health check configuration",
      "Configure alert policies, escalation contacts, and notification channels",
      "Validate end-to-end alerting flow with a test service",
      "Set up service tags and grouping for better organization",
      "Review dashboard metrics and customize your monitoring intervals",
    ],
    details: [
      "Sign up for an account and create your organization. This takes just a few minutes and you'll be ready to start monitoring.",
      "Add your first service by clicking 'Add Service' on the Services page. Enter a name and URL - that's it! PulseGrid will start monitoring immediately.",
      "Set up alerts by going to Alert Subscriptions and adding your email, phone number, or Slack webhook. You'll get notified instantly when issues occur.",
      "Test everything works by clicking the play button (▶️) next to your service to run a health check. You should see it show as 'up' if everything is working.",
      "Invite your team members from the Admin page (if you're an admin). They can help monitor services and respond to alerts.",
      "Start simple - add one or two critical services first to get familiar with how PulseGrid works, then add more as you get comfortable.",
    ],
  },
  {
    id: "services",
    title: "Service Management",
    summary:
      "Comprehensive guide to registering, configuring, and managing services in PulseGrid.",
    bullets: [
      "Register HTTP/HTTPS endpoints, TCP services, and ICMP ping targets",
      "Configure custom check intervals (minimum 30 seconds)",
      "Set expected status codes and latency thresholds",
      "Organize services with tags and custom metadata",
      "Enable or disable monitoring per service",
      "View detailed health check history and response metrics",
    ],
    details: [
      "To add a service, click 'Add Service' on the Services page, fill in the name and URL, and choose the service type (HTTP for websites, TCP for ports, Ping for connectivity tests).",
      "Check interval determines how often PulseGrid checks your service. Use 60 seconds for critical services, or longer intervals (like 300 seconds) for less critical ones.",
      "Latency threshold lets you set a maximum acceptable response time. If your service responds slower than this, you'll get an alert even if it's technically 'up'.",
      "After adding a service, click the play button (▶️) to run an immediate health check and verify it's working correctly.",
      "View detailed health check history by clicking on any service name to see response times, status codes, and trends over time.",
      "Export reports by visiting a service's detail page and using the export options to download CSV or PDF reports for your records.",
    ],
  },
  {
    id: "observability",
    title: "Observability & Analytics",
    summary:
      "Real-time dashboards, metrics, and insights to understand your infrastructure health at a glance.",
    bullets: [
      "Real-time dashboard with live service status indicators",
      "Historical trend analysis with interactive charts",
      "Uptime percentage calculations and SLA tracking",
      "Response time percentiles (p50, p95, p99)",
      "Service health score based on multiple factors",
      "Export reports in CSV or PDF format",
    ],
    details: [
      "The Dashboard page shows all your services at a glance with color-coded status indicators (green for up, red for down, yellow for issues).",
      "Click on any service card to see detailed metrics including uptime percentage, average response time, and recent health check history.",
      "Charts show response time trends over time - look for upward trends which might indicate performance degradation.",
      "Service health scores (0-100) give you a quick way to see which services need attention - lower scores mean more issues.",
      "Use the time period selector to view metrics for the last 24 hours, 7 days, or 30 days to spot long-term trends.",
      "The dashboard automatically updates every 30 seconds, so you always see the latest status without refreshing the page.",
    ],
  },
  {
    id: "alerts",
    title: "Alerts & Notifications",
    summary:
      "Configure intelligent alerting with multi-channel notifications and smart deduplication.",
    bullets: [
      "Multi-channel notifications: Email (AWS SES), SMS, and Slack webhooks",
      "Alert deduplication prevents notification spam during incidents",
      "Configurable alert subscriptions per service or organization-wide",
      "Alert resolution tracking with timestamp and resolution notes",
      "Escalation policies for critical services",
      "Alert history and audit trail for compliance",
    ],
    details: [
      "Alerts are automatically created when a service goes down and resolved when it comes back up - no manual configuration needed.",
      "To set up notifications, go to the Alert Subscriptions page and click 'Add Subscription'. Choose your service and notification channel (Email, SMS, or Slack).",
      "For email alerts, enter your email address. You'll receive notifications whenever your subscribed services have issues.",
      "For Slack alerts, you'll need a Slack webhook URL. Get this from your Slack workspace by creating an incoming webhook in your channel settings.",
      "Alert deduplication means you won't get spammed - if a service is down for hours, you'll get one alert when it goes down and one when it recovers.",
      "View all alerts on the Alerts page, where you can see active issues, resolved alerts, and mark alerts as resolved when you've addressed the problem.",
      "You can subscribe to multiple channels for the same service - for example, get email for non-urgent alerts and SMS for critical services.",
    ],
  },
  {
    id: "security",
    title: "Security & Compliance",
    summary:
      "Enterprise-grade security features ensuring data isolation, encryption, and access control.",
    bullets: [
      "Multi-tenant data isolation at the database level",
      "JWT-based authentication with configurable expiration",
      "Role-based access control (RBAC) with granular permissions",
      "HTTPS-only API communication with SSL/TLS encryption",
      "Data encryption at rest in PostgreSQL RDS",
      "Audit logging for all service and user actions",
    ],
    details: [
      "Your organization's data is completely separate from other organizations - you can only see and manage services within your own organization.",
      "All data is encrypted when stored and when transmitted, ensuring your monitoring data remains secure and private.",
      "User roles determine what you can do: Regular users can manage services and view dashboards, Admins can also invite users and manage organization settings.",
      "Your login session stays active for 24 hours - if you're inactive for longer, you'll need to log in again for security.",
      "All actions are logged with timestamps, so you have a complete audit trail of who did what and when.",
      "Passwords are securely hashed and never stored in plain text, following industry best practices for security.",
    ],
  },
  {
    id: "roles",
    title: "User Roles & Permissions",
    summary:
      "Understanding role-based access control and permission levels in PulseGrid.",
    bullets: [
      "Super Admin: Full system access including user and organization management",
      "Admin: Organization-level management with user invitation capabilities",
      "User: Standard access to services, alerts, and dashboards within their organization",
      "Role-based service visibility and modification permissions",
      "Organization-scoped data access enforced at API level",
    ],
    details: [
      "Regular Users can add services, view dashboards, set up alerts, and manage their own services. This is the default role for most team members.",
      "Admins have all user permissions plus the ability to invite new users to the organization, manage all services (not just their own), and access the Admin panel.",
      "Super Admins can create new organizations and manage users across all organizations. This role is typically for platform administrators.",
      "To invite users, go to the Admin page (visible only to Admins) and click 'Invite User'. Enter their email and choose their role.",
      "Role permissions are automatic - you don't need to configure anything. Just assign the role when inviting users.",
      "If you need to change a user's role, contact your organization's admin or super admin who can update it from the Admin panel.",
    ],
  },
  {
    id: "predictions",
    title: "AI Predictions",
    summary:
      "Get proactive insights about potential service issues before they become problems.",
    bullets: [
      "AI analyzes historical health check patterns to predict potential issues",
      "Risk levels: Low, Medium, High, and Critical based on service health trends",
      "Confidence scores show how certain the AI is about each prediction",
      "Actionable recommendations tell you exactly what to do",
      "Time windows indicate when issues might occur",
      "Only shows predictions for services with enough historical data",
    ],
    details: [
      "The Predictions page shows AI-generated insights for services that might have issues soon. It analyzes patterns in your health check data.",
      "Predictions require at least 10 health checks per service to work accurately. The more data, the better the predictions.",
      "Risk levels help you prioritize: Critical means immediate action needed, High means soon, Medium means watch closely, Low means everything looks good.",
      "Each prediction includes a 'Predicted Issue' (what might go wrong), 'Reason' (why the AI thinks this), and 'Recommended Action' (what you should do).",
      "Click on any service name in a prediction to go directly to that service's detail page for more information.",
      "Predictions update automatically as new health check data comes in, so check back regularly for the latest insights.",
      "If you don't see any predictions, it means all your services are healthy - which is a good thing!",
    ],
  },
  {
    id: "reports",
    title: "Reports & Exports",
    summary:
      "Export your monitoring data for analysis, compliance, or sharing with stakeholders.",
    bullets: [
      "Export service health data as CSV files for spreadsheet analysis",
      "Generate PDF reports for presentations and documentation",
      "Include historical data for any time period you choose",
      "Export individual service reports or organization-wide summaries",
      "Use reports for compliance audits and SLA tracking",
      "Share reports with team members or stakeholders",
    ],
    details: [
      "To export a service report, go to the Service Detail page and look for the export options. You can choose CSV (for Excel/spreadsheets) or PDF (for documents).",
      "CSV exports include all health check data with timestamps, response times, status codes, and error messages - perfect for data analysis.",
      "PDF reports are formatted nicely for presentations and include charts, uptime statistics, and summary information.",
      "Reports include data for the time period you're currently viewing on the service detail page, so adjust the time range before exporting if needed.",
      "Use reports to track SLA compliance, demonstrate uptime to stakeholders, or analyze trends over time in spreadsheet software.",
      "Export reports regularly (weekly or monthly) to maintain historical records and compliance documentation.",
    ],
  },
  {
    id: "publicAPI",
    title: "Public API",
    summary:
      "Programmatically check service availability before integration. No authentication required.",
    bullets: [
      "Single endpoint: GET /api/v1/public/status?url={target}",
      "Real-time status checks with response time metrics",
      "30-second caching for optimal performance",
      "60 requests/minute rate limit per IP",
      "Built-in security: HTTP/HTTPS only, SSRF protection",
    ],
    details: [
      "Check external service availability before making critical API calls. Perfect for payment gateway selection, third-party API validation, or dependency health checks.",
      "Endpoint: GET /api/v1/public/status?url=https://api.example.com",
      "Returns JSON with status (up/down), response time (ms), HTTP status code, and error details.",
      "Use case: Filter available payment gateways before showing options to users, ensuring only working services are presented.",
    ],
  },
  {
    id: "bestPractices",
    title: "Best Practices & Recommendations",
    summary:
      "Proven patterns and recommendations for effective infrastructure monitoring.",
    bullets: [
      "Start with critical services and gradually expand coverage",
      "Set realistic check intervals based on service criticality",
      "Configure latency thresholds based on historical performance",
      "Use tags for service organization and filtering",
      "Implement alert escalation policies for 24/7 operations",
      "Regular review of alert subscriptions to prevent fatigue",
      "Export and archive reports for compliance requirements",
    ],
    details: [
      "Start with your most important services - the ones that directly impact your customers or business operations. Add less critical services later.",
      "Set check intervals based on how critical each service is: 60 seconds for must-always-work services, 5 minutes (300 seconds) for less critical ones.",
      "Use clear, descriptive names for your services. Include the environment (like 'Production API' or 'Staging Database') so you know what you're looking at.",
      "Set latency thresholds based on what's normal for your service. If it usually responds in 200ms, set the threshold to 500ms to catch slowdowns.",
      "Review your dashboard weekly to spot trends. Are response times getting slower? Are there patterns in when services go down?",
      "Set up alerts for all critical services, but use different channels: Email for non-urgent, SMS for critical, Slack for team coordination.",
      "When you resolve an alert, add notes about what caused it and how you fixed it. This helps prevent the same issue in the future.",
      "Export reports monthly to track your uptime and have records for compliance or showing stakeholders your service reliability.",
      "Don't monitor everything at once - start with 3-5 critical services, get comfortable with the platform, then expand gradually.",
      "Check your Predictions page regularly. The AI can spot issues before they become problems, giving you time to prevent downtime.",
    ],
  },
  {
    id: "support",
    title: "Support & Troubleshooting",
    summary:
      "Common issues, troubleshooting steps, and getting help when you need it.",
    bullets: [
      "Check service health status and recent health check history",
      "Verify alert subscription configuration and channel settings",
      "Review API response codes and error messages",
      "Validate JWT token expiration and refresh if needed",
      "Check database connectivity for health check scheduler",
      "Review application logs for detailed error information",
    ],
    details: [
      "Service shows as 'down' but it's actually working: Check that the URL is correct and accessible from the internet. Try clicking the play button (▶️) to run a manual health check.",
      "Not receiving email alerts: Verify your email address is correct in Alert Subscriptions. Check your spam folder. Make sure the service actually went down (not just a temporary glitch).",
      "Can't see predictions: You need at least 10 health checks per service. Click the play button multiple times on your services to generate data, or wait for the automatic checks to accumulate.",
      "Dashboard not updating: The dashboard refreshes every 30 seconds automatically. If it seems stuck, try refreshing the page. Check your internet connection.",
      "Can't add a service: Make sure you're entering a valid URL (include http:// or https:// for web services). For TCP services, use format 'hostname:port'. Check that you have permission to add services.",
      "Service detail page shows no data: Health checks need time to accumulate. Click the play button to trigger immediate checks, or wait a few minutes for automatic checks to run.",
      "Alerts page is empty: This is normal if all your services are healthy! Alerts only appear when services have issues. You can also check resolved alerts to see past incidents.",
      "Need more help: Check that your backend server is running. If you're still having issues, contact your organization's admin or check the system status.",
    ],
  },
  {
    id: "contact",
    title: "Contact & Support",
    summary:
      "Get in touch with our team for questions, feedback, or support requests.",
    bullets: [
      "Email support for direct communication",
      "Response time: We aim to respond within 24-48 hours",
      "Report bugs or suggest new features",
      "Get help with setup and configuration",
      "Request custom integrations or enterprise features",
    ],
    details: [
      "Send us an email directly using the contact information below. Include as much detail as possible so we can help you quickly.",
      "For urgent issues affecting your production services, please mark your message as 'Urgent' in the subject line.",
      "We welcome feedback and feature requests! If you have ideas to improve PulseGrid, we'd love to hear from you.",
      "For technical questions about API integration or advanced configuration, include your use case and we'll provide detailed guidance.",
      "Enterprise customers can request custom integrations, dedicated support, or additional features tailored to their needs.",
      "Check the documentation sections above first - many common questions are answered in our guides.",
    ],
  },
];

const CONTACT_EMAIL = "sofia.devx@gmail.com";
const GITHUB_URL = "https://github.com/thedevlake/PULSEGRID-V1";

export default function Docs() {
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const location = useLocation();
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [isInPublicAPISection, setIsInPublicAPISection] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setParticlesLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      isInitialLoadRef.current = true;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (token) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY =
            window.scrollY ||
            window.pageYOffset ||
            document.documentElement.scrollTop;

          const codeSnippets = document.querySelectorAll(
            ".code-editor-container"
          );
          let isOverCode = false;

          codeSnippets.forEach((snippet) => {
            const rect = snippet.getBoundingClientRect();
            const headerHeight = 100;
            if (rect.top < headerHeight && rect.bottom > 0) {
              isOverCode = true;
            }
          });

          const publicAPISection = document.getElementById("publicAPI");
          let isInPublicAPI = false;
          if (publicAPISection) {
            const rect = publicAPISection.getBoundingClientRect();
            if (rect.top < 150 && rect.bottom > 0) {
              isInPublicAPI = true;
            }
          }
          setIsInPublicAPISection(isInPublicAPI);

          const shouldChange = scrollY > 50 || isOverCode || isInPublicAPI;
          setHeaderScrolled((prev) => {
            if (prev !== shouldChange) {
              return shouldChange;
            }
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  const CodeEditor = ({
    code,
    language,
    filename,
  }: {
    code: string;
    language: string;
    filename?: string;
  }) => {
    const lines = code.split("\n");
    const codeId = `${language}-${filename || "code"}`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCode(codeId);
        setTimeout(() => setCopiedCode(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    };

    const isDark = theme === "dark";

    return (
      <div
        className={`code-editor-container ${
          isDark ? "bg-[#0d1117]" : "bg-[#faf9f7]"
        } border ${
          isDark ? "border-white/10" : "border-gray-200"
        } rounded-lg overflow-hidden shadow-lg`}
      >
        {/* Editor Header */}
        <div
          className={`${isDark ? "bg-[#161b22]" : "bg-[#f5f4f2]"} border-b ${
            isDark ? "border-white/10" : "border-gray-200"
          } px-4 py-2.5 flex items-center justify-between`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="flex gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5f56]"></div>
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#27c93f]"></div>
            </div>
            {filename && (
              <span
                className={`text-[10px] sm:text-xs font-mono ml-1 sm:ml-2 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {filename}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-md transition-all ${
              isDark
                ? "text-gray-400 hover:text-white hover:bg-white/10"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {copiedCode === codeId ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="relative overflow-x-auto">
          <div className="flex">
            {/* Line Numbers */}
            <div
              className={`${isDark ? "bg-[#0d1117]" : "bg-[#f5f4f2]"} ${
                isDark ? "text-gray-600" : "text-gray-400"
              } text-right pr-2 sm:pr-3 pl-2 sm:pl-3 py-3 sm:py-4 font-mono text-[10px] sm:text-xs select-none border-r ${
                isDark ? "border-white/5" : "border-gray-200"
              }`}
            >
              {lines.map((_, i) => (
                <div key={i} className="leading-4 sm:leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code */}
            <pre
              className={`flex-1 py-3 sm:py-4 pl-2 sm:pl-4 pr-2 sm:pr-4 m-0 font-mono text-[10px] sm:text-xs leading-4 sm:leading-5 overflow-x-auto ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              <code>
                {lines.map((line, i) => (
                  <div key={i} className="whitespace-pre">
                    {line || " "}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const quickLinks = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        label: section.title,
      })),
    []
  );

  const filteredSections = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return sections;
    }

    const query = debouncedSearchQuery.toLowerCase().trim();
    return sections.filter((section) => {
      if (section.title.toLowerCase().includes(query)) return true;
      if (section.summary.toLowerCase().includes(query)) return true;
      if (
        section.bullets.some((bullet) => bullet.toLowerCase().includes(query))
      )
        return true;
      if (
        section.details.some((detail) => detail.toLowerCase().includes(query))
      )
        return true;
      return false;
    });
  }, [debouncedSearchQuery]);

  const filteredQuickLinks = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return quickLinks;
    }
    return quickLinks.filter((link) =>
      filteredSections.some((section) => section.id === link.id)
    );
  }, [debouncedSearchQuery, quickLinks, filteredSections]);

  useEffect(() => {
    if (debouncedSearchQuery.trim() && filteredSections.length > 0) {
      const timer = setTimeout(() => {
        const firstSection = document.getElementById(filteredSections[0].id);
        if (firstSection) {
          const headerOffset = 120;
          const elementPosition = firstSection.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
          setActiveSection(filteredSections[0].id);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [debouncedSearchQuery, filteredSections]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-500/30 text-yellow-200 rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          const headerOffset = 120;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
          setActiveSection(location.hash.substring(1));
        }
      }, 150);

      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.hash]);

  useEffect(() => {
    if (isNavigating) return;

    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -40% 0px",
      threshold: 0.05,
    };

    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (isNavigatingRef.current) return;

      const currentScrollY = window.scrollY;
      const isUserScrolling = Math.abs(currentScrollY - lastScrollY) > 5;

      if (isUserScrolling) {
        isScrolling = true;
        lastScrollY = currentScrollY;
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isNavigatingRef.current || isNavigating || isScrolling) return;

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        return;
      }

      let bestEntry: IntersectionObserverEntry | null = null;
      let minTopDistance = Infinity;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const rect = entry.boundingClientRect;
          const topDistance = Math.abs(rect.top - 140);

          if (rect.top <= 300 && topDistance < minTopDistance) {
            minTopDistance = topDistance;
            bestEntry = entry;
          }
        }
      });

      if (bestEntry !== null) {
        const target = (bestEntry as IntersectionObserverEntry)
          .target as Element;
        if (
          target instanceof HTMLElement &&
          target.id &&
          target.id !== activeSection
        ) {
          setActiveSection(target.id);
        }
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    quickLinks.forEach((link) => {
      const section = document.getElementById(link.id);
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [quickLinks, isNavigating, activeSection]);

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      setIsNavigating(true);
      isNavigatingRef.current = true;
      setActiveSection(id);
      window.history.replaceState(null, "", `#${id}`);

      const headerOffset = 120;
      const rect = el.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const targetPosition = rect.top + scrollTop - headerOffset;

      requestAnimationFrame(() => {
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        setTimeout(() => {
          setTimeout(() => {
            setIsNavigating(false);
            isNavigatingRef.current = false;
          }, 300);
        }, 1500);
      });
    }
  };

  const docsContent = (
    <>
      {/* Particles Background - Only show when not logged in (Layout has its own particles) */}
      {!token && particlesLoaded && (
        <div className="fixed inset-0 w-full h-full z-[1] pointer-events-none">
          <Suspense fallback={null}>
            <Particles
              particleColors={["#ffffff", "#ffffff", "#ffffff"]}
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

      <div
        className={`relative z-10 w-full ${
          token
            ? "pt-0 pb-6 sm:pb-8 md:pb-10 lg:pb-12"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12"
        }`}
        style={{ display: "block", minHeight: "100vh" }}
      >
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-2 ">
              {/* Search Bar */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl mb-4 sm:mt-10">
                <div className="relative ">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${
                      theme === "dark" ? "" : ""
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {debouncedSearchQuery && (
                  <p className="text-xs text-white/50 mt-2">
                    {filteredSections.length} result
                    {filteredSections.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {filteredQuickLinks.map((link) => {
                    const IconComponent: React.ElementType | undefined =
                      sectionIcons[link.id];
                    const isActive = activeSection === link.id;
                    const iconClassName = `w-4 h-4 flex-shrink-0 ${
                      isActive ? "text-blue-400" : "text-white/40"
                    }`;
                    return (
                      <button
                        key={link.id}
                        onClick={() => handleScroll(link.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 group relative ${
                          isActive
                            ? "bg-blue-800/30 text-blue-300 border border-blue-800/50 shadow-lg shadow-blue-800/20"
                            : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full"></div>
                        )}
                        {IconComponent &&
                          React.createElement(IconComponent, {
                            className: iconClassName,
                          })}
                        <span className="truncate">{link.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Mobile Search Bar */}
            <div className="lg:hidden bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xl mt-4 sm:mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {debouncedSearchQuery && (
                <p className="text-xs text-white/50 mt-2">
                  {filteredSections.length} result
                  {filteredSections.length !== 1 ? "s" : ""} found
                </p>
              )}
            </div>

            {/* Hero */}
            <section className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-[0_25px_80px_rgba(15,23,42,0.55)] docs-section">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-blue-800/10 border border-blue-800/20 text-xs sm:text-sm text-blue-200">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    PulseGrid Documentation
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                    Operational Guide & Product Playbook
                  </h1>
                  <p className="text-white/70 text-base sm:text-lg max-w-3xl leading-relaxed">
                    Everything your teams need to onboard, operate, and scale on
                    PulseGrid: onboarding flows, observability patterns, role
                    responsibilities, and proven response rituals.
                  </p>
                </div>
              </div>
            </section>

            {/* Quick navigation */}
            <section
              className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.45)] docs-section"
              style={{ animationDelay: "100ms" }}
            >
              <p className="text-xs sm:text-sm uppercase tracking-widest text-white/60 mb-3 sm:mb-4">
                {debouncedSearchQuery ? "Search Results" : "Jump to"}
              </p>
              {filteredQuickLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {filteredQuickLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleScroll(link.id)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white transition-all"
                    >
                      {debouncedSearchQuery
                        ? highlightText(link.label, debouncedSearchQuery)
                        : link.label}
                    </button>
                  ))}
                </div>
              ) : debouncedSearchQuery ? (
                <div className="text-center py-8">
                  <p className="text-white/50 text-sm">
                    No results found for "{debouncedSearchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : null}
            </section>

            {/* Sections */}
            <section className="space-y-8">
              {filteredSections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/70">
                    No documentation sections found.
                  </p>
                </div>
              ) : (
                <>
                  {filteredSections.map((section, index) => {
                    const IconComponent: React.ElementType | undefined =
                      sectionIcons[section.id];
                    const iconClassName = "w-4 h-4 sm:w-5 sm:h-5";
                    return (
                      <article
                        key={section.id}
                        id={section.id}
                        className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.5)] docs-section"
                        style={{ animationDelay: `${200 + index * 100}ms` }}
                      >
                        <div className="space-y-4 sm:space-y-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
                            <div className="space-y-3 sm:space-y-4 flex-1">
                              <div className="inline-flex items-center gap-2 sm:gap-3 text-white/70">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                                  {IconComponent &&
                                    React.createElement(IconComponent, {
                                      className: iconClassName,
                                    })}
                                </div>
                                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50">
                                  {section.id
                                    .replace(/([A-Z])/g, " $1")
                                    .toUpperCase()}
                                </p>
                              </div>
                              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">
                                {debouncedSearchQuery
                                  ? highlightText(
                                      section.title,
                                      debouncedSearchQuery
                                    )
                                  : section.title}
                              </h2>
                              <p className="text-white/70 text-sm sm:text-base md:text-lg leading-relaxed">
                                {debouncedSearchQuery
                                  ? highlightText(
                                      section.summary,
                                      debouncedSearchQuery
                                    )
                                  : section.summary}
                              </p>
                            </div>
                            <div className="w-full lg:max-w-sm bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50 mb-3 sm:mb-4">
                                Key Actions
                              </p>
                              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-white/80">
                                {section.bullets.map((bullet, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                                    <span>
                                      {debouncedSearchQuery
                                        ? highlightText(
                                            bullet,
                                            debouncedSearchQuery
                                          )
                                        : bullet}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Details Section */}
                          {section.details && section.details.length > 0 && (
                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                              <p className="text-xs sm:text-sm uppercase tracking-widest text-white/50 mb-3 sm:mb-4">
                                Detailed Information
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {section.details.map((detail, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10"
                                  >
                                    <span className="mt-1 block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
                                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                                      {debouncedSearchQuery
                                        ? highlightText(
                                            detail,
                                            debouncedSearchQuery
                                          )
                                        : detail}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Code Examples -  for publicAPI section */}
                          {section.id === "publicAPI" && (
                            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10 ">
                              <div className="mb-6 sm:mb-8">
                                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
                                  <Code className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                                  Code Examples & Use Cases
                                </h3>
                                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                                  Real-world examples showing how to integrate
                                  the Public API into your applications
                                </p>
                              </div>

                              <div className="space-y-4 sm:space-y-6">
                                {/* Basic cURL Example */}
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-400"></span>
                                      Basic Usage (cURL)
                                    </h4>
                                    <p className="text-white/50 text-[10px] sm:text-xs ml-3 sm:ml-4">
                                      Quick test from command line
                                    </p>
                                  </div>
                                  <CodeEditor
                                    code={`curl "https://api.pulsegrid.com/api/v1/public/status?url=https://api.paystack.com"

# Response:
{
  "url": "https://api.paystack.com",
  "status": "up",
  "response_time_ms": 45,
  "status_code": 200,
  "error_message": null,
  "checked_at": "2024-01-15T10:30:00Z",
  "cached": false,
  "service": {
    "name": "PulseGrid",
    "version": "1.0.0",
    "docs": "https://pulsegrid.com/docs#api"
  },
  "usage_note": "This API is for legitimate service health checks only. See /docs#publicAPI for guidelines."
}`}
                                    language="bash"
                                    filename="terminal.sh"
                                  />
                                </div>

                                {/* Payment Gateway Selection */}
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                                      1. Payment Gateway Selection
                                    </h4>
                                    <p className="text-white/50 text-[10px] sm:text-xs ml-3 sm:ml-4">
                                      Check which payment gateways are available
                                      before showing options to users
                                    </p>
                                  </div>
                                  <CodeEditor
                                    code={`// payment-options.js
const PULSEGRID_API = 'https://api.pulsegrid.com/api/v1/public/status';

async function getAvailablePaymentGateways() {
  const gateways = [
    { id: 'paystack', name: 'Paystack', url: 'https://api.paystack.com' },
    { id: 'flutterwave', name: 'Flutterwave', url: 'https://api.flutterwave.com' },
    { id: 'palmpay', name: 'PalmPay', url: 'https://api.palmpay.com' }
  ];

  const checks = await Promise.all(
    gateways.map(async (gateway) => {
      try {
        const response = await fetch(
          \`\${PULSEGRID_API}?url=\${encodeURIComponent(gateway.url)}\`
        );
        const data = await response.json();
        return {
          ...gateway,
          available: data.status === 'up',
          responseTime: data.response_time_ms
        };
      } catch (error) {
        return { ...gateway, available: false };
      }
    })
  );

  return checks.filter(g => g.available);
}
async function showPaymentOptions(orderAmount) {
  const available = await getAvailablePaymentGateways();
  
  if (available.length === 0) {
    return { error: 'Payment services temporarily unavailable' };
  }

  return { options: available.map(g => ({ id: g.id, name: g.name })) };
}`}
                                    language="javascript"
                                    filename="payment-options.js"
                                  />
                                </div>

                                {/* Pre-flight Check */}
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                                      2. Pre-flight Check Before API Calls
                                    </h4>
                                    <p className="text-white/50 text-[10px] sm:text-xs ml-3 sm:ml-4">
                                      Verify service availability before making
                                      critical API requests
                                    </p>
                                  </div>
                                  <CodeEditor
                                    code={`# api_client.py
import requests

PULSEGRID_API = "https://api.pulsegrid.com/api/v1/public/status"

def check_service_before_call(service_url):
    """Check if service is up before making actual API call"""
    try:
        response = requests.get(
            PULSEGRID_API,
            params={"url": service_url},
            timeout=3
        )
        data = response.json()
        return data["status"] == "up"
    except:
        return False

# Usage in your API client
def send_sms_via_aws_sns(phone, message):
    sns_endpoint = "https://sns.us-east-1.amazonaws.com"
    
    # Check if AWS SNS is up first
    if not check_service_before_call(sns_endpoint):
        raise Exception("SMS service is currently unavailable")
    
    # Proceed with actual API call
    # ... your AWS SNS API code here`}
                                    language="python"
                                    filename="api_client.py"
                                  />
                                </div>

                                {/* Service Health Dashboard */}
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                                      3. Service Health Dashboard
                                    </h4>
                                    <p className="text-white/50 text-[10px] sm:text-xs ml-3 sm:ml-4">
                                      Build a status page showing multiple
                                      services at a glance
                                    </p>
                                  </div>
                                  <CodeEditor
                                    code={`// status-dashboard.js
const services = [
  { name: 'Main API', url: 'https://api.mycompany.com' },
  { name: 'Database', url: 'https://db.mycompany.com' },
  { name: 'CDN', url: 'https://cdn.mycompany.com' },
  { name: 'Payment Gateway', url: 'https://api.paystack.com' }
];

async function buildStatusDashboard() {
  const statuses = await Promise.all(
    services.map(async (service) => {
      const response = await fetch(
        \`https://api.pulsegrid.com/api/v1/public/status?url=\${encodeURIComponent(service.url)}\`
      );
      const data = await response.json();
      
      return {
        name: service.name,
        status: data.status,
        responseTime: data.response_time_ms,
        lastChecked: data.checked_at
      };
    })
  );

  statuses.forEach(status => {
    console.log(\`\${status.name}: \${status.status} (\${status.responseTime}ms)\`);
  });
}

setInterval(buildStatusDashboard, 30000);`}
                                    language="javascript"
                                    filename="status-dashboard.js"
                                  />
                                </div>

                                {/* Fallback Service Selection */}
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                                      4. Fallback Service Selection
                                    </h4>
                                    <p className="text-white/50 text-[10px] sm:text-xs ml-3 sm:ml-4">
                                      Automatically switch to backup services
                                      when primary is down
                                    </p>
                                  </div>
                                  <CodeEditor
                                    code={`// service-fallback.js
async function getAvailableService(services) {
  const checks = await Promise.all(
    services.map(async (service) => {
      const response = await fetch(
        \`https://api.pulsegrid.com/api/v1/public/status?url=\${encodeURIComponent(service.url)}\`
      );
      const data = await response.json();
      return {
        ...service,
        available: data.status === 'up',
        responseTime: data.response_time_ms
      };
    })
  );

  const available = checks
    .filter(s => s.available)
    .sort((a, b) => a.responseTime - b.responseTime);

  return available[0] || null;
}
const emailServices = [
  { name: 'AWS SES', url: 'https://email.us-east-1.amazonaws.com' },
  { name: 'SMTP Server', url: 'https://smtp.example.com' }
];

const bestService = await getAvailableService(emailServices);
if (bestService) {
  console.log(\`Using \${bestService.name} for emails\`);
} else {
  console.log('All email services are down!');
}`}
                                    language="javascript"
                                    filename="service-fallback.js"
                                  />
                                </div>

                                {/* Integration Testing */}
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 flex items-center gap-1.5 sm:gap-2">
                                      5. Integration Testing
                                    </h4>
                                    <p className="text-white/50 text-[10px] sm:text-xs ml-3 sm:ml-4">
                                      Skip tests when external dependencies are
                                      unavailable
                                    </p>
                                  </div>
                                  <CodeEditor
                                    code={`# test_setup.py
import requests
import pytest

PULSEGRID_API = "https://api.pulsegrid.com/api/v1/public/status"

def check_dependency(url):
    """Check if external dependency is available"""
    try:
        response = requests.get(
            PULSEGRID_API,
            params={"url": url},
            timeout=3
        )
        data = response.json()
        return data["status"] == "up"
    except:
        return False

@pytest.fixture(scope="session")
def payment_gateway_available():
    """Skip tests if payment gateway is down"""
    if not check_dependency("https://api.paystack.com"):
        pytest.skip("Payment gateway is unavailable")

def test_payment_processing(payment_gateway_available):
    # Your payment test here
    pass`}
                                    language="python"
                                    filename="test_setup.py"
                                  />
                                </div>

                                {/* Response Format */}
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                      Response Format
                                    </h4>
                                    <p className="text-white/50 text-xs ml-4">
                                      Standard JSON response structure
                                    </p>
                                  </div>
                                  <CodeEditor
                                    code={`{
  "url": "https://api.example.com",
  "status": "up" | "down",
  "response_time_ms": 45,
  "status_code": 200,
  "error_message": null,
  "checked_at": "2024-01-15T10:30:00Z",
  "cached": false,
  "service": {
    "name": "PulseGrid",
    "version": "1.0.0",
    "docs": "https://pulsegrid.com/docs#api"
  },
  "usage_note": "This API is for legitimate service health checks only..."
}`}
                                    language="json"
                                    filename="response.json"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Contact Section - Direct Email Contact */}
                          {section.id === "contact" && (
                            <div className="mt-8 pt-6 border-t border-white/10">
                              <div className="max-w-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                  <Mail className="w-5 h-5 text-blue-400" />
                                  <h3 className="text-xl font-semibold text-white">
                                    Get in Touch
                                  </h3>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                                  <p className="text-white/80 mb-6">
                                    Have questions, feedback, or need support?
                                    Send us an email directly and we'll get back
                                    to you as soon as possible.
                                  </p>

                                  <div className="flex flex-col sm:flex-row gap-4">
                                    <a
                                      href={`mailto:${CONTACT_EMAIL}`}
                                      className="inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-800 via-blue-800 to-blue-900 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-800/50"
                                    >
                                      <Mail className="w-5 h-5 mr-2" />
                                      Email Us: {CONTACT_EMAIL}
                                    </a>
                                  </div>

                                  <div className="mt-6 pt-6 border-t border-white/10">
                                    <p className="text-sm text-white/60">
                                      <strong className="text-white/80">
                                        Response Time:
                                      </strong>{" "}
                                      We typically respond within 24-48 hours
                                    </p>
                                    <p className="text-sm text-white/60 mt-2">
                                      <strong className="text-white/80">
                                        For Urgent Issues:
                                      </strong>{" "}
                                      Please include "URGENT" in your subject
                                      line
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );

  if (token) {
    return (
      <div className="w-full relative -mt-6" style={{ zIndex: 10 }}>
        {docsContent}
      </div>
    );
  }

  // Public Docs (not logged in) - render with public navigation
  return (
    <PageTransition animationType="fade">
      <div
        className={`min-h-screen relative transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-950 via-slate-950 to-blue-950/30"
            : "bg-gradient-to-br from-black via-slate-950 to-blue-950/50"
        }`}
      >
        <nav
          className={`sticky top-0 z-[100] w-full backdrop-blur-xl pb-4 sm:pb-6 transition-all duration-300 border-b ${
            theme === "light" && isInPublicAPISection
              ? "bg-slate-900/80 backdrop-blur-xl border-slate-800/50 shadow-lg shadow-black/40"
              : headerScrolled
              ? theme === "dark"
                ? "bg-slate-950/80 backdrop-blur-xl border-slate-800/50 shadow-lg shadow-black/30"
                : "bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-lg shadow-black/40"
              : "bg-slate-950/70 backdrop-blur-xl border-slate-800/30 shadow-lg shadow-black/20"
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
                    theme === "dark" ? "bg-blue-800" : "bg-blue-900"
                  }`}
                >
                  <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                  PulseGrid
                </h1>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Navigation Links */}
                <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-xl">
                  <Link
                    to="/"
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full flex items-center gap-1.5 transition-colors ${
                      location.pathname === "/"
                        ? "text-white bg-blue-800/30 border border-blue-800/50"
                        : "text-white/70 hover:text-white hover:bg-white/10"
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
                        ? "text-white bg-blue-800/30 border border-blue-800/50"
                        : "text-white/70 hover:text-white hover:bg-white/10"
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
                    className="px-3 py-1.5 text-white/70 hover:text-white transition-colors text-xs sm:text-sm font-medium rounded-full flex items-center gap-1.5 hover:bg-white/10"
                    title="GitHub Repository"
                  >
                    <Github className="w-4 h-4" />
                    <span className="hidden md:inline">GitHub</span>
                  </a>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 backdrop-blur-xl shadow-lg">
                  <Link
                    to="/login"
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full flex items-center gap-1 sm:gap-1.5 transition-colors ${
                      location.pathname === "/login"
                        ? "text-white bg-blue-800/30 border border-blue-800/50"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <LogIn className="w-3 h-3" />
                    <span className="hidden xs:inline sm:inline">Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className={`px-2.5 sm:px-5 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-all shadow-lg flex items-center gap-1 sm:gap-1.5 ${
                      location.pathname === "/register"
                        ? "bg-blue-700 text-white"
                        : "bg-blue-800 text-white hover:bg-blue-700"
                    }`}
                  >
                    <UserPlus className="w-3 h-3" />
                    <span className="hidden xs:inline sm:inline">
                      Get Started
                    </span>
                  </Link>
                </div>
                <div className="flex-shrink-0">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </nav>
        {docsContent}
      </div>
    </PageTransition>
  );
}
