"use client";

import { useEffect, useState } from "react";
import { CarFront, Send } from "lucide-react";
import type { JobDetail } from "@fsm/types";

import { Sheet } from "@/src/components/ui/Sheet";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { StatBadge } from "@/src/components/ui/StatBadge";
import { useJobOTW, useSendOTW } from "@/src/hooks/jobs.hooks";

import { buildOnTheWayMessage, formatDateTime, wasSentToday } from "./jobs.utils";

const etaOptions = [5, 10, 15, 20, 30, 45, 60];

interface OTWPanelProps {
  jobId: string;
  job: JobDetail;
  openComposer?: boolean;
  onComposerOpenChange?: (open: boolean) => void;
}

export function OTWPanel({ jobId, job, openComposer = false, onComposerOpenChange }: OTWPanelProps) {
  const otwQuery = useJobOTW(jobId);
  const sendOTW = useSendOTW(jobId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState(15);
  const [message, setMessage] = useState(buildOnTheWayMessage(job.customer.firstName, 15));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const notification = otwQuery.data?.notification ?? null;
  const alreadySentToday = wasSentToday(notification?.sentAt);

  useEffect(() => {
    setMessage(buildOnTheWayMessage(job.customer.firstName, etaMinutes));
  }, [etaMinutes, job.customer.firstName]);

  useEffect(() => {
    if (openComposer && !alreadySentToday) {
      setSheetOpen(true);
    }
  }, [alreadySentToday, openComposer]);

  async function handleSend() {
    setErrorMessage(null);

    try {
      await sendOTW.mutateAsync({
        estimatedArrivalMinutes: etaMinutes,
        message,
        ...(job.technicianId ? { technicianId: job.technicianId } : {})
      });
      setSheetOpen(false);
      onComposerOpenChange?.(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "OTW notification could not be sent.");
    }
  }

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">🚗 On The Way</h2>
          <p className="mt-1 text-sm text-neutral-500">Send a customer-facing ETA once per day from the job record.</p>
        </div>
        <button
          type="button"
          disabled={alreadySentToday}
          onClick={() => {
            setSheetOpen(true);
            onComposerOpenChange?.(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CarFront className="h-4 w-4" />
          {alreadySentToday ? "OTW Sent Today" : "Send On The Way"}
        </button>
      </div>

      <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
        {notification ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{job.technician ? `${job.technician.firstName} ${job.technician.lastName}` : "Assigned technician"}</p>
              <p className="mt-1 text-sm text-neutral-500">
                Sent {notification.sentAt ? formatDateTime(notification.sentAt) : "recently"} • ETA{" "}
                {notification.estimatedArrivalMinutes ? `${notification.estimatedArrivalMinutes} min` : "—"}
              </p>
              <p className="mt-2 text-sm text-neutral-600">{notification.message}</p>
            </div>
            <StatBadge label="Delivered" tone="green" />
          </div>
        ) : (
          <EmptyState
            icon={CarFront}
            title="No OTW notification yet"
            subtitle="Send a quick ETA before the tech arrives so the customer is not guessing."
            compact
          />
        )}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-3xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error">{errorMessage}</p>
      ) : null}

      <Sheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          onComposerOpenChange?.(false);
        }}
        title="Send On The Way"
        description="Choose an ETA, adjust the preview, and send the message. OTW is limited to once per day per job."
      >
        <div className="space-y-5 px-6 py-6">
          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Next Job</p>
            <p className="mt-2 text-base font-semibold text-neutral-900">{job.title}</p>
            <p className="mt-1 text-sm text-neutral-500">{job.property?.addressLine1 ?? "Property address unavailable"}</p>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">ETA</span>
            <select
              value={etaMinutes}
              onChange={(event) => setEtaMinutes(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent"
            >
              {etaOptions.map((value) => (
                <option key={value} value={value}>
                  {value} minutes
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[24px] border border-neutral-200 bg-brand-accent-light/60 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Message Preview</p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-3 min-h-28 w-full rounded-2xl border border-transparent bg-white/80 px-3 py-3 text-sm leading-6 text-neutral-700 outline-none transition focus:border-brand-accent"
            />
          </div>

          <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-900">Channel</p>
            <p className="mt-1">SMS is the active delivery path for OTW notifications in this phase.</p>
          </div>

          <button
            type="button"
            disabled={sendOTW.isPending || alreadySentToday}
            onClick={() => {
              void handleSend();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sendOTW.isPending ? "Sending..." : "Send On My Way"}
          </button>
        </div>
      </Sheet>
    </section>
  );
}
