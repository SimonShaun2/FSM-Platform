import { and, eq, isNull } from "drizzle-orm";
import pino from "pino";

import {
  bookingSettings,
  companies,
  customers,
  db,
  emitEventWithExecutor,
  jobs,
  reviewRequests,
  technicians,
  users
} from "@fsm/db";
import { notificationsQueue } from "@fsm/jobs";
import {
  AppError,
  ErrorCode,
  type CompleteReviewRequestInput,
  type CreateReviewRequestInput,
  type ListReviewRequestsQuery,
  type PaginatedResult,
  type PublicReviewLanding,
  type ReviewRequest,
  type ReviewRequestListItem,
  type UpdateReviewRequestInput
} from "@fsm/types";

type BookingSettingsRow = typeof bookingSettings.$inferSelect;
type CompanyRow = typeof companies.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;
type JobRow = typeof jobs.$inferSelect;
type ReviewRequestRow = typeof reviewRequests.$inferSelect;
type TechnicianRow = typeof technicians.$inferSelect;
type UserRow = typeof users.$inferSelect;
type SelectExecutor = Pick<typeof db, "select">;
type TransactionExecutor = Pick<typeof db, "select" | "insert" | "update">;

export interface ReviewRequestFunnelStats {
  pending: number;
  sent: number;
  clicked: number;
  completed: number;
  declined: number;
}

const logger = pino({
  name: "review-request-service"
});

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function buildActorName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function normalizeOptionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function toReviewRequest(row: ReviewRequestRow): ReviewRequest {
  return {
    ...row,
    status: row.status as ReviewRequest["status"],
    channel: (row.channel ?? "sms") as ReviewRequest["channel"]
  };
}

async function getActor(companyId: string, actorId: string, executor: SelectExecutor): Promise<UserRow> {
  const [actor] = await executor
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, actorId), isNull(users.deletedAt)))
    .limit(1);

  if (!actor) {
    throw new AppError(ErrorCode.NOT_FOUND, "User not found");
  }

  return actor;
}

async function getCompanyRecord(companyId: string, executor: SelectExecutor): Promise<CompanyRow> {
  const [company] = await executor
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) {
    throw new AppError(ErrorCode.NOT_FOUND, "Company not found");
  }

  return company;
}

async function getJobRecord(companyId: string, jobId: string, executor: SelectExecutor): Promise<JobRow> {
  const [job] = await executor
    .select()
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.id, jobId), isNull(jobs.deletedAt)))
    .limit(1);

  if (!job) {
    throw new AppError(ErrorCode.NOT_FOUND, "Job not found");
  }

  return job;
}

async function getCustomerRecord(companyId: string, customerId: string, executor: SelectExecutor): Promise<CustomerRow> {
  const [customer] = await executor
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), eq(customers.id, customerId), isNull(customers.deletedAt)))
    .limit(1);

  if (!customer) {
    throw new AppError(ErrorCode.NOT_FOUND, "Customer not found");
  }

  return customer;
}

async function getTechnicianRecord(
  companyId: string,
  technicianId: string,
  executor: SelectExecutor
): Promise<TechnicianRow> {
  const [technician] = await executor
    .select()
    .from(technicians)
    .where(
      and(eq(technicians.companyId, companyId), eq(technicians.id, technicianId), isNull(technicians.deletedAt))
    )
    .limit(1);

  if (!technician) {
    throw new AppError(ErrorCode.NOT_FOUND, "Technician not found");
  }

  return technician;
}

async function getBookingSettingsRecord(companyId: string, executor: SelectExecutor): Promise<BookingSettingsRow | null> {
  const [settings] = await executor
    .select()
    .from(bookingSettings)
    .where(and(eq(bookingSettings.companyId, companyId), isNull(bookingSettings.deletedAt)))
    .limit(1);

  return settings ?? null;
}

async function getReviewRequestRecord(
  companyId: string,
  reviewRequestId: string,
  executor: SelectExecutor
): Promise<ReviewRequestRow> {
  const [reviewRequest] = await executor
    .select()
    .from(reviewRequests)
    .where(
      and(
        eq(reviewRequests.companyId, companyId),
        eq(reviewRequests.id, reviewRequestId),
        isNull(reviewRequests.deletedAt)
      )
    )
    .limit(1);

  if (!reviewRequest) {
    throw new AppError(ErrorCode.NOT_FOUND, "Review request not found");
  }

  return reviewRequest;
}

export async function createReviewRequest(
  companyId: string,
  actorId: string,
  jobId: string,
  input: CreateReviewRequestInput
): Promise<ReviewRequest> {
  const result = await db.transaction(async (tx: TransactionExecutor) => {
    const actor = await getActor(companyId, actorId, tx);
    const job = await getJobRecord(companyId, jobId, tx);
    const [customer, company, technician] = await Promise.all([
      getCustomerRecord(companyId, job.customerId, tx),
      getCompanyRecord(companyId, tx),
      job.technicianId ? getTechnicianRecord(companyId, job.technicianId, tx) : Promise.resolve(null)
    ]);
    const settings = await getBookingSettingsRecord(companyId, tx);
    const channel = input.channel ?? "sms";
    const now = new Date();
    const [existingOpenRequest] = (await tx
      .select()
      .from(reviewRequests)
      .where(
        and(
          eq(reviewRequests.companyId, companyId),
          eq(reviewRequests.jobId, jobId),
          isNull(reviewRequests.deletedAt)
        )
      ))
      .filter((reviewRequest) => reviewRequest.status !== "completed" && reviewRequest.status !== "declined");

    if (existingOpenRequest) {
      throw new AppError(ErrorCode.CONFLICT, "A review request is already open for this job");
    }

    const primaryReviewUrl =
      settings?.googleReviewUrl ?? settings?.yelpReviewUrl ?? settings?.facebookReviewUrl ?? null;
    const insertedRequests = await tx
      .insert(reviewRequests)
      .values({
        companyId,
        jobId: job.id,
        customerId: job.customerId,
        technicianId: job.technicianId,
        status: "sent",
        channel,
        reviewUrl: primaryReviewUrl,
        sentAt: now
      })
      .returning();
    const reviewRequest = insertedRequests[0];

    if (!reviewRequest) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create review request");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "review_request.sent",
      actorId: actor.id,
      actorType: "user",
      actorName: buildActorName(actor.firstName, actor.lastName),
      entityType: "review_request",
      entityId: reviewRequest.id,
      customerId: reviewRequest.customerId,
      jobId: reviewRequest.jobId,
      payload: {
        reviewRequestId: reviewRequest.id,
        referenceId: reviewRequest.referenceId,
        channel
      },
      summary: `Review request sent for ${job.jobNumber}`
    });

    return {
      reviewRequest: toReviewRequest(reviewRequest),
      queueData: {
        companyId,
        reviewRequestId: reviewRequest.id,
        customerId: reviewRequest.customerId,
        customerPhone: customer.phone,
        referenceId: reviewRequest.referenceId,
        companyName: company.name,
        technicianName: technician ? `${technician.firstName} ${technician.lastName}`.trim() : null
      }
    };
  });

  await notificationsQueue.add("send-review-request", result.queueData);
  logger.info({ companyId, jobId, reviewRequestId: result.reviewRequest.id }, "Queued review request");
  return result.reviewRequest;
}

export async function listReviewRequests(
  companyId: string,
  query: ListReviewRequestsQuery
): Promise<{ result: PaginatedResult<ReviewRequestListItem>; stats: ReviewRequestFunnelStats }> {
  const page = query.page && query.page > 0 ? query.page : DEFAULT_PAGE;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, MAX_LIMIT) : DEFAULT_LIMIT;

  const [rows, customerRows, technicianRows, jobRows] = await Promise.all([
    db
      .select()
      .from(reviewRequests)
      .where(and(eq(reviewRequests.companyId, companyId), isNull(reviewRequests.deletedAt))),
    db.select().from(customers).where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt))),
    db.select().from(technicians).where(and(eq(technicians.companyId, companyId), isNull(technicians.deletedAt))),
    db.select().from(jobs).where(and(eq(jobs.companyId, companyId), isNull(jobs.deletedAt)))
  ]);

  const filteredRows = rows
    .filter((row) => (query.status ? row.status === query.status : true))
    .filter((row) => (query.channel ? row.channel === query.channel : true))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  const customerById = new Map(customerRows.map((customer) => [customer.id, customer]));
  const technicianById = new Map(technicianRows.map((technician) => [technician.id, technician]));
  const jobById = new Map(jobRows.map((job) => [job.id, job]));
  const total = filteredRows.length;
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const data = filteredRows.slice(startIndex, startIndex + limit).map((row) => {
    const customer = customerById.get(row.customerId);
    const technician = row.technicianId ? technicianById.get(row.technicianId) : null;
    const job = row.jobId ? jobById.get(row.jobId) : null;

    return {
      id: row.id,
      referenceId: row.referenceId,
      status: row.status as ReviewRequestListItem["status"],
      channel: (row.channel ?? "sms") as ReviewRequestListItem["channel"],
      sentAt: row.sentAt,
      completedAt: row.completedAt,
      rating: row.rating,
      customer: {
        id: customer?.id ?? row.customerId,
        firstName: customer?.firstName ?? "",
        lastName: customer?.lastName ?? "",
        phone: customer?.phone ?? null,
        email: customer?.email ?? null
      },
      technician: technician
        ? {
            id: technician.id,
            firstName: technician.firstName,
            lastName: technician.lastName
          }
        : null,
      job: job
        ? {
            id: job.id,
            jobNumber: job.jobNumber,
            title: job.title
          }
        : null,
      createdAt: row.createdAt
    };
  });

  const stats: ReviewRequestFunnelStats = {
    pending: rows.filter((row) => row.status === "pending").length,
    sent: rows.filter((row) => row.status === "sent").length,
    clicked: rows.filter((row) => row.status === "clicked").length,
    completed: rows.filter((row) => row.status === "completed").length,
    declined: rows.filter((row) => row.status === "declined").length
  };

  return {
    result: {
      data,
      total,
      page,
      limit,
      totalPages
    },
    stats
  };
}

export async function updateReviewRequest(
  companyId: string,
  actorId: string,
  reviewRequestId: string,
  input: UpdateReviewRequestInput
): Promise<ReviewRequest> {
  return db.transaction(async (tx: TransactionExecutor) => {
    const actor = await getActor(companyId, actorId, tx);
    const reviewRequest = await getReviewRequestRecord(companyId, reviewRequestId, tx);
    const nextStatus = input.status ?? reviewRequest.status;
    const now = new Date();
    const updatedRows = await tx
      .update(reviewRequests)
      .set({
        status: nextStatus,
        rating: input.rating ?? reviewRequest.rating,
        reviewText: normalizeOptionalString(input.reviewText) ?? reviewRequest.reviewText,
        completedAt:
          nextStatus === "completed" && reviewRequest.completedAt === null ? now : reviewRequest.completedAt,
        updatedAt: now
      })
      .where(
        and(
          eq(reviewRequests.companyId, companyId),
          eq(reviewRequests.id, reviewRequestId),
          isNull(reviewRequests.deletedAt)
        )
      )
      .returning();
    const updatedReviewRequest = updatedRows[0];

    if (!updatedReviewRequest) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to update review request");
    }

    if (nextStatus === "completed" && reviewRequest.status !== "completed") {
      await emitEventWithExecutor(tx, {
        companyId,
        eventType: "review_request.completed",
        actorId: actor.id,
        actorType: "user",
        actorName: buildActorName(actor.firstName, actor.lastName),
        entityType: "review_request",
        entityId: updatedReviewRequest.id,
        customerId: updatedReviewRequest.customerId,
        jobId: updatedReviewRequest.jobId,
        payload: {
          rating: updatedReviewRequest.rating
        },
        summary: "Review request completed"
      });
    }

    return toReviewRequest(updatedReviewRequest);
  });
}

export async function getPublicReviewLanding(referenceId: string): Promise<PublicReviewLanding> {
  const [reviewRequest] = await db
    .select()
    .from(reviewRequests)
    .where(and(eq(reviewRequests.referenceId, referenceId), isNull(reviewRequests.deletedAt)))
    .limit(1);

  if (!reviewRequest) {
    throw new AppError(ErrorCode.NOT_FOUND, "Review request not found");
  }

  const [company, technician, settings] = await Promise.all([
    getCompanyRecord(reviewRequest.companyId, db),
    reviewRequest.technicianId
      ? getTechnicianRecord(reviewRequest.companyId, reviewRequest.technicianId, db)
      : Promise.resolve(null),
    getBookingSettingsRecord(reviewRequest.companyId, db)
  ]);

  return {
    reviewRequestId: reviewRequest.id,
    companyName: company.name,
    technicianName: technician ? `${technician.firstName} ${technician.lastName}`.trim() : null,
    status: reviewRequest.status as PublicReviewLanding["status"],
    reviewLinks: {
      google: settings?.googleReviewUrl ?? null,
      yelp: settings?.yelpReviewUrl ?? null,
      facebook: settings?.facebookReviewUrl ?? null
    }
  };
}

export async function completePublicReviewRequest(
  referenceId: string,
  input: CompleteReviewRequestInput
): Promise<ReviewRequest> {
  return db.transaction(async (tx: TransactionExecutor) => {
    const [reviewRequest] = await tx
      .select()
      .from(reviewRequests)
      .where(and(eq(reviewRequests.referenceId, referenceId), isNull(reviewRequests.deletedAt)))
      .limit(1);

    if (!reviewRequest) {
      throw new AppError(ErrorCode.NOT_FOUND, "Review request not found");
    }

    const now = new Date();
    const updatedRows = await tx
      .update(reviewRequests)
      .set({
        status: "completed",
        clickedAt: reviewRequest.clickedAt ?? now,
        completedAt: now,
        rating: input.rating,
        reviewText: normalizeOptionalString(input.reviewText) ?? null,
        updatedAt: now
      })
      .where(
        and(
          eq(reviewRequests.companyId, reviewRequest.companyId),
          eq(reviewRequests.id, reviewRequest.id),
          isNull(reviewRequests.deletedAt)
        )
      )
      .returning();
    const updatedReviewRequest = updatedRows[0];

    if (!updatedReviewRequest) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to complete review request");
    }

    await emitEventWithExecutor(tx, {
      companyId: updatedReviewRequest.companyId,
      eventType: "review_request.completed",
      actorType: "customer",
      entityType: "review_request",
      entityId: updatedReviewRequest.id,
      customerId: updatedReviewRequest.customerId,
      jobId: updatedReviewRequest.jobId,
      payload: {
        rating: updatedReviewRequest.rating
      },
      summary: "Review request completed"
    });

    return toReviewRequest(updatedReviewRequest);
  });
}
