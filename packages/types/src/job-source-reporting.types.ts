/** Maximum inclusive calendar-day span for job source reporting queries. */
export const JOB_SOURCE_REPORTING_MAX_RANGE_DAYS = 366;

export type JobGrowthChannel =
  | "own_website"
  | "booking"
  | "referrals"
  | "repeat_customers"
  | "imported_or_other";

export type JobSourceReportingDateInterpretation = "company_local_days" | "utc_instant";

export interface JobSourceReportingQuery {
  startDate: string;
  endDate: string;
  includeJobIds?: boolean;
}

export interface JobSourceChannelSummary {
  channel: JobGrowthChannel;
  label: string;
  bookedJobCount: number;
  revenue: string;
  shareOfBookedJobs: number;
  jobIds?: string[];
  jobIdsTruncated?: boolean;
}

export interface JobSourceReportingSummary {
  period: {
    startDate: string;
    endDate: string;
    timeZone: string;
    dateInterpretation: JobSourceReportingDateInterpretation;
  };
  totals: {
    bookedJobCount: number;
    revenue: string;
    unknownAttributionCount: number;
    unknownAttributionDefinition: string;
  };
  channels: JobSourceChannelSummary[];
}
