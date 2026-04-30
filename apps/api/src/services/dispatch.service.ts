import { and, eq, isNull } from "drizzle-orm";

import {
  aiRecommendations,
  customers,
  db,
  estimates,
  jobs,
  properties,
  technicians
} from "@fsm/db";
import { redisConnection } from "@fsm/jobs";
import {
  AppError,
  type ApprovedUnconvertedEstimate,
  type DispatchNextBestJob,
  type DispatchView,
  type DispatchWorkloadRow,
  ErrorCode,
  type UnscheduledJob
} from "@fsm/types";

const DISPATCH_CACHE_TTL_SECONDS = 60;
const TERMINAL_JOB_STATUSES = new Set(["completed", "invoiced", "paid", "cancelled", "closed"]);
const ACTIVE_UNSCHEDULED_JOB_STATUSES = new Set([
  "lead",
  "estimate_requested",
  "estimate_sent",
  "estimate_approved",
  "on_hold"
]);

type AiRecommendationRow = typeof aiRecommendations.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;
type EstimateRow = typeof estimates.$inferSelect;
type JobRow = typeof jobs.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type TechnicianRow = typeof technicians.$inferSelect;

function assertIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "date must be in YYYY-MM-DD format");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "date must be in YYYY-MM-DD format");
  }

  return value;
}

function getDayBounds(date: string): { start: Date; end: Date } {
  return {
    start: new Date(`${date}T00:00:00.000Z`),
    end: new Date(`${date}T23:59:59.999Z`)
  };
}

function isDateInRange(value: Date | null, start: Date, end: Date): boolean {
  if (!value) {
    return false;
  }

  const timestamp = value.getTime();
  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function parseHoursPerDay(value: string | null): number {
  const parsed = Number(value ?? "8");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}

function buildNextBestReasoning(recommendation: AiRecommendationRow): string {
  const body = recommendation.body.trim();
  const headline = recommendation.headline.trim();
  return body.length > 0 ? `${headline}: ${body}` : headline;
}

function findSuggestedTechnician(
  customerId: string | null,
  customerById: Map<string, CustomerRow>,
  propertyByCustomerId: Map<string, PropertyRow>,
  companyTechnicians: TechnicianRow[]
): string | null {
  if (!customerId) {
    return null;
  }

  const property = propertyByCustomerId.get(customerId);
  const zip = property?.zip?.trim();

  if (!zip) {
    return null;
  }

  const matchingTechnician = companyTechnicians.find((technician) =>
    (technician.serviceZipCodes ?? []).includes(zip)
  );

  return matchingTechnician?.id ?? null;
}

function buildCachedDispatchKey(companyId: string, date: string): string {
  return `dispatch:${companyId}:${date}`;
}

export function buildDispatchCacheKey(companyId: string, date: string): string {
  return buildCachedDispatchKey(companyId, assertIsoDate(date));
}

export async function invalidateDispatchCache(companyId: string, date: string | null | undefined): Promise<void> {
  if (!date) {
    return;
  }

  await redisConnection.del(buildCachedDispatchKey(companyId, date));
}

async function loadDispatchBaseData(companyId: string) {
  const [companyJobs, companyCustomers, companyProperties, companyTechnicians, pendingRecommendations] =
    await Promise.all([
      db.select().from(jobs).where(and(eq(jobs.companyId, companyId), isNull(jobs.deletedAt))),
      db.select().from(customers).where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt))),
      db.select().from(properties).where(and(eq(properties.companyId, companyId), isNull(properties.deletedAt))),
      db.select().from(technicians).where(and(eq(technicians.companyId, companyId), isNull(technicians.deletedAt))),
      db
        .select()
        .from(aiRecommendations)
        .where(and(eq(aiRecommendations.companyId, companyId), isNull(aiRecommendations.deletedAt)))
    ]);

  return {
    companyJobs,
    companyCustomers,
    companyProperties,
    companyTechnicians,
    pendingRecommendations
  };
}

function buildDispatchViewPayload(
  companyJobs: JobRow[],
  companyCustomers: CustomerRow[],
  companyProperties: PropertyRow[],
  companyTechnicians: TechnicianRow[],
  pendingRecommendations: AiRecommendationRow[],
  date: string
): DispatchView {
  const { start, end } = getDayBounds(date);
  const customerById = new Map(companyCustomers.map((customer) => [customer.id, customer]));
  const propertyById = new Map(companyProperties.map((property) => [property.id, property]));
  const propertyByCustomerId = new Map(companyProperties.map((property) => [property.customerId, property]));
  const dayJobs = companyJobs.filter((job) => {
    if (!job.technicianId || job.status === "cancelled") {
      return false;
    }

    return isDateInRange(job.scheduledStart, start, end);
  });
  const jobsByTechnicianId = new Map<string, JobRow[]>();

  for (const job of dayJobs) {
    const technicianJobs = jobsByTechnicianId.get(job.technicianId as string) ?? [];
    technicianJobs.push(job);
    jobsByTechnicianId.set(job.technicianId as string, technicianJobs);
  }

  const techniciansForDay = companyTechnicians
    .filter((technician) => technician.status !== "inactive")
    .map((technician) => {
      const technicianJobs = (jobsByTechnicianId.get(technician.id) ?? [])
        .slice()
        .sort((left, right) => {
          const leftStart = left.scheduledStart?.getTime() ?? 0;
          const rightStart = right.scheduledStart?.getTime() ?? 0;
          return leftStart - rightStart;
        });
      const scheduledMinutes = technicianJobs.reduce((sum, job) => {
        if (!job.scheduledStart || !job.scheduledEnd) {
          return sum;
        }

        return sum + minutesBetween(job.scheduledStart, job.scheduledEnd);
      }, 0);
      const hoursAvailable = parseHoursPerDay(technician.hoursPerDay);
      const hoursScheduled = Number((scheduledMinutes / 60).toFixed(2));
      const utilization =
        hoursAvailable <= 0 ? 0 : Math.round((scheduledMinutes / (hoursAvailable * 60)) * 100);

      return {
        id: technician.id,
        name: `${technician.firstName} ${technician.lastName}`.trim(),
        avatarUrl: technician.avatarUrl,
        serviceAreaIds: technician.serviceAreaIds ?? [],
        serviceZipCodes: technician.serviceZipCodes ?? [],
        utilization,
        hoursAvailable,
        hoursScheduled,
        jobs: technicianJobs.map((job) => {
          const customer = customerById.get(job.customerId);
          const property = job.propertyId ? propertyById.get(job.propertyId) ?? null : null;

          return {
            id: job.id,
            jobNumber: job.jobNumber,
            title: job.title,
            status: job.status,
            scheduledStart: job.scheduledStart?.toISOString() ?? start.toISOString(),
            scheduledEnd: job.scheduledEnd?.toISOString() ?? start.toISOString(),
            customer: {
              id: customer?.id ?? job.customerId,
              firstName: customer?.firstName ?? "",
              lastName: customer?.lastName ?? ""
            },
            property: property
              ? {
                  addressLine1: property.addressLine1,
                  city: property.city
                }
              : null,
            estimatedValue: job.estimateTotal ?? job.invoiceTotal ?? null
          };
        }),
        gaps: technicianJobs.slice(1).flatMap((job, index) => {
          const previous = technicianJobs[index];

          if (!previous?.scheduledEnd || !job.scheduledStart) {
            return [];
          }

          const durationMinutes = minutesBetween(previous.scheduledEnd, job.scheduledStart);

          if (durationMinutes <= 0) {
            return [];
          }

          return [{
            start: previous.scheduledEnd.toISOString(),
            end: job.scheduledStart.toISOString(),
            durationMinutes
          }];
        })
      };
    });

  const unscheduledJobsByCustomerId = new Map(
    companyJobs
      .filter((job) => !job.scheduledStart && ACTIVE_UNSCHEDULED_JOB_STATUSES.has(job.status))
      .map((job) => [job.customerId, job])
  );

  const nextBestJobs: DispatchNextBestJob[] = pendingRecommendations
    .filter((recommendation) => recommendation.status === "pending")
    .filter((recommendation) => {
      if (!recommendation.snoozedUntil) {
        return true;
      }

      return recommendation.snoozedUntil.getTime() <= Date.now();
    })
    .map((recommendation) => {
      const linkedJob =
        (recommendation.jobId
          ? companyJobs.find((job) => job.id === recommendation.jobId)
          : null) ??
        (recommendation.customerId ? unscheduledJobsByCustomerId.get(recommendation.customerId) ?? null : null);
      const customer = recommendation.customerId ? customerById.get(recommendation.customerId) : null;

      return {
        jobId: linkedJob?.id ?? recommendation.id,
        jobNumber: linkedJob?.jobNumber ?? "UNSCHEDULED",
        customer: customer ? `${customer.firstName} ${customer.lastName}`.trim() : "Unknown customer",
        estimatedValue: recommendation.estimatedRevenue ?? linkedJob?.estimateTotal ?? linkedJob?.invoiceTotal ?? null,
        urgencyScore: recommendation.urgencyScore ?? 0,
        suggestedTechId: findSuggestedTechnician(
          recommendation.customerId,
          customerById,
          propertyByCustomerId,
          companyTechnicians
        ),
        reasoningText: buildNextBestReasoning(recommendation)
      };
    })
    .sort((left, right) => right.urgencyScore - left.urgencyScore);

  return {
    date,
    technicians: techniciansForDay,
    nextBestJobs
  };
}

export async function getDispatchView(companyId: string, date: string): Promise<DispatchView> {
  const normalizedDate = assertIsoDate(date);
  const cacheKey = buildCachedDispatchKey(companyId, normalizedDate);
  const cachedValue = await redisConnection.get(cacheKey);

  if (cachedValue) {
    return JSON.parse(cachedValue) as DispatchView;
  }

  const { companyJobs, companyCustomers, companyProperties, companyTechnicians, pendingRecommendations } =
    await loadDispatchBaseData(companyId);
  const payload = buildDispatchViewPayload(
    companyJobs,
    companyCustomers,
    companyProperties,
    companyTechnicians,
    pendingRecommendations,
    normalizedDate
  );

  await redisConnection.set(cacheKey, JSON.stringify(payload), "EX", DISPATCH_CACHE_TTL_SECONDS);
  return payload;
}

export async function getDispatchWorkload(companyId: string, date: string): Promise<DispatchWorkloadRow[]> {
  const dispatchView = await getDispatchView(companyId, date);

  return dispatchView.technicians.map((technician) => ({
    technicianId: technician.id,
    technicianName: technician.name,
    utilization: technician.utilization,
    hoursAvailable: technician.hoursAvailable,
    hoursScheduled: technician.hoursScheduled,
    jobCount: technician.jobs.length
  }));
}

export async function listUnscheduledJobs(companyId: string): Promise<UnscheduledJob[]> {
  const [companyJobs, companyCustomers] = await Promise.all([
    db.select().from(jobs).where(and(eq(jobs.companyId, companyId), isNull(jobs.deletedAt))),
    db.select().from(customers).where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
  ]);
  const customerById = new Map(companyCustomers.map((customer) => [customer.id, customer]));

  return companyJobs
    .filter((job) => !job.scheduledStart && ACTIVE_UNSCHEDULED_JOB_STATUSES.has(job.status))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map((job) => {
      const customer = customerById.get(job.customerId);

      return {
        id: job.id,
        jobNumber: job.jobNumber,
        title: job.title,
        status: job.status,
        priority: job.priority,
        customer: {
          id: customer?.id ?? job.customerId,
          firstName: customer?.firstName ?? "",
          lastName: customer?.lastName ?? ""
        },
        createdAt: job.createdAt
      };
    });
}

export async function listApprovedUnconvertedEstimates(
  companyId: string
): Promise<ApprovedUnconvertedEstimate[]> {
  const [companyEstimates, companyCustomers] = await Promise.all([
    db.select().from(estimates).where(and(eq(estimates.companyId, companyId), isNull(estimates.deletedAt))),
    db.select().from(customers).where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
  ]);
  const customerById = new Map(companyCustomers.map((customer) => [customer.id, customer]));

  return companyEstimates
    .filter((estimate) => estimate.status === "approved" && estimate.jobId === null)
    .sort((left, right) => {
      const leftTime = left.updatedAt.getTime();
      const rightTime = right.updatedAt.getTime();
      return rightTime - leftTime;
    })
    .map((estimate: EstimateRow) => {
      const customer = customerById.get(estimate.customerId);

      return {
        id: estimate.id,
        estimateNumber: estimate.estimateNumber,
        title: estimate.title,
        total: estimate.total,
        approvedAt: estimate.approvedAt ?? estimate.updatedAt,
        customer: {
          id: customer?.id ?? estimate.customerId,
          firstName: customer?.firstName ?? "",
          lastName: customer?.lastName ?? ""
        }
      };
    });
}

export function getDispatchAutoFitMessage(): { message: string } {
  return {
    message: "Auto-fit coming in TICKET-020"
  };
}
