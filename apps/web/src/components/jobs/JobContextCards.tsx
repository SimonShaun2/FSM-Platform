"use client";

import Link from "next/link";
import { Building2, MapPin, Phone, Wrench } from "lucide-react";
import type { JobDetail } from "@fsm/types";

import { StatBadge } from "@/src/components/ui/StatBadge";

import { getAssetBadge } from "./jobs.utils";

interface JobContextCardsProps {
  job: JobDetail;
}

export function JobContextCards({ job }: JobContextCardsProps) {
  const assetBadge = getAssetBadge(job.asset);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <section className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-accent-light text-brand-accent">
            <Phone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Customer</p>
            <p className="mt-2 text-sm font-semibold text-neutral-900">
              {job.customer.firstName} {job.customer.lastName}
            </p>
            <p className="mt-1 text-sm text-neutral-500">{job.customer.phone ?? "No phone on file"}</p>
            <Link href={`/customers/${job.customer.id}`} className="mt-3 inline-flex text-sm font-semibold text-brand-accent">
              View →
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-accent-light text-brand-accent">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Property</p>
            <p className="mt-2 text-sm font-semibold text-neutral-900">{job.property?.addressLine1 ?? "Unassigned"}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {job.property ? `${job.property.city}, ${job.property.state}` : "Add a property from customer profile"}
            </p>
            {job.property ? (
              <Link
                href={`/customers/${job.customerId}/properties/${job.property.id}`}
                className="mt-3 inline-flex text-sm font-semibold text-brand-accent"
              >
                View →
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-accent-light text-brand-accent">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Asset</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-neutral-900">
                {job.asset ? `${job.asset.brand ?? ""} ${job.asset.model ?? ""}`.trim() || job.asset.name : "No asset linked"}
              </p>
              {job.asset ? <StatBadge label={assetBadge.label} tone={assetBadge.tone} /> : null}
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {job.asset ? `${job.asset.name} • ${assetBadge.installYear}` : "Link an asset to surface service history"}
            </p>
            {job.asset ? (
              <Link
                href={`/customers/${job.customerId}/assets/${job.asset.id}?propertyId=${job.propertyId ?? ""}`}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
              >
                <Wrench className="h-4 w-4" />
                View →
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
