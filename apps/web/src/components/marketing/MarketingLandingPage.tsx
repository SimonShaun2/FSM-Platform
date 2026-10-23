import Link from "next/link";

import { AIRevenueWidget } from "./AIRevenueWidget";
import {
  FEATURE_TILES,
  FOOTER_COLUMNS,
  HERO_COPY,
  LEAK_CARDS,
  LOGO_STRIP_COPY,
  MARKETING_BRAND,
  MARKETING_NAV_LINKS,
  PILLARS,
  WORKFLOW_STEPS
} from "./marketing-copy";

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
      <span className="inline-block h-2 w-2 rounded-full bg-orange-500" aria-hidden />
      {children}
    </p>
  );
}

export function MarketingLandingPage() {
  return (
    <div className="bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm text-white">$</span>
            <span>{MARKETING_BRAND.name}</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex" aria-label="Primary">
            {MARKETING_NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link href="/login" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-24">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem]">
              {HERO_COPY.headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">{HERO_COPY.subhead}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
              >
                {HERO_COPY.primaryCta} →
              </Link>
              <a
                href="mailto:hello@getrenvani.com?subject=Book%20a%20demo"
                className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
              >
                {HERO_COPY.secondaryCta}
              </a>
            </div>
          </div>
          <AIRevenueWidget />
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 py-10" aria-label="Customer logos">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{LOGO_STRIP_COPY.label}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium text-slate-500">
            {LOGO_STRIP_COPY.logos.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionEyebrow>THE LEAK</SectionEyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Every field-service business is bleeding revenue they can&apos;t see.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Your CRM only shows what you billed. It can&apos;t show the revenue you didn&apos;t.
          </p>
          <div className="mt-12 space-y-4">
            {LEAK_CARDS.map((card) => (
              <article
                key={card.title}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_2fr] lg:items-center"
              >
                <div>
                  <p className="text-3xl font-semibold text-slate-950">{card.amount}</p>
                  <p className="text-lg text-slate-700">{card.title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">{card.detail}</p>
                  <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${card.progress}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-950 py-20 text-white lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionEyebrow>HOW IT WORKS</SectionEyebrow>
          <h2 className="text-3xl font-semibold sm:text-4xl">One platform. Three jobs done.</h2>
          <p className="mt-4 max-w-xl text-slate-300">Find the money. Recover the money. Keep finding more.</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="rounded-3xl border border-white/10 bg-white/5 p-8">
                <p className="text-sm text-orange-300">{pillar.step}</p>
                <h3 className="mt-2 text-2xl font-semibold">{pillar.title}</h3>
                <p className="mt-1 text-sm text-slate-300">{pillar.subtitle}</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">{pillar.body}</p>
                <div className="mt-8 border-t border-white/10 pt-4">
                  <p className="text-2xl font-semibold text-white">{pillar.stat}</p>
                  <p className="text-xs uppercase tracking-widest text-slate-400">{pillar.statLabel}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="product-preview" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionEyebrow>INSIDE THE PRODUCT</SectionEyebrow>
          <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Built for the way field service actually works.</h2>
          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="mx-auto font-mono text-slate-500">app.{MARKETING_BRAND.domain} / dashboard</span>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-[200px_1fr]">
              <div className="space-y-3 text-sm text-slate-400">
                {["Dashboard", "Customers", "Dispatch", "Estimates", "Invoices", "Insights"].map((item, idx) => (
                  <p key={item} className={idx === 0 ? "font-semibold text-white" : undefined}>{item}</p>
                ))}
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "RECOVERED", value: "$47,180", delta: "+18% vs last 30d" },
                    { label: "IN PIPELINE", value: "$92,420", delta: "+34%" },
                    { label: "PLAYBOOKS LIVE", value: "7", delta: "active" }
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                      <p className="text-xs text-emerald-300">{metric.delta}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Revenue recovered · last 12 weeks</p>
                  <div className="mt-4 flex h-24 items-end gap-2">
                    {[30, 45, 40, 55, 50, 65, 60, 78, 70, 85, 92, 98].map((height, barIndex) => (
                      <span
                        key={barIndex}
                        className="flex-1 rounded-t bg-gradient-to-t from-orange-600 to-orange-400"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionEyebrow>THE PLAYBOOK</SectionEyebrow>
          <h2 className="text-3xl font-semibold sm:text-4xl">From CSV to cash in under 10 minutes.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WORKFLOW_STEPS.map((step, index) => (
              <article key={step.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-lg text-orange-200">
                  {step.icon}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                {index < WORKFLOW_STEPS.length - 1 ? (
                  <span className="absolute right-0 top-1/2 hidden h-px w-4 translate-x-full bg-white/20 lg:block" aria-hidden />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionEyebrow>EVERY DETAIL</SectionEyebrow>
          <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">The full toolbox.</h2>
          <p className="mt-3 text-slate-600">Designed for owners, dispatchers, and techs.</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_TILES.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 h-9 w-9 rounded-xl bg-slate-900/90" aria-hidden />
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="get-started" className="border-y border-slate-100 bg-slate-50 py-20 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <SectionEyebrow>GET STARTED</SectionEyebrow>
            <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">See your number in 10 minutes.</h2>
            <p className="mt-4 text-slate-600">No integration. No commitment. Just upload a CSV.</p>
            <p className="mt-2 text-slate-600">We&apos;ll show you exactly what&apos;s leaking and what&apos;s recoverable.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Show me my number →
              </Link>
              <a
                href="mailto:hello@getrenvani.com?subject=Book%20a%20demo"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800"
              >
                Book demo
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Upload widget</p>
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-2xl" aria-hidden>↑</p>
              <p className="mt-2 font-medium text-slate-800">Drop your customer CSV here</p>
              <p className="text-sm text-slate-500">ServiceTitan, Housecall Pro, or generic CSV</p>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>customers_export_jan2026.csv</span>
                <span>12,847 rows</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                <div className="h-full w-[72%] rounded-full bg-orange-500" />
              </div>
              <p className="mt-2 text-xs text-slate-500">Scanning · 72% · ETA 2 min</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-center text-white">
        <h2 className="text-3xl font-semibold sm:text-5xl">The money is already yours.</h2>
        <p className="mt-2 text-3xl font-semibold text-orange-300 sm:text-5xl">Let&apos;s go get it.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:hello@getrenvani.com?subject=Book%20a%20demo"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold"
          >
            Book demo →
          </a>
          <Link href="/signup" className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white">
            Upload your data
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-xs text-white">$</span>
                {MARKETING_BRAND.name}
              </p>
              <p className="mt-3 text-sm text-slate-600">{MARKETING_BRAND.tagline}</p>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-slate-900">{column.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {column.links.map((link) => (
                    <li key={link}>{link}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {MARKETING_BRAND.name}, Inc.</p>
            <p>Privacy · Terms · Security</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
