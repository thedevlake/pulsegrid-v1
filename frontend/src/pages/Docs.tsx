import { useMemo } from "react";
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
} from "lucide-react";

const sectionIcons: Record<string, React.ElementType> = {
  overview: Compass,
  onboarding: Layers,
  services: Server,
  observability: LineChart,
  security: Shield,
  roles: Users,
  alerts: Bell,
  bestPractices: CheckCircle2,
  dataModel: LineChart,
  automation: Layers,
  support: Users,
};

const sections = [
  {
    id: "overview",
    title: "Platform Overview",
    summary:
      "PulseGrid keeps every critical service observable, auditable, and predictable so your teams can act with confidence.",
    bullets: [
      "Real-time monitoring across HTTP, TCP, and custom endpoints",
      "AI-enhanced predictions for proactive mitigation",
      "Multi-tenant isolation with granular RBAC",
      "Unified alerting through email, SMS, and Slack",
    ],
    details: [
      "Every dataset is timestamped, signed, and retained for 13 months for auditing.",
      "Dashboards refresh every 30s by default; customize per tenant for cost controls.",
    ],
  },
  {
    id: "onboarding",
    title: "Getting Started",
    summary: "Recommended sequence for teams onboarding to PulseGrid.",
    bullets: [
      "Create an organization and invite your core operators.",
      "Add first service with baseline health check schedule.",
      "Define alert policy, escalation contacts, and notification channels.",
      "Validate first alert end-to-end using the sandbox mode.",
    ],
    details: [
      "Average team completes onboarding in under 45 minutes with the guided wizard.",
      "Use the checklist export to prove SOC2 onboarding controls during audits.",
    ],
  },
  {
    id: "services",
    title: "Managing Services",
    summary: "Keep service metadata, probes, and health budgets in sync.",
    bullets: [
      "Service detail view exposes response latency, uptime, and dependency map.",
      "Annotate incidents directly on the service timeline for shared context.",
      "Use versioned configs to roll back a probe change within seconds.",
      "Export snapshots for audits or handovers via the actions menu.",
    ],
    details: [
      "Each service supports up to 12 concurrent health probes covering multiple regions.",
      "Attach internal runbooks or Jira issue links so operators never leave the console.",
    ],
  },
  {
    id: "observability",
    title: "Reading Dashboards & Predictions",
    summary: "Interpret dashboards quickly and move from signal to action.",
    bullets: [
      "Risk gauges combine historical incidents with live anomalies.",
      "Confidence band highlights prediction certainty; wide bands indicate sparse data.",
      "Click any card to drill into raw checks, payload, and correlation IDs.",
      "Download a PDF summary for leadership reviews with one click.",
    ],
    details: [
      "Use the compare toggle to overlay up to four services in a single view.",
      "Confidence bands widen when telemetry is sparse; schedule additional probes to improve signal.",
    ],
  },
  {
    id: "security",
    title: "Security & Isolation",
    summary:
      "Every tenant is logically sealed while super admins maintain global visibility.",
    bullets: [
      "SSO-ready auth with JWT rotation and optional IP allow-list.",
      "Encrypted secrets via AWS Systems Manager; never store API keys in source.",
      "Audit trails capture every mutation with actor metadata.",
      "Service-level RBAC ensures operators only see their own estate.",
    ],
    details: [
      "PulseGrid is deployed inside AWS with encryption at rest (KMS) and in transit (TLS 1.3).",
      "Daily compliance packs (CSV + PDF) are downloadable for regulators and customers.",
    ],
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    summary: "Align responsibilities using the three-tier RBAC model.",
    bullets: [
      "Super Admin: cross-organization governance, IAM, and compliance.",
      "Admin: manages users and services inside their organization.",
      "User: consumes dashboards, acknowledges incidents, exports insights.",
      "Use the admin panel to promote/demote with automatic safety nets.",
    ],
    details: [
      "Role transition emails are logged and optionally mirrored to Slack/SIEM.",
      "Combine roles with feature flags to stage beta capabilities safely.",
    ],
  },
  {
    id: "alerts",
    title: "Operational Playbooks",
    summary:
      "Codify response plans so every alert has a deterministic outcome.",
    bullets: [
      "Tag alerts with severity, impacted customers, and runbooks.",
      "Escalation policies chain teams with cooldown windows.",
      "Incident timeline auto-captures chat transcripts when linked to Slack.",
      "Close-loop review templates ensure every major event is documented.",
    ],
    details: [
      "Override schedules temporarily with maintenance windows to suppress noise.",
      "Leverage auto-acknowledge rules for low-risk alerts during off-hours.",
    ],
  },
  {
    id: "bestPractices",
    title: "Best Practices",
    summary: "What high-performing teams do with PulseGrid every day.",
    bullets: [
      "Run weekly service health reviews; export snapshots to the wiki.",
      "Keep sandbox services to validate alert channels without noise.",
      "Automate onboarding with the public API and Terraform module.",
      "Mirror docs to customers by repurposing markdown exports.",
    ],
    details: [
      "Schedule quarterly game days and use the PulseGrid chaos toolkit to rehearse.",
      "Instrument custom dimensions (region, customer tier) to segment health views.",
    ],
  },
  {
    id: "dataModel",
    title: "Service Data & Metrics Reference",
    summary:
      "Standard definitions so engineering, ops, and business teams stay aligned.",
    bullets: [
      "Uptime (%): percent of successful checks over a rolling window (default 30 days).",
      "Latency (p50/p95/p99): measured from probe to response; includes network jitter.",
      "Health Budget: allowable downtime per SLA tier; pulses red when < 20% remaining.",
      "Prediction Risk: 0–100 score combining anomaly weight, regression slope, and incident density.",
    ],
    details: [
      "All metrics are exportable via API (`/v1/metrics/:serviceId`) and CSV.",
      "Use the metric designer to add derived KPIs such as ErrorBudgetBurn or CustomerImpactScore.",
    ],
  },
  {
    id: "automation",
    title: "Automation & API Integrations",
    summary:
      "Ship reliable workflows by treating PulseGrid as infrastructure-as-code.",
    bullets: [
      "REST + Webhook API for creating services, alert rules, and maintenance windows.",
      "First-class Terraform module (`registry.terraform.io/pulsegrid/platform`) for reproducible setups.",
      "Outbound webhooks push incidents to Jira, ServiceNow, Linear, and custom endpoints.",
      "CLI (`pgctl`) automates bulk imports, secrets rotation, and drift detection.",
    ],
    details: [
      "Use service templates to stamp out consistent monitoring for microservice fleets.",
      "SCIM provisioning keeps user/role mappings synchronized with your IdP.",
    ],
  },
  {
    id: "support",
    title: "Support & Escalation Paths",
    summary: "Clear ownership ensures every alert has an accountable team.",
    bullets: [
      "Tier 1: NOC / SRE handles triage; responds within 5 minutes to Sev1 alerts.",
      "Tier 2: Service owners and domain SMEs engaged via automated escalation.",
      "Tier 3: Product & leadership notified for customer-facing incidents.",
      "Status page updates and customer communications are templated inside Docs.",
    ],
    details: [
      "Embed PagerDuty or OpsGenie schedulers directly inside alert policies.",
      "Export incident postmortems to PDF/Confluence directly from the timeline.",
    ],
  },
];

export default function Docs() {
  const quickLinks = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        label: section.title,
      })),
    []
  );

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative py-10 md:py-12 lg:py-16 space-y-12">
      {/* Hero */}
      <section
        className="docs-section bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_25px_80px_rgba(15,23,42,0.55)]"
        style={{ animationDelay: "0s" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
              <BookOpen className="w-4 h-4 mr-2" />
              PulseGrid Documentation
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
              Operational Guide & Product Playbook
            </h1>
            <p className="text-white/70 text-lg max-w-3xl">
              Everything your teams need to onboard, operate, and scale on
              PulseGrid: onboarding flows, observability patterns, role
              responsibilities, and proven response rituals.
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-white/80 w-full md:max-w-sm">
            <p className="uppercase text-xs tracking-widest text-blue-300 mb-2">
              At a glance
            </p>
            <ul className="space-y-2 text-sm">
              <li>• 3-step onboarding blueprint</li>
              <li>• Service observability standards</li>
              <li>• Security & RBAC guidelines</li>
              <li>• Incident response rituals</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Quick navigation */}
      <section
        className="docs-section bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_10px_40px_rgba(15,23,42,0.45)]"
        style={{ animationDelay: "0.1s" }}
      >
        <p className="text-sm uppercase tracking-widest text-white/60 mb-4">
          Jump to
        </p>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleScroll(link.id)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white transition-all"
            >
              {link.label}
            </button>
          ))}
        </div>
      </section>

      {/* Sections */}
      <section className="space-y-8">
        {sections.map((section, idx) => {
          const Icon = sectionIcons[section.id];
          return (
            <article
              key={section.id}
              id={section.id}
              className="docs-section bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.5)]"
              style={{ animationDelay: `${0.15 * idx + 0.2}s` }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="inline-flex items-center gap-3 text-white/70">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs uppercase tracking-widest text-white/50">
                      {section.id.replace(/([A-Z])/g, " $1").toUpperCase()}
                    </p>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-white">
                    {section.title}
                  </h2>
                  <p className="text-white/70 text-base md:text-lg">
                    {section.summary}
                  </p>
                </div>
                <div className="w-full md:max-w-sm bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/50 mb-3">
                      Key Actions
                    </p>
                    <ul className="space-y-3 text-sm text-white/80">
                      {section.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {section.details && (
                    <div className="pt-3 border-t border-white/10 text-xs text-white/60 space-y-2">
                      {section.details.map((detail, idx) => (
                        <p key={idx}>{detail}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Additional resources */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div
          className="docs-section bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_15px_45px_rgba(15,23,42,0.45)] space-y-4"
          style={{ animationDelay: `${sections.length * 0.15 + 0.2}s` }}
        >
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-300" />
            Templates & References
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              • Incident postmortem doc (editable Google Doc + PDF export).
            </li>
            <li>
              • Terraform + GitHub Actions starter to deploy PulseGrid in CI/CD.
            </li>
            <li>
              • Customer status update templates (email + status-page ready).
            </li>
            <li>• SOC2 / ISO evidence list for faster audits.</li>
          </ul>
        </div>
        <div
          className="docs-section bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_15px_45px_rgba(15,23,42,0.45)] space-y-4"
          style={{ animationDelay: `${sections.length * 0.15 + 0.35}s` }}
        >
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-300" />
            Support Channels
          </h3>
          <p className="text-white/70 text-sm">
            Enterprise plans include a named TAM, quarterly business reviews,
            and 24/7 incident coverage.
          </p>
          <ul className="text-sm text-white/80 space-y-1.5">
            <li>• Email: support@pulsegrid.io (SLA &lt; 1 business hour).</li>
            <li>• Slack Connect channel for premium tier collaboration.</li>
            <li>• Emergency hotline: +1 (855) 555-PULSE.</li>
            <li>• Dedicated status page & knowledge base for your tenants.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
