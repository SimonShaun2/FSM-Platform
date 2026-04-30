"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarCheck2, CircleHelp, Clock3, Mail, MapPin, Phone, X } from "lucide-react";
import type { ConfirmBookingRequestInput, DispatchTechnicianDay, JobDetail } from "@fsm/types";

import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import type { BookingRequestDetail } from "@/src/hooks/dispatch.hooks";
import { cn } from "@/src/lib/utils";

import { formatDispatchRange, formatDispatchTime, getStatusTone } from "./dispatch.utils";

interface DispatchDetailPanelProps {
  selectedDate: string;
  selectedJobId: string | null;
  selectedBookingRequestId: string | null;
  job: JobDetail | undefined;
  jobLoading: boolean;
  bookingRequest: BookingRequestDetail | undefined;
  bookingLoading: boolean;
  technicians: DispatchTechnicianDay[];
  autoFitPending: boolean;
  completePending: boolean;
  confirmBookingPending: boolean;
  declineBookingPending: boolean;
  onClose: () => void;
  onAutoFit: (job: JobDetail) => Promise<void>;
  onComplete: (jobId: string) => Promise<void>;
  onConfirmBooking: (id: string, input: ConfirmBookingRequestInput) => Promise<void>;
  onDeclineBooking: (id: string, reason?: string) => Promise<void>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function buildBookingWindow(date: string, window: "morning" | "afternoon") {
  const startHour = window === "afternoon" ? 13 : 10;
  const endHour = window === "afternoon" ? 15 : 12;

  return {
    scheduledStart: new Date(`${date}T${String(startHour).padStart(2, "0")}:00:00`).toISOString(),
    scheduledEnd: new Date(`${date}T${String(endHour).padStart(2, "0")}:00:00`).toISOString()
  };
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone = "neutral"
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "neutral";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        tone === "primary"
          ? "bg-brand-accent text-white hover:bg-brand-primary"
          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
      )}
    >
      {label}
    </button>
  );
}

function PanelPlaceholder() {
  return (
    <div className="surface-card sticky top-[88px] p-5">
      <EmptyState
        icon={CircleHelp}
        title="Select a job or booking"
        subtitle="Click any job block, booking request, or smart queue card to open the dispatch details panel."
      />
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="surface-card sticky top-[88px] space-y-4 p-5">
      <SkeletonCard className="h-[140px]" />
      <SkeletonCard className="h-[120px]" />
      <SkeletonCard className="h-[164px]" />
    </div>
  );
}

function JobDetailView({
  job,
  autoFitPending,
  completePending,
  onClose,
  onAutoFit,
  onComplete
}: {
  job: JobDetail;
  autoFitPending: boolean;
  completePending: boolean;
  onClose: () => void;
  onAutoFit: (job: JobDetail) => Promise<void>;
  onComplete: (jobId: string) => Promise<void>;
}) {
  const customerName = `${job.customer.firstName} ${job.customer.lastName}`.trim();
  const canComplete = ["scheduled", "dispatched", "in_progress"].includes(job.status);

  return (
    <div className="surface-card sticky top-[88px] space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatBadge label={job.status.replaceAll("_", " ")} tone="blue" />
            <StatBadge label={job.jobNumber} tone="gray" />
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">{job.title}</h2>
          <p className="mt-2 text-sm text-neutral-500">{formatDispatchRange(job.scheduledStart, job.scheduledEnd)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Section title="Status">
        <div className={cn("rounded-[20px] px-4 py-4", getStatusTone(job.status))}>
          <p className="text-sm font-semibold capitalize">{job.status.replaceAll("_", " ")}</p>
          <p className="mt-1 text-xs opacity-80">{formatDispatchRange(job.scheduledStart, job.scheduledEnd)}</p>
        </div>
      </Section>

      <Section title="Customer">
        <div className="space-y-3 text-sm text-neutral-600">
          <p className="text-base font-semibold text-neutral-900">{customerName}</p>
          {job.customer.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-neutral-400" />
              <span>{job.customer.phone}</span>
            </div>
          ) : null}
          {job.customer.email ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <span>{job.customer.email}</span>
            </div>
          ) : null}
        </div>
      </Section>

      {job.property ? (
        <Section title="Property">
          <div className="space-y-2 text-sm text-neutral-600">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900">{job.property.addressLine1}</p>
                <p>
                  {job.property.city}, {job.property.state}
                </p>
              </div>
            </div>
            {job.property.accessNotes ? <p className="text-sm text-neutral-500">{job.property.accessNotes}</p> : null}
          </div>
        </Section>
      ) : null}

      {job.asset ? (
        <Section title="Asset">
          <div className="space-y-2 text-sm text-neutral-600">
            <p className="font-medium text-neutral-900">{job.asset.name}</p>
            <p>{job.asset.assetType}</p>
            {job.asset.lastServiceDate ? <p>Last serviced {formatDispatchTime(job.asset.lastServiceDate)}</p> : null}
          </div>
        </Section>
      ) : null}

      {job.description || job.techNotes || job.completionNotes ? (
        <Section title="Notes">
          <div className="space-y-3 text-sm leading-6 text-neutral-600">
            {job.description ? <p>{job.description}</p> : null}
            {job.techNotes ? (
              <p>
                <span className="font-semibold text-neutral-900">Tech:</span> {job.techNotes}
              </p>
            ) : null}
            {job.completionNotes ? (
              <p>
                <span className="font-semibold text-neutral-900">Completion:</span> {job.completionNotes}
              </p>
            ) : null}
          </div>
        </Section>
      ) : null}

      {job.invoiceTotal ? (
        <Section title="Revenue">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Invoice total</span>
            <CurrencyDisplay value={job.invoiceTotal} className="text-base font-semibold text-neutral-900" />
          </div>
        </Section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <ActionButton
          label={autoFitPending ? "Auto-fitting..." : "Auto-Fit"}
          onClick={() => {
            void onAutoFit(job);
          }}
          disabled={autoFitPending}
          tone="primary"
        />
        <ActionButton
          label={completePending ? "Completing..." : "Complete"}
          onClick={() => {
            void onComplete(job.id);
          }}
          disabled={!canComplete || completePending}
        />
        <Link
          href={`/jobs/${job.id}`}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          View full job
        </Link>
        <Link
          href={`/customers/${job.customer.id}`}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          Open customer
        </Link>
      </div>
    </div>
  );
}

function BookingDetailView({
  selectedDate,
  bookingRequest,
  technicians,
  confirmBookingPending,
  declineBookingPending,
  onClose,
  onConfirmBooking,
  onDeclineBooking
}: {
  selectedDate: string;
  bookingRequest: BookingRequestDetail;
  technicians: DispatchTechnicianDay[];
  confirmBookingPending: boolean;
  declineBookingPending: boolean;
  onClose: () => void;
  onConfirmBooking: (id: string, input: ConfirmBookingRequestInput) => Promise<void>;
  onDeclineBooking: (id: string, reason?: string) => Promise<void>;
}) {
  const eligibleTechnicians = technicians.filter((technician) =>
    technician.serviceZipCodes.includes(bookingRequest.zip)
  );
  const technicianOptions = eligibleTechnicians.length > 0 ? eligibleTechnicians : technicians;
  const [technicianId, setTechnicianId] = useState(technicianOptions[0]?.id ?? "");
  const [scheduledDate, setScheduledDate] = useState(bookingRequest.preferredDate ?? selectedDate);
  const [timeWindow, setTimeWindow] = useState<"morning" | "afternoon">(
    bookingRequest.preferredWindow === "afternoon" ? "afternoon" : "morning"
  );
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    setTechnicianId(technicianOptions[0]?.id ?? "");
    setScheduledDate(bookingRequest.preferredDate ?? selectedDate);
    setTimeWindow(bookingRequest.preferredWindow === "afternoon" ? "afternoon" : "morning");
    setDeclineReason("");
  }, [bookingRequest.id, bookingRequest.preferredDate, bookingRequest.preferredWindow, technicianOptions, selectedDate]);

  return (
    <div className="surface-card sticky top-[88px] space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatBadge label="Booking request" tone="purple" />
            <StatBadge label={bookingRequest.source} tone="gray" />
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
            {bookingRequest.firstName} {bookingRequest.lastName}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {bookingRequest.serviceCategory ?? "General"}
            {bookingRequest.serviceType ? ` • ${bookingRequest.serviceType}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Section title="Customer">
        <div className="space-y-3 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-neutral-400" />
            <span>{bookingRequest.phone}</span>
          </div>
          {bookingRequest.email ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <span>{bookingRequest.email}</span>
            </div>
          ) : null}
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-neutral-400" />
            <div>
              <p className="font-medium text-neutral-900">{bookingRequest.addressLine1}</p>
              <p>
                {bookingRequest.city}, {bookingRequest.state} {bookingRequest.zip}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Request details">
        <div className="space-y-2 text-sm text-neutral-600">
          {bookingRequest.preferredDate ? (
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-neutral-400" />
              <span>
                Preferred {bookingRequest.preferredDate}
                {bookingRequest.preferredWindow ? ` • ${bookingRequest.preferredWindow}` : ""}
              </span>
            </div>
          ) : null}
          {bookingRequest.serviceDetail ? <p>{bookingRequest.serviceDetail}</p> : null}
          {bookingRequest.customerNotes ? <p>{bookingRequest.customerNotes}</p> : null}
        </div>
      </Section>

      <Section title="Confirm into schedule">
        <div className="space-y-3">
          {eligibleTechnicians.length === 0 ? (
            <div className="rounded-[20px] border border-warning/25 bg-warning-light px-4 py-3 text-sm text-neutral-700">
              No technician currently covers ZIP {bookingRequest.zip}. Dispatch can still assign manually if overflow is allowed.
            </div>
          ) : null}

          <label className="block text-sm font-medium text-neutral-700">
            Technician
            <select
              value={technicianId}
              onChange={(event) => setTechnicianId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent"
            >
              {technicianOptions.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-700">
              Confirm date
              <input
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent"
              />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Time window
              <select
                value={timeWindow}
                onChange={(event) => setTimeWindow(event.target.value as "morning" | "afternoon")}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent"
              >
                <option value="morning">Morning - 10:00 AM</option>
                <option value="afternoon">Afternoon - 1:00 PM</option>
              </select>
            </label>
          </div>

          <div className="rounded-[20px] bg-brand-accent-light/40 px-4 py-4 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">Confirmation SMS preview</p>
            <p className="mt-2">
              Hi {bookingRequest.firstName}! Your {bookingRequest.serviceType ?? bookingRequest.serviceCategory ?? "service"} is confirmed for{" "}
              {scheduledDate} in the {timeWindow} window. We will send an on-the-way alert before arrival.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const bookingWindow = buildBookingWindow(scheduledDate, timeWindow);
              void onConfirmBooking(bookingRequest.id, {
                technicianId,
                scheduledStart: bookingWindow.scheduledStart,
                scheduledEnd: bookingWindow.scheduledEnd
              });
            }}
            disabled={!technicianId || !scheduledDate || confirmBookingPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <CalendarCheck2 className="h-4 w-4" />
            {confirmBookingPending ? "Confirming..." : "Confirm & schedule job"}
          </button>

          <a
            href={`tel:${bookingRequest.phone}`}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            Call customer
          </a>
        </div>
      </Section>

      <Section title="Decline">
        <div className="space-y-3">
          <textarea
            rows={3}
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            placeholder="Optional reason"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent"
          />
          <button
            type="button"
            onClick={() => {
              void onDeclineBooking(bookingRequest.id, declineReason.trim() || undefined);
            }}
            disabled={declineBookingPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {declineBookingPending ? "Declining..." : "Decline request"}
          </button>
        </div>
      </Section>
    </div>
  );
}

export function DispatchDetailPanel({
  selectedDate,
  selectedJobId,
  selectedBookingRequestId,
  job,
  jobLoading,
  bookingRequest,
  bookingLoading,
  technicians,
  autoFitPending,
  completePending,
  confirmBookingPending,
  declineBookingPending,
  onClose,
  onAutoFit,
  onComplete,
  onConfirmBooking,
  onDeclineBooking
}: DispatchDetailPanelProps) {
  if (jobLoading || bookingLoading) {
    return <DetailLoading />;
  }

  if (selectedJobId && job) {
    return (
      <JobDetailView
        job={job}
        autoFitPending={autoFitPending}
        completePending={completePending}
        onClose={onClose}
        onAutoFit={onAutoFit}
        onComplete={onComplete}
      />
    );
  }

  if (selectedBookingRequestId && bookingRequest) {
    return (
      <BookingDetailView
        selectedDate={selectedDate}
        bookingRequest={bookingRequest}
        technicians={technicians}
        confirmBookingPending={confirmBookingPending}
        declineBookingPending={declineBookingPending}
        onClose={onClose}
        onConfirmBooking={onConfirmBooking}
        onDeclineBooking={onDeclineBooking}
      />
    );
  }

  return <PanelPlaceholder />;
}
