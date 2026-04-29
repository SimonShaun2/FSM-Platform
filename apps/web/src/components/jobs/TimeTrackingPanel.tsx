"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Square } from "lucide-react";
import type { JobDetail, TimeEntryType } from "@fsm/types";

import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import { useJobTimeEntries, useStartTimer, useStopTimer } from "@/src/hooks/jobs.hooks";

import {
  buildTimeSummary,
  formatDateTime,
  formatDurationMinutes,
  formatElapsedSeconds
} from "./jobs.utils";

const entryTypeOptions: Array<{ value: TimeEntryType; label: string }> = [
  { value: "on_site", label: "On Site" },
  { value: "travel", label: "Travel" },
  { value: "break", label: "Break" }
];

interface TimeTrackingPanelProps {
  jobId: string;
  job: JobDetail;
}

export function TimeTrackingPanel({ jobId, job }: TimeTrackingPanelProps) {
  const timeEntriesQuery = useJobTimeEntries(jobId);
  const startTimer = useStartTimer(jobId);
  const stopTimer = useStopTimer(jobId);
  const [entryType, setEntryType] = useState<TimeEntryType>("on_site");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const entries = timeEntriesQuery.data?.timeEntries ?? [];
  const activeEntry = useMemo(() => entries.find((entry) => entry.endedAt === null) ?? null, [entries]);
  const summary = useMemo(() => buildTimeSummary(entries, elapsedSeconds), [elapsedSeconds, entries]);

  useEffect(() => {
    if (!activeEntry) {
      setElapsedSeconds(0);
      return undefined;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000));
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeEntry]);

  async function handleStartTimer() {
    setErrorMessage(null);

    try {
      await startTimer.mutateAsync({
        entryType,
        ...(job.technicianId ? { technicianId: job.technicianId } : {})
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Timer could not be started.");
    }
  }

  async function handleStopTimer() {
    setErrorMessage(null);

    try {
      await stopTimer.mutateAsync(
        job.technicianId
          ? {
              technicianId: job.technicianId
            }
          : undefined
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Timer could not be stopped.");
    }
  }

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">⏱ Time Tracking</h2>
          <p className="mt-1 text-sm text-neutral-500">Start, stop, and review field time against this work order.</p>
        </div>
        <p className="text-sm font-semibold text-success">
          Total billable: {formatDurationMinutes(summary.billableMinutes)}
        </p>
      </div>

      {timeEntriesQuery.isLoading ? (
        <div className="mt-5">
          <SkeletonCard className="h-[220px]" />
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
            {activeEntry ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Active Entry</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatBadge label={activeEntry.entryType ?? "On Site"} tone="green" />
                      <span className="text-sm text-neutral-500">Started {formatDateTime(activeEntry.startedAt)}</span>
                    </div>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-neutral-900">{formatElapsedSeconds(elapsedSeconds)}</p>
                </div>
                <button
                  type="button"
                  disabled={stopTimer.isPending}
                  onClick={() => {
                    void handleStopTimer();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-error px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Square className="h-4 w-4" />
                  {stopTimer.isPending ? "Stopping..." : "Stop Timer"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={entryType}
                    onChange={(event) => setEntryType(event.target.value as TimeEntryType)}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 outline-none transition focus:border-brand-accent"
                  >
                    {entryTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={startTimer.isPending}
                  onClick={() => {
                    void handleStartTimer();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Play className="h-4 w-4" />
                  {startTimer.isPending ? "Starting..." : "Start Timer"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Start</th>
                  <th className="px-4 py-3 font-semibold">End</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-500">
                      No time entries yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 font-medium text-neutral-900">{entry.entryType?.replace("_", " ") ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatDateTime(entry.startedAt)}</td>
                      <td className="px-4 py-3 text-neutral-600">{entry.endedAt ? formatDateTime(entry.endedAt) : "Active"}</td>
                      <td className="px-4 py-3 text-neutral-900">
                        {entry.endedAt
                          ? formatDurationMinutes(entry.durationMinutes ?? 0)
                          : formatElapsedSeconds(elapsedSeconds)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {job.technician ? `${job.technician.firstName} ${job.technician.lastName}` : "Unassigned"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Travel</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{formatDurationMinutes(summary.travelMinutes)}</p>
            </div>
            <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">On Site</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{formatDurationMinutes(summary.onSiteMinutes)}</p>
            </div>
            <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Break</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">{formatDurationMinutes(summary.breakMinutes)}</p>
            </div>
            <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Billable</p>
              <p className="mt-2 text-lg font-semibold text-success">{formatDurationMinutes(summary.billableMinutes)}</p>
            </div>
          </div>
        </>
      )}

      {errorMessage ? (
        <p className="mt-4 rounded-3xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error">{errorMessage}</p>
      ) : null}
    </section>
  );
}
