export type JobGrowthChannel =
  | "own_website"
  | "booking"
  | "referrals"
  | "repeat_customers"
  | "imported_or_other";

export interface JobSourceReportingQuery {
  startDate: string;
  endDate: string;
}

export interface JobSourceChannelSummary {
  channel: JobGrowthChannel;
  label: string;
  bookedJobCount: number;
  revenue: string;
  shareOfBookedJobs: number;
  jobIds: string[];
}

export interface JobSourceReportingSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totals: {
    bookedJobCount: number;
    revenue: string;
    unknownAttributionCount: number;
  };
  channels: JobSourceChannelSummary[];
}
