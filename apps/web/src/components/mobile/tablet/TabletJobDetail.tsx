"use client";

import Link from "next/link";
import { CarFront, MapPinned, Phone, Sparkles } from "lucide-react";
import type { AiRecommendationDetail, JobDetail, JobProduct, JobTask } from "@fsm/types";

import { AttachmentsPanel } from "@/src/components/jobs/AttachmentsPanel";
import { JobProductsPanel } from "@/src/components/jobs/JobProductsPanel";
import { TaskChecklist } from "@/src/components/jobs/TaskChecklist";
import { TimeTrackingPanel } from "@/src/components/jobs/TimeTrackingPanel";
import { formatStatusLabel, getAssetBadge } from "@/src/components/jobs/jobs.utils";
import { JobActionBar } from "@/src/components/mobile/JobActionBar";
import { cn } from "@/src/lib/utils";

interface TabletJobDetailProps {
  job: JobDetail;
  tasks: JobTask[];
  products: JobProduct[];
  taxRate: number;
  suggestion: AiRecommendationDetail | null;
}

export function TabletJobDetail({ job, tasks, products, taxRate, suggestion }: TabletJobDetailProps) {
  const assetBadge = getAssetBadge(job.asset);

  return (
    <div className="min-h-[100svh] overflow-hidden bg-[#F5F7FB] px-8 py-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/mobile/jobs" className="text-sm font-semibold text-brand-accent">
              ← Back to Jobs
            </Link>
            <div className="mt-2 flex items-center gap-4">
              <h1 className="text-[2.15rem] font-semibold tracking-tight text-neutral-950">{job.title}</h1>
              <span className="rounded-full bg-brand-accent-light px-3 py-1 text-sm font-semibold text-brand-accent">
                {formatStatusLabel(job.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid h-[calc(100svh-180px)] grid-cols-[248px_248px_minmax(320px,1fr)] gap-5 overflow-hidden">
          <aside className="space-y-5 overflow-y-auto pr-1">
            <section className="rounded-[28px] border border-neutral-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Customer</p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                {job.customer.firstName} {job.customer.lastName}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{job.property?.addressLine1 ?? "Address pending"}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={job.customer.phone ? `tel:${job.customer.phone}` : undefined}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-100 text-sm font-semibold text-neutral-700"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${job.property?.addressLine1 ?? ""}, ${job.property?.city ?? ""}, ${job.property?.state ?? ""}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-100 text-sm font-semibold text-neutral-700"
                >
                  <MapPinned className="h-4 w-4" />
                  Map
                </a>
              </div>
            </section>

            <section className="rounded-[28px] border border-neutral-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Asset</p>
              <h2 className="mt-2 text-lg font-semibold text-neutral-950">{job.asset?.name ?? "Equipment"}</h2>
              <p className="mt-1 text-sm text-neutral-500">{job.asset?.model ?? "Model pending"} · {assetBadge.installYear}</p>
              <div className="mt-4">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    assetBadge.tone === "red"
                      ? "bg-error-light text-error"
                      : assetBadge.tone === "orange"
                        ? "bg-warning-light text-warning"
                        : "bg-success-light text-success"
                  )}
                >
                  {assetBadge.label}
                </span>
              </div>
            </section>

            {suggestion ? (
              <section className="rounded-[28px] border border-ai/10 bg-ai-light/70 px-4 py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-ai" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">AI Suggestion</p>
                    <p className="mt-1 text-sm text-neutral-700">{suggestion.headline}</p>
                    <p className="mt-2 text-xs leading-5 text-neutral-500">{suggestion.body}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <TimeTrackingPanel jobId={job.id} job={job} />
          </aside>

          <section className="overflow-y-auto pr-1">
            <TaskChecklist jobId={job.id} tasks={tasks} />
          </section>

          <section className="space-y-5 overflow-y-auto pr-1">
            <JobProductsPanel jobId={job.id} products={products} taxRate={taxRate} suggestion={suggestion} />
            <AttachmentsPanel jobId={job.id} />
            <Link
              href={`/mobile/otw/${job.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200"
            >
              <CarFront className="h-4 w-4" />
              Open OTW
            </Link>
          </section>
        </div>
      </div>

      <JobActionBar jobId={job.id} status={job.status} />
    </div>
  );
}
