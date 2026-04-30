"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  PauseCircle,
  RefreshCcw,
  ShieldCheck,
  XCircle
} from "lucide-react";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Sheet } from "@/src/components/ui/Sheet";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import {
  useCancelServiceAgreement,
  usePauseServiceAgreement,
  useRetryServiceAgreementPayment,
  useServiceAgreement,
  useServiceAgreementActivity,
  useServiceAgreementVisits
} from "@/src/hooks/service-agreements.hooks";
import { getStoredSession } from "@/src/lib/auth";
import { cn, formatDate } from "@/src/lib/utils";
import { useAuthStore } from "@/src/stores/auth.store";
import { showToast } from "@/src/stores/toast.store";

interface ServiceAgreementDetailClientProps {
  agreementId: string;
}

function formatStripeStatusLabel(status: string | null) {
  if (!status) {
    return "Not Connected";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStripeStatusTone(status: string | null) {
  switch (status) {
    case "active":
      return "green" as const;
    case "trialing":
      return "blue" as const;
    case "paused":
      return "purple" as const;
    case "past_due":
    case "incomplete":
    case "incomplete_expired":
      return "orange" as const;
    case "unpaid":
    case "canceled":
      return "red" as const;
    default:
      return "gray" as const;
  }
}

function getAgreementStatusTone(status: string) {
  switch (status) {
    case "active":
      return "green" as const;
    case "paused":
      return "purple" as const;
    case "expired":
      return "gray" as const;
    case "cancelled":
      return "red" as const;
    default:
      return "neutral" as const;
  }
}

function isFailedPaymentStatus(status: string | null) {
  return (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    status === "incomplete_expired"
  );
}

function BillingEventList({
  items
}: {
  items: Array<{
    id: string;
    eventType: string;
    summary: string;
    occurredAt: string;
  }>;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Billing events will appear here after renewals, retries, or failed charges.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-neutral-900">{item.summary}</p>
            <StatBadge
              label={item.eventType.replace(".", " ")}
              tone={
                item.eventType === "payment.failed"
                  ? "orange"
                  : item.eventType === "maintenance_plan.cancelled"
                    ? "red"
                    : "green"
              }
            />
          </div>
          <p className="mt-2 text-sm text-neutral-500">{formatDate(item.occurredAt)}</p>
        </div>
      ))}
    </div>
  );
}

export function ServiceAgreementDetailClient({ agreementId }: ServiceAgreementDetailClientProps) {
  const authUser = useAuthStore((state) => state.user);
  const fallbackSession = useMemo(() => (authUser ? null : getStoredSession()), [authUser]);
  const role = authUser?.role ?? fallbackSession?.role ?? null;
  const canPause = role === "owner" || role === "admin";
  const canManage = role !== "technician";

  const agreementQuery = useServiceAgreement(agreementId);
  const visitsQuery = useServiceAgreementVisits(agreementId);
  const activityQuery = useServiceAgreementActivity(agreementId);
  const cancelAgreement = useCancelServiceAgreement(agreementId);
  const pauseAgreement = usePauseServiceAgreement(agreementId);
  const retryPayment = useRetryServiceAgreementPayment(agreementId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [cancelReason, setCancelReason] = useState("");

  const agreement = agreementQuery.data?.agreement;
  const visits = visitsQuery.data?.visits ?? [];
  const billingEvents = useMemo(
    () =>
      (activityQuery.data?.data ?? [])
        .filter((item) =>
          [
            "payment.received",
            "payment.failed",
            "maintenance_plan.renewed",
            "maintenance_plan.cancelled"
          ].includes(item.eventType)
        )
        .sort(
          (left, right) =>
            new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
        ),
    [activityQuery.data?.data]
  );

  async function handlePauseAgreement() {
    try {
      await pauseAgreement.mutateAsync();
      showToast({
        tone: "success",
        title: "Agreement paused",
        description: "Billing and service reminders are now paused for this plan."
      });
      await agreementQuery.refetch();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Agreement could not be paused",
        description: error instanceof Error ? error.message : "Try again in a moment."
      });
    }
  }

  async function handleRetryPayment() {
    try {
      const response = await retryPayment.mutateAsync();
      window.open(response.retryPaymentUrl, "_blank", "noopener,noreferrer");
      showToast({
        tone: "success",
        title: "Retry link opened",
        description: "Stripe opened the latest invoice payment page in a new tab."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Retry payment unavailable",
        description: error instanceof Error ? error.message : "Try again in a moment."
      });
    }
  }

  async function handleCancelAgreement() {
    try {
      await cancelAgreement.mutateAsync({
        cancelImmediately: !cancelAtPeriodEnd,
        ...(cancelReason.trim() ? { reason: cancelReason.trim() } : {})
      });
      setCancelOpen(false);
      setCancelAtPeriodEnd(true);
      setCancelReason("");
      showToast({
        tone: "success",
        title: "Agreement updated",
        description: cancelAtPeriodEnd
          ? "Cancellation is scheduled for the end of the current billing period."
          : "The agreement has been cancelled immediately."
      });
      await agreementQuery.refetch();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Cancellation could not be applied",
        description: error instanceof Error ? error.message : "Try again in a moment."
      });
    }
  }

  if (agreementQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[128px]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SkeletonCard className="h-[680px]" />
          <SkeletonCard className="h-[620px]" />
        </div>
      </div>
    );
  }

  if (agreementQuery.isError || !agreement) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Agreement not found"
        subtitle="This agreement may have been removed or you may not have access to it in the current company."
        action={
          <Link
            href="/service-agreements"
            className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Back to agreements
          </Link>
        }
      />
    );
  }

  const failedPayment = isFailedPaymentStatus(agreement.stripeStatus);
  const currentPeriodEnd = agreement.stripeCurrentPeriodEnd
    ? formatDate(agreement.stripeCurrentPeriodEnd)
    : "Not scheduled";
  const nextServiceDate = agreement.nextServiceDate
    ? formatDate(agreement.nextServiceDate)
    : "Not scheduled";

  return (
    <>
      <div className="space-y-4">
        <Link
          href="/service-agreements"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          All Service Agreements
        </Link>

        <PageLayout
          title={agreement.name}
          subtitle={`${agreement.customer.firstName} ${agreement.customer.lastName}${
            agreement.property ? ` - ${agreement.property.addressLine1}` : ""
          }`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StatBadge
                label={agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                tone={getAgreementStatusTone(agreement.status)}
              />
              <StatBadge
                label={formatStripeStatusLabel(agreement.stripeStatus)}
                tone={getStripeStatusTone(agreement.stripeStatus)}
              />
            </div>
          }
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="surface-card px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      Plan
                    </p>
                    <p className="mt-3 text-base font-semibold text-neutral-900">
                      {agreement.template?.name ?? agreement.name}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {agreement.template
                        ? `${agreement.template.visitsPerYear} visits per year`
                        : "Custom agreement"}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      Billing
                    </p>
                    <p className="mt-3 text-base font-semibold text-neutral-900">
                      {agreement.billingCycle ? agreement.billingCycle : "Manual"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {agreement.price ? (
                        <CurrencyDisplay value={agreement.price} showCents />
                      ) : (
                        "No recurring price"
                      )}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      Next Renewal
                    </p>
                    <p className="mt-3 text-base font-semibold text-neutral-900">
                      {currentPeriodEnd}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {agreement.stripeCancelAtPeriodEnd
                        ? "Cancellation scheduled at period end"
                        : "Auto-renews until cancelled"}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      Next Service
                    </p>
                    <p className="mt-3 text-base font-semibold text-neutral-900">
                      {nextServiceDate}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {agreement.lastServiceDate
                        ? `Last completed ${formatDate(agreement.lastServiceDate)}`
                        : "No completed visits yet"}
                    </p>
                  </div>
                </div>

                {agreement.description ? (
                  <div className="mt-5 rounded-[24px] border border-neutral-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      Description
                    </p>
                    <p className="mt-3 text-sm leading-6 text-neutral-700">
                      {agreement.description}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="surface-card px-6 py-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                      Covered Assets
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Assets and equipment included under this maintenance agreement.
                    </p>
                  </div>
                  <StatBadge label={`${agreement.assets.length} assets`} tone="blue" />
                </div>

                {agreement.assets.length === 0 ? (
                  <div className="mt-5">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No assets attached"
                      subtitle="Attach assets after enrollment if you want job and AI flows to target covered equipment."
                      compact
                    />
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {agreement.assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex flex-col gap-3 rounded-[24px] border border-neutral-200 px-4 py-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{asset.name}</p>
                          <p className="mt-1 text-sm text-neutral-500">{asset.assetType}</p>
                        </div>
                        {agreement.property ? (
                          <Link
                            href={`/customers/${agreement.customer.id}/assets/${asset.id}?propertyId=${agreement.property.id}`}
                            className="text-sm font-semibold text-brand-accent"
                          >
                            View Asset
                          </Link>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="surface-card px-6 py-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                      Visits and Coverage
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Included services and recorded maintenance visits on the plan.
                    </p>
                  </div>
                  {agreement.template ? (
                    <StatBadge
                      label={`${agreement.template.visitsPerYear} included visits`}
                      tone="green"
                    />
                  ) : null}
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      Included Services
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {agreement.includedServices.length > 0 ? (
                        agreement.includedServices.map((service) => (
                          <StatBadge key={service} label={service} tone="neutral" />
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500">
                          No included service list is stored on this agreement.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {visits.length > 0 ? (
                      visits.map((visit) => (
                        <div
                          key={visit.id}
                          className="rounded-[24px] border border-neutral-200 px-4 py-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-neutral-900">
                              {visit.completedDate
                                ? formatDate(visit.completedDate)
                                : "Visit pending"}
                            </p>
                            {visit.jobId ? (
                              <Link
                                href={`/jobs/${visit.jobId}`}
                                className="text-sm font-semibold text-brand-accent"
                              >
                                Open Job
                              </Link>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-neutral-500">
                            {visit.notes ?? "No technician notes were saved for this visit."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-500">
                        No visit history has been recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="surface-card px-5 py-5">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                  Billing and Stripe
                </h2>

                {failedPayment ? (
                  <div className="mt-4 rounded-[24px] border border-warning/20 bg-warning-light px-4 py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          Failed payment alert
                        </p>
                        <p className="mt-2 text-sm leading-6 text-neutral-700">
                          Stripe marked this agreement as{" "}
                          {formatStripeStatusLabel(agreement.stripeStatus).toLowerCase()}.
                          {agreement.latestInvoiceAmountDue ? (
                            <>
                              {" "}Amount due:{" "}
                              <CurrencyDisplay
                                value={agreement.latestInvoiceAmountDue}
                                showCents
                                className="font-semibold text-neutral-900"
                              />
                              {agreement.latestInvoiceDueDate
                                ? ` due ${formatDate(agreement.latestInvoiceDueDate)}`
                                : ""}
                              .
                            </>
                          ) : null}
                        </p>
                        <button
                          type="button"
                          disabled={retryPayment.isPending}
                          onClick={() => {
                            void handleRetryPayment();
                          }}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          {retryPayment.isPending ? "Opening..." : "Retry Payment"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3 rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-neutral-500">Stripe Status</span>
                    <StatBadge
                      label={formatStripeStatusLabel(agreement.stripeStatus)}
                      tone={getStripeStatusTone(agreement.stripeStatus)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-neutral-500">Payment Method</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {agreement.paymentMethodLabel ?? "No payment method on file"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-neutral-500">Next Renewal</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {currentPeriodEnd}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-neutral-500">Customer</span>
                    <Link
                      href={`/customers/${agreement.customer.id}`}
                      className="text-sm font-semibold text-brand-accent"
                    >
                      Open Customer
                    </Link>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {canPause && agreement.status === "active" ? (
                    <button
                      type="button"
                      disabled={pauseAgreement.isPending}
                      onClick={() => {
                        void handlePauseAgreement();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <PauseCircle className="h-4 w-4" />
                      {pauseAgreement.isPending ? "Pausing..." : "Pause Agreement"}
                    </button>
                  ) : null}

                  {canManage && agreement.status !== "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelAtPeriodEnd(true);
                        setCancelReason("");
                        setCancelOpen(true);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-error/20 bg-error-light px-5 py-3 text-sm font-semibold text-error transition hover:bg-white"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Agreement
                    </button>
                  ) : null}
                </div>
              </section>

              <section className="surface-card px-5 py-5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-accent" />
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                    Billing History
                  </h2>
                </div>
                <div className="mt-4">
                  <BillingEventList
                    items={billingEvents.map((item) => ({
                      id: item.id,
                      eventType: item.eventType,
                      summary: item.summary,
                      occurredAt: item.occurredAt
                    }))}
                  />
                </div>
              </section>
            </aside>
          </div>
        </PageLayout>
      </div>

      <Sheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Agreement"
        description="Choose when coverage should end, then confirm the cancellation request."
      >
        <div className="space-y-5 px-6 py-6">
          <div className="rounded-[24px] border border-warning/20 bg-warning-light px-4 py-4 text-sm text-neutral-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="space-y-2">
                <p className="font-semibold text-neutral-900">Impact warning</p>
                <p>Customer will lose plan benefits immediately if you cancel now.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">
              Cancellation timing
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setCancelAtPeriodEnd(true)}
                className={cn(
                  "rounded-[24px] border px-4 py-4 text-left transition",
                  cancelAtPeriodEnd
                    ? "border-brand-accent bg-brand-accent-light"
                    : "border-neutral-200 bg-white hover:border-brand-accent/30"
                )}
              >
                <p className="text-sm font-semibold text-neutral-900">
                  Cancel at period end
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Keep coverage active through {currentPeriodEnd}.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCancelAtPeriodEnd(false)}
                className={cn(
                  "rounded-[24px] border px-4 py-4 text-left transition",
                  !cancelAtPeriodEnd
                    ? "border-error bg-error-light"
                    : "border-neutral-200 bg-white hover:border-error/30"
                )}
              >
                <p className="text-sm font-semibold text-neutral-900">
                  Cancel immediately
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Coverage stops right away and customer benefits end now.
                </p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Reason</label>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={4}
              placeholder="Document why the agreement is being cancelled."
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700 outline-none transition focus:border-brand-accent"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-5">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600"
            >
              Keep Agreement
            </button>
            <button
              type="button"
              disabled={cancelAgreement.isPending}
              onClick={() => {
                void handleCancelAgreement();
              }}
              className="rounded-full bg-error px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {cancelAgreement.isPending ? "Saving..." : "Confirm Cancellation"}
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
