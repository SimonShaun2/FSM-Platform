"use client";

import { useEffect, useState } from "react";

const STATES = [
  {
    label: "Scanning your data",
    rows: [
      { name: "Dormant accounts", value: "47 found", tone: "amber" },
      { name: "Stale estimates", value: "23 open", tone: "sky" },
      { name: "Unpaid invoices", value: "14 overdue", tone: "rose" }
    ]
  },
  {
    label: "Revenue opportunities",
    rows: [
      { name: "Recoverable this month", value: "$41.2K", tone: "emerald" },
      { name: "Pipeline value", value: "$92.4K", tone: "sky" },
      { name: "Playbooks ready", value: "7", tone: "amber" }
    ]
  },
  {
    label: "Suggested actions",
    rows: [
      { name: "Re-engage dormant HVAC", value: "Launch", tone: "emerald" },
      { name: "Estimate follow-up", value: "Send", tone: "sky" },
      { name: "Invoice reminders", value: "Queue", tone: "amber" }
    ]
  }
] as const;

const toneClasses: Record<string, string> = {
  amber: "bg-amber-500/20 text-amber-200",
  sky: "bg-sky-500/20 text-sky-200",
  rose: "bg-rose-500/20 text-rose-200",
  emerald: "bg-emerald-500/20 text-emerald-200"
};

export function AIRevenueWidget() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % STATES.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const state = STATES[index % STATES.length]!;

  return (
    <div
      className="relative h-full min-h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] p-6 text-white shadow-2xl"
      aria-live="polite"
      aria-label="AI revenue opportunity preview"
    >
      <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
        <span>AI Revenue Widget</span>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">Live</span>
      </div>
      <p className="text-lg font-semibold text-white">{state.label}</p>
      <div className="mt-6 space-y-3">
        {state.rows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
          >
            <span className="text-sm text-slate-200">{row.name}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClasses[row.tone]}`}>{row.value}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-6 left-6 right-6 flex gap-2">
        {STATES.map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`h-1.5 flex-1 rounded-full transition-colors ${dotIndex === index ? "bg-orange-400" : "bg-white/15"}`}
          />
        ))}
      </div>
    </div>
  );
}
