"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, ClipboardList, Plus } from "lucide-react";

import { useCustomerJobs, useCustomerProperty } from "@/src/hooks/customers.hooks";

import { AssetForm } from "./AssetForm";
import { formatAddress, getAssetConditionPresentation } from "./customers.utils";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/SkeletonCard";
import { StatBadge } from "../ui/StatBadge";
import { TimeAgo } from "../ui/TimeAgo";

export function PropertyDetail({ customerId, propertyId }: { customerId: string; propertyId: string }) {
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const propertyQuery = useCustomerProperty(customerId, propertyId);
  const jobsQuery = useCustomerJobs(customerId, {
    propertyId,
    page: 1,
    limit: 10,
    sortBy: "scheduledStart",
    sortOrder: "desc"
  });

  if (propertyQuery.isLoading) {
    return <SkeletonCard className="h-[640px]" />;
  }

  if (propertyQuery.isError || !propertyQuery.data) {
    return (
      <EmptyState
        icon={Building2}
        title="Property not found"
        subtitle="This property record may have been removed or belongs to a different customer."
        action={
          <Link href={`/customers/${customerId}`} className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white">
            Back to customer
          </Link>
        }
      />
    );
  }

  const property = propertyQuery.data.property;
  const jobs = jobsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-accent">
        <Link href="/customers" className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          All Customers
        </Link>
        <span className="text-neutral-300">/</span>
        <Link href={`/customers/${customerId}`}>Customer Profile</Link>
        <span className="text-neutral-300">/</span>
        <span className="text-neutral-500">Property</span>
      </div>

      <section className="surface-card px-6 py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{property.addressLine1}</h1>
            <p className="mt-2 text-sm text-neutral-500">{formatAddress(property)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatBadge label={property.type.replaceAll("_", " ")} tone="blue" />
              {property.isPrimary ? <StatBadge label="Primary" tone="green" /> : null}
              {property.yearBuilt ? <StatBadge label={`Built ${property.yearBuilt}`} tone="gray" /> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAssetFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="surface-card px-6 py-6">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Assets at this property</h2>
          <div className="mt-5 space-y-3">
            {(property.assets ?? []).map((asset) => {
              const condition = getAssetConditionPresentation(asset);

              return (
                <div key={asset.id} className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{asset.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {asset.assetType} • {asset.serialNumber ?? "No serial on file"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={
                        condition.tone === "green"
                          ? "rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success"
                          : condition.tone === "orange"
                            ? "rounded-full bg-warning-light px-3 py-1 text-xs font-semibold text-warning"
                            : condition.tone === "red"
                              ? "rounded-full bg-error-light px-3 py-1 text-xs font-semibold text-error"
                              : "rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500"
                      }
                    >
                      {condition.label}
                    </span>
                    <Link href={`/customers/${customerId}/assets/${asset.id}?propertyId=${property.id}`} className="text-sm font-semibold text-brand-accent">
                      View Asset
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card px-5 py-5">
          <h2 className="text-base font-semibold text-neutral-900">Property Notes</h2>
          <div className="mt-4 space-y-4 text-sm text-neutral-600">
            <div>
              <p className="font-semibold text-neutral-900">Access notes</p>
              <p className="mt-2 leading-6">{property.accessNotes ?? "No access notes recorded for this site."}</p>
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Internal notes</p>
              <p className="mt-2 leading-6">{property.notes ?? "No internal property notes recorded."}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-card px-6 py-6">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Job History</h2>
        {jobsQuery.isLoading ? (
          <div className="mt-5">
            <SkeletonCard className="h-[240px]" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={ClipboardList}
              title="No jobs for this property"
              subtitle="Scheduled service and installation work at this address will show here."
              compact
            />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[24px] border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Job #</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-4">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-brand-accent">
                        {job.jobNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-neutral-700">{job.title}</td>
                    <td className="px-4 py-4">
                      <StatBadge label={job.status.replaceAll("_", " ")} tone="gray" />
                    </td>
                    <td className="px-4 py-4 text-neutral-700">
                      <TimeAgo value={job.scheduledStart ?? job.createdAt} className="text-sm text-neutral-700" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AssetForm
        open={assetFormOpen}
        onClose={() => setAssetFormOpen(false)}
        customerId={customerId}
        propertyId={property.id}
      />
    </div>
  );
}
