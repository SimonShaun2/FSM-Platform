"use client";

import { useQuery } from "@tanstack/react-query";

import type { JobSourceReportingSummary } from "@fsm/types";

import { api } from "@/src/lib/api";

export interface JobSourceReportingDateRange {
  startDate: string;
  endDate: string;
}

export function useJobSourceReportingSummary(
  range: JobSourceReportingDateRange,
  enabled: boolean
) {
  const queryString = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate
  }).toString();

  return useQuery({
    queryKey: ["reporting", "job-sources", range.startDate, range.endDate],
    enabled: enabled && Boolean(range.startDate) && Boolean(range.endDate),
    queryFn: () => api.get<JobSourceReportingSummary>(`/api/v1/reporting/job-sources?${queryString}`)
  });
}
