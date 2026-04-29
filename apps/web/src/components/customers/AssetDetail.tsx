"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, PencilLine, Wrench } from "lucide-react";

import { useRecommendations } from "@/src/hooks/ai-revenue.hooks";
import { useCustomer, useCustomerAsset, useCustomerJobs } from "@/src/hooks/customers.hooks";

import { AssetForm } from "./AssetForm";
import { getAssetConditionPresentation } from "./customers.utils";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/SkeletonCard";
import { StatBadge } from "../ui/StatBadge";
import { TimeAgo } from "../ui/TimeAgo";

export function AssetDetail({ customerId, assetId }: { customerId: string; assetId: string }) {
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const searchParams = useSearchParams();
  const propertyIdFromQuery = searchParams.get("propertyId");
  const customerQuery = useCustomer(customerId);

  const resolvedPropertyId = useMemo(() => {
    if (propertyIdFromQuery) {
      return propertyIdFromQuery;
    }

    const customer = customerQuery.data?.customer;

    if (!customer) {
      return null;
    }

    const property = customer.properties.find((item) => (item.assets ?? []).some((asset) => asset.id === assetId));
    return property?.id ?? null;
  }, [assetId, customerQuery.data?.customer, propertyIdFromQuery]);

  const assetQuery = useCustomerAsset(customerId, resolvedPropertyId, assetId);
  const jobsQuery = useCustomerJobs(customerId, {
    assetId,
    page: 1,
    limit: 10,
    sortBy: "scheduledStart",
    sortOrder: "desc"
  });
  const recommendationQuery = useRecommendations({
    customerId,
    assetId,
    status: "pending",
    sortBy: "urgencyScore",
    sortOrder: "desc",
    page: 1,
    limit: 1
  });

  if ((customerQuery.isLoading && !resolvedPropertyId) || assetQuery.isLoading) {
    return <SkeletonCard className="h-[620px]" />;
  }

  if (!resolvedPropertyId || assetQuery.isError || !assetQuery.data) {
    return (
      <EmptyState
        icon={Wrench}
        title="Asset not found"
        subtitle="This asset may have been removed or isn’t attached to the current customer."
        action={
          <Link href={`/customers/${customerId}`} className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white">
            Back to customer
          </Link>
        }
      />
    );
  }

  const asset = assetQuery.data.asset;
  const condition = getAssetConditionPresentation(asset);
  const jobs = jobsQuery.data?.data ?? [];
  const aiAssessment = recommendationQuery.data?.data[0]?.body ?? "No active AI assessment is attached to this asset right now.";
  const propertyLinkHref = resolvedPropertyId ? `/customers/${customerId}/properties/${resolvedPropertyId}` : null;

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
        {propertyLinkHref ? (
          <>
            <Link href={propertyLinkHref}>Property</Link>
            <span className="text-neutral-300">/</span>
          </>
        ) : null}
        <span className="text-neutral-500">Asset</span>
      </div>

      <section className="surface-card px-6 py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{asset.name}</h1>
            <p className="mt-2 text-sm text-neutral-500">
              {asset.assetType} • {asset.brand ?? "Unknown make"} {asset.model ?? ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
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
              <StatBadge label={asset.assetType} tone="gray" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAssetFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700"
          >
            <PencilLine className="h-4 w-4" />
            Edit Asset
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="surface-card px-6 py-6">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Asset Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <DetailItem label="Make / Model" value={`${asset.brand ?? "—"} ${asset.model ?? ""}`.trim() || "—"} />
            <DetailItem label="Serial Number" value={asset.serialNumber ?? "—"} />
            <DetailItem label="Install Date" value={asset.installDate ?? "—"} />
            <DetailItem label="Warranty Expiry" value={asset.warrantyExpiration ?? "—"} />
            <DetailItem label="Last Service" value={asset.lastServiceDate ?? "—"} />
            <DetailItem label="Next Recommended Service" value={asset.nextServiceDate ?? "—"} />
          </div>
        </section>

        <section className="surface-card px-5 py-5">
          <h2 className="text-base font-semibold text-neutral-900">AI Assessment</h2>
          <p className="mt-4 text-sm leading-7 text-neutral-600">{aiAssessment}</p>
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
              title="No jobs on this asset"
              subtitle="Service work on this asset will appear here as it happens."
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
        propertyId={resolvedPropertyId}
        asset={asset}
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
