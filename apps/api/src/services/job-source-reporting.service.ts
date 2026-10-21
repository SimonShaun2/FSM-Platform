import { and, eq, isNull } from "drizzle-orm";
import { Decimal } from "decimal.js";

import { customers, db, jobs } from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type JobGrowthChannel,
  type JobSourceChannelSummary,
  type JobSourceReportingQuery,
  type JobSourceReportingSummary,
  type JobStatus
} from "@fsm/types";

type JobRow = typeof jobs.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;

const BOOKED_JOB_STATUSES = new Set<JobStatus>([
  "estimate_approved",
  "scheduled",
  "dispatched",
  "in_progress",
  "on_hold",
  "completed",
  "invoiced",
  "paid"
]);

const PRIOR_JOB_STATUSES_FOR_REPEAT = new Set<JobStatus>([
  "estimate_approved",
  "scheduled",
  "dispatched",
  "in_progress",
  "on_hold",
  "completed",
  "invoiced",
  "paid",
  "closed"
]);

const CHANNEL_ORDER: JobGrowthChannel[] = [
  "own_website",
  "booking",
  "referrals",
  "repeat_customers",
  "imported_or_other"
];

const CHANNEL_LABELS: Record<JobGrowthChannel, string> = {
  own_website: "Own website",
  booking: "Online booking",
  referrals: "Referrals",
  repeat_customers: "Repeat customers",
  imported_or_other: "Imported or other"
};

const BOOKING_LEAD_SOURCES = new Set([
  "google",
  "facebook",
  "instagram",
  "yelp",
  "qr_code",
  "booking",
  "online_booking",
  "online"
]);

const OWN_WEBSITE_LEAD_SOURCES = new Set([
  "website",
  "direct",
  "direct_web",
  "gbp",
  "branded_site",
  "web_form"
]);

const REFERRAL_LEAD_SOURCES = new Set(["referral", "referred", "word_of_mouth"]);

function parseReportingDate(value: string, boundary: "start" | "end"): Date {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/u.test(trimmed)) {
    return boundary === "start"
      ? new Date(`${trimmed}T00:00:00.000Z`)
      : new Date(`${trimmed}T23:59:59.999Z`);
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "startDate and endDate must be valid ISO dates");
  }

  return parsed;
}

function normalizeLeadSource(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function getJobActivityDate(job: JobRow): Date {
  return job.scheduledStart ?? job.createdAt;
}

function getJobRevenue(job: JobRow): Decimal {
  const paid = new Decimal(job.amountPaid ?? "0");
  if (paid.gt(0)) {
    return paid;
  }

  const invoiced = new Decimal(job.invoiceTotal ?? "0");
  if (invoiced.gt(0)) {
    return invoiced;
  }

  return new Decimal(job.estimateTotal ?? "0");
}

function formatMoney(amount: Decimal): string {
  return amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function classifyJobGrowthChannel(input: {
  job: Pick<JobRow, "leadSource" | "importSessionId" | "customerId" | "createdAt" | "status">;
  customer: Pick<CustomerRow, "referredBy" | "leadSource"> | null;
  hasPriorBookedJob: boolean;
}): JobGrowthChannel {
  if (input.job.importSessionId) {
    return "imported_or_other";
  }

  if (input.hasPriorBookedJob) {
    return "repeat_customers";
  }

  const leadSource =
    normalizeLeadSource(input.job.leadSource) ?? normalizeLeadSource(input.customer?.leadSource);

  if (leadSource && REFERRAL_LEAD_SOURCES.has(leadSource)) {
    return "referrals";
  }

  if (input.customer?.referredBy) {
    return "referrals";
  }

  if (leadSource && BOOKING_LEAD_SOURCES.has(leadSource)) {
    return "booking";
  }

  if (leadSource && OWN_WEBSITE_LEAD_SOURCES.has(leadSource)) {
    return "own_website";
  }

  if (leadSource?.includes("booking")) {
    return "booking";
  }

  if (leadSource?.includes("refer")) {
    return "referrals";
  }

  return "imported_or_other";
}

function isUnknownAttribution(job: Pick<JobRow, "leadSource" | "importSessionId">, customer: CustomerRow | null): boolean {
  if (job.importSessionId) {
    return false;
  }

  const jobSource = normalizeLeadSource(job.leadSource);
  const customerSource = normalizeLeadSource(customer?.leadSource);

  return !jobSource && !customerSource && !customer?.referredBy;
}

export async function getJobSourceReportingSummary(
  companyId: string,
  query: JobSourceReportingQuery
): Promise<JobSourceReportingSummary> {
  const start = parseReportingDate(query.startDate, "start");
  const end = parseReportingDate(query.endDate, "end");

  if (start > end) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "startDate must be on or before endDate");
  }

  const jobRows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), isNull(jobs.deletedAt)));

  const customerRows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)));

  const customerById = new Map(customerRows.map((customer) => [customer.id, customer]));

  const priorBookedByCustomer = new Map<string, number>();

  for (const job of jobRows) {
    if (job.status === "cancelled" || job.createdAt >= start) {
      continue;
    }

    if (!PRIOR_JOB_STATUSES_FOR_REPEAT.has(job.status as JobStatus)) {
      continue;
    }

    priorBookedByCustomer.set(job.customerId, (priorBookedByCustomer.get(job.customerId) ?? 0) + 1);
  }

  const channelBuckets = new Map<JobGrowthChannel, { count: number; revenue: Decimal; jobIds: string[] }>(
    CHANNEL_ORDER.map((channel) => [channel, { count: 0, revenue: new Decimal(0), jobIds: [] }])
  );

  const bookedJobsByCustomer = new Map<string, JobRow[]>();

  for (const job of jobRows) {
    if (job.status === "cancelled") {
      continue;
    }

    if (!BOOKED_JOB_STATUSES.has(job.status as JobStatus)) {
      continue;
    }

    const existing = bookedJobsByCustomer.get(job.customerId) ?? [];
    existing.push(job);
    bookedJobsByCustomer.set(job.customerId, existing);
  }

  for (const customerJobs of bookedJobsByCustomer.values()) {
    customerJobs.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  let bookedJobCount = 0;
  let totalRevenue = new Decimal(0);
  let unknownAttributionCount = 0;

  for (const job of jobRows) {
    if (job.status === "cancelled") {
      continue;
    }

    const activityDate = getJobActivityDate(job);

    if (activityDate < start || activityDate > end) {
      continue;
    }

    if (!BOOKED_JOB_STATUSES.has(job.status as JobStatus)) {
      continue;
    }

    const customer = customerById.get(job.customerId) ?? null;
    const priorCount = priorBookedByCustomer.get(job.customerId) ?? 0;
    const customerJobs = bookedJobsByCustomer.get(job.customerId) ?? [];
    const jobIndex = customerJobs.findIndex((candidate) => candidate.id === job.id);
    const hasPriorBookedJob = priorCount > 0 || jobIndex > 0;

    const channel = classifyJobGrowthChannel({
      job,
      customer,
      hasPriorBookedJob
    });

    const revenue = getJobRevenue(job);
    const bucket = channelBuckets.get(channel);

    if (!bucket) {
      continue;
    }

    bucket.count += 1;
    bucket.revenue = bucket.revenue.plus(revenue);
    bucket.jobIds.push(job.id);

    bookedJobCount += 1;
    totalRevenue = totalRevenue.plus(revenue);

    if (isUnknownAttribution(job, customer)) {
      unknownAttributionCount += 1;
    }
  }

  const channels: JobSourceChannelSummary[] = CHANNEL_ORDER.map((channel) => {
    const bucket = channelBuckets.get(channel) ?? { count: 0, revenue: new Decimal(0), jobIds: [] };
    const shareOfBookedJobs =
      bookedJobCount > 0 ? Math.round((bucket.count / bookedJobCount) * 10_000) / 100 : 0;

    return {
      channel,
      label: CHANNEL_LABELS[channel],
      bookedJobCount: bucket.count,
      revenue: formatMoney(bucket.revenue),
      shareOfBookedJobs,
      jobIds: bucket.jobIds
    };
  });

  return {
    period: {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    },
    totals: {
      bookedJobCount,
      revenue: formatMoney(totalRevenue),
      unknownAttributionCount
    },
    channels
  };
}
