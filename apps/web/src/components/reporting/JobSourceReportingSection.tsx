"use client";

import { useMemo, useState, startTransition } from "react";
import { CalendarRange } from "lucide-react";

import { JOB_SOURCE_REPORTING_MAX_RANGE_DAYS } from "@fsm/types";

import { useJobSourceReportingSummary } from "@/src/hooks/job-source-reporting.hooks";
import {
  clampJobSourceReportingRange,
  getDefaultJobSourceReportingRange,
  getJobSourceReportingMaxEndDate,
  getJobSourceReportingMinStartDate,
  isJobSourceReportingRangeValid
} from "@/src/lib/job-source-reporting-range";

function formatShare(share: number): string {
  return `${share.toFixed(1)}%`;
}

export function JobSourceReportingSection() {
  const [range, setRange] = useState(getDefaultJobSourceReportingRange);
  const rangeIsValid = isJobSourceReportingRangeValid(range.startDate, range.endDate);
  const summaryQuery = useJobSourceReportingSummary(range, rangeIsValid);

  const inputBounds = useMemo(
    () => ({
      endMax: getJobSourceReportingMaxEndDate(range.startDate),
      endMin: range.startDate,
      startMin: getJobSourceReportingMinStartDate(range.endDate),
      startMax: range.endDate
    }),
    [range.endDate, range.startDate]
  );

  function handleRangeChange(field: "startDate" | "endDate", value: string) {
    startTransition(() => {
      setRange((current) =>
        clampJobSourceReportingRange(
          field === "startDate" ? value : current.startDate,
          field === "endDate" ? value : current.endDate
        )
      );
    });
  }

  return (
    <section className="surface-card space-y-5 px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Job source attribution</p>
          <p className="mt-1 text-sm text-neutral-500">
            Booked jobs and revenue by growth channel. Custom ranges are limited to{" "}
            {JOB_SOURCE_REPORTING_MAX_RANGE_DAYS} days.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            <CalendarRange className="h-4 w-4 text-neutral-400" />
            <input
              type="date"
              value={range.startDate}
              min={inputBounds.startMin}
              max={inputBounds.startMax}
              onChange={(event) => handleRangeChange("startDate", event.target.value)}
              className="bg-transparent font-semibold text-neutral-800 outline-none"
            />
          </label>
          <label className="flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            <CalendarRange className="h-4 w-4 text-neutral-400" />
            <input
              type="date"
              value={range.endDate}
              min={inputBounds.endMin}
              max={inputBounds.endMax}
              onChange={(event) => handleRangeChange("endDate", event.target.value)}
              className="bg-transparent font-semibold text-neutral-800 outline-none"
            />
          </label>
        </div>
      </div>

      {summaryQuery.isLoading ? (
        <p className="text-sm text-neutral-500">Loading job source summary…</p>
      ) : null}

      {summaryQuery.isError ? (
        <p className="text-sm text-red-600">Unable to load job source summary for this range.</p>
      ) : null}

      {summaryQuery.data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
            <span>
              <span className="font-semibold text-neutral-900">{summaryQuery.data.totals.bookedJobCount}</span>{" "}
              booked jobs
            </span>
            <span>
              <span className="font-semibold text-neutral-900">${summaryQuery.data.totals.revenue}</span> revenue
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Channel</th>
                  <th className="pb-2 pr-4 font-medium">Jobs</th>
                  <th className="pb-2 pr-4 font-medium">Revenue</th>
                  <th className="pb-2 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {summaryQuery.data.channels.map((channel) => (
                  <tr key={channel.channel} className="border-t border-neutral-100">
                    <td className="py-2 pr-4 font-medium text-neutral-900">{channel.label}</td>
                    <td className="py-2 pr-4 text-neutral-700">{channel.bookedJobCount}</td>
                    <td className="py-2 pr-4 text-neutral-700">${channel.revenue}</td>
                    <td className="py-2 text-neutral-700">{formatShare(channel.shareOfBookedJobs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
