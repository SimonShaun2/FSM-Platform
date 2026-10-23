export const MARKETING_BRAND = {
  name: "Renvani",
  tagline: "AI revenue intelligence for field service.",
  domain: "getrenvani.com"
} as const;

export const MARKETING_NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Get started", href: "#get-started" }
] as const;

export const HERO_COPY = {
  headline: "See where your revenue is hiding.",
  subhead:
    "Renvani scans your customers, estimates, and invoices to surface the revenue you're missing.",
  primaryCta: "Show me my number",
  secondaryCta: "Book demo"
} as const;

export const LOGO_STRIP_COPY = {
  label: "TRUSTED BY SERVICE TEAMS ACROSS NORTH AMERICA",
  logos: ["Acme HVAC", "Riverside Plumbing", "Peak Electric", "Summit HVAC", "Metro Services"]
} as const;

export const LEAK_CARDS = [
  {
    amount: "$18.4K",
    title: "in dormant accounts",
    detail: "47 customers haven't been touched in 12+ months.",
    progress: 40
  },
  {
    amount: "$12.6K",
    title: "in stale estimates",
    detail: "23 quotes sent and never followed up.",
    progress: 55
  },
  {
    amount: "$9.9K",
    title: "in unpaid invoices",
    detail: "14 jobs done, money never collected.",
    progress: 70
  }
] as const;

export const PILLARS = [
  {
    step: "01",
    title: "Discover",
    subtitle: "AI scans your data",
    body: "Connects to your ServiceTitan, Housecall Pro, or CSV. Within 10 minutes, surfaces every dormant customer, stale estimate, and unpaid invoice.",
    stat: "$47K",
    statLabel: "avg recovered"
  },
  {
    step: "02",
    title: "Recover",
    subtitle: "Automated playbooks",
    body: "One-click campaigns for re-engagement, follow-ups, and collections. Personalized email and dispatching — done for you.",
    stat: "8 min",
    statLabel: "to launch playbook"
  },
  {
    step: "03",
    title: "Compound",
    subtitle: "Continuous insight",
    body: "Live dashboards, weekly digests, and recommendations. Every dispatch, every invoice — turned into more revenue.",
    stat: "24/7",
    statLabel: "always-on monitoring"
  }
] as const;

export const WORKFLOW_STEPS = [
  { icon: "↑", title: "Upload data", detail: "CSV or live API" },
  { icon: "◐", title: "AI scans", detail: "~3 minutes" },
  { icon: "$", title: "Opportunities", detail: "ranked by value" },
  { icon: "▶", title: "Run playbook", detail: "one click" },
  { icon: "✓", title: "Money in", detail: "tracked end-to-end" }
] as const;

export const FEATURE_TILES = [
  { title: "Customer 360", description: "Every job, invoice, and conversation in one place." },
  { title: "Smart dispatch", description: "AI suggests the best tech for every job." },
  { title: "Mobile tech app", description: "Quotes, photos, payment — all from the truck." },
  { title: "Auto-collect", description: "Reminders + ACH/card on autopilot." },
  { title: "Revenue insights", description: "Live dashboards and weekly digests." },
  { title: "Playbook library", description: "20+ pre-built campaigns, fully customizable." },
  { title: "Integrations", description: "ServiceTitan, Housecall Pro, QuickBooks, Stripe." },
  { title: "Permissions", description: "Role-based access for owners and crews." }
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: ["Dashboard", "Dispatch", "Mobile", "Insights", "Pricing"]
  },
  {
    title: "Solutions",
    links: ["HVAC", "Plumbing", "Electrical", "Multi-trade"]
  },
  {
    title: "Company",
    links: ["About", "Customers", "Careers", "Contact"]
  },
  {
    title: "Resources",
    links: ["Docs", "Help center", "Changelog", "Status"]
  }
] as const;

export const MARKETING_META = {
  title: "Renvani — See where your field service revenue is hiding",
  description:
    "Renvani is AI revenue intelligence for HVAC, plumbing, and electrical teams. Upload a CSV and see dormant accounts, stale estimates, and unpaid invoices in minutes."
} as const;
