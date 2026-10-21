import { and, desc, eq, isNull } from "drizzle-orm";

import { bookingHandoffs, bookingRequests, db, emitEventWithExecutor, users } from "@fsm/db";
import {
  AppError,
  type BookingHandoff,
  type InitiateBookingHandoffInput,
  type ReconcileBookingHandoffInput,
  ErrorCode
} from "@fsm/types";

type BookingHandoffRow = typeof bookingHandoffs.$inferSelect;

const TERMINAL_BOOKING_STATUSES = new Set(["confirmed", "cancelled", "completed", "no_show"]);

function toBookingHandoff(row: BookingHandoffRow): BookingHandoff {
  return {
    id: row.id,
    companyId: row.companyId,
    bookingRequestId: row.bookingRequestId,
    targetSystem: row.targetSystem,
    status: row.status,
    externalReference: row.externalReference ?? null,
    failureReason: row.failureReason ?? null,
    operatorNotes: row.operatorNotes ?? null,
    initiatedById: row.initiatedById,
    reconciledById: row.reconciledById ?? null,
    reconciledAt: row.reconciledAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null
  };
}

type DbExecutor = Pick<typeof db, "select">;

async function getActorName(companyId: string, actorId: string, executor: DbExecutor = db): Promise<string> {
  const [actor] = await executor
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, actorId), isNull(users.deletedAt)))
    .limit(1);

  if (!actor) {
    return "Operator";
  }

  return [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() || "Operator";
}

async function getPendingBookingRequest(
  companyId: string,
  bookingRequestId: string,
  executor: DbExecutor = db
) {
  const [bookingRequest] = await executor
    .select()
    .from(bookingRequests)
    .where(
      and(
        eq(bookingRequests.companyId, companyId),
        eq(bookingRequests.id, bookingRequestId),
        isNull(bookingRequests.deletedAt)
      )
    )
    .limit(1);

  if (!bookingRequest) {
    throw new AppError(ErrorCode.NOT_FOUND, "Booking request not found");
  }

  if (TERMINAL_BOOKING_STATUSES.has(bookingRequest.status)) {
    throw new AppError(ErrorCode.CONFLICT, "Only pending booking requests can be handed off");
  }

  return bookingRequest;
}

export async function getLatestBookingHandoff(
  companyId: string,
  bookingRequestId: string
): Promise<BookingHandoff | null> {
  const [row] = await db
    .select()
    .from(bookingHandoffs)
    .where(
      and(
        eq(bookingHandoffs.companyId, companyId),
        eq(bookingHandoffs.bookingRequestId, bookingRequestId),
        isNull(bookingHandoffs.deletedAt)
      )
    )
    .orderBy(desc(bookingHandoffs.createdAt))
    .limit(1);

  return row ? toBookingHandoff(row) : null;
}

export async function initiateBookingHandoff(
  companyId: string,
  actorId: string,
  bookingRequestId: string,
  input: InitiateBookingHandoffInput
): Promise<BookingHandoff> {
  const targetSystem = input.targetSystem.trim();

  if (targetSystem.length < 2 || targetSystem.length > 100) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "targetSystem must be between 2 and 100 characters");
  }

  return db.transaction(async (tx) => {
    await getPendingBookingRequest(companyId, bookingRequestId, tx);

    const [existingPending] = await tx
      .select()
      .from(bookingHandoffs)
      .where(
        and(
          eq(bookingHandoffs.companyId, companyId),
          eq(bookingHandoffs.bookingRequestId, bookingRequestId),
          eq(bookingHandoffs.status, "pending_external"),
          isNull(bookingHandoffs.deletedAt)
        )
      )
      .limit(1);

    if (existingPending) {
      throw new AppError(ErrorCode.CONFLICT, "A handoff is already pending for this booking request");
    }

    const actorName = await getActorName(companyId, actorId, tx);
    const inserted = await tx
      .insert(bookingHandoffs)
      .values({
        companyId,
        bookingRequestId,
        targetSystem,
        status: "pending_external",
        operatorNotes: input.operatorNotes?.trim() || null,
        initiatedById: actorId
      })
      .returning();

    const handoff = inserted[0];

    if (!handoff) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create booking handoff");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "booking.handoff_initiated",
      actorId,
      actorType: "user",
      actorName,
      entityType: "booking_handoff",
      entityId: handoff.id,
      payload: {
        bookingRequestId,
        targetSystem,
        operatorNotes: handoff.operatorNotes
      },
      summary: `Booking handoff to ${targetSystem} initiated (awaiting external confirmation)`
    });

    return toBookingHandoff(handoff);
  });
}

export async function reconcileBookingHandoff(
  companyId: string,
  actorId: string,
  bookingRequestId: string,
  handoffId: string,
  input: ReconcileBookingHandoffInput
): Promise<BookingHandoff> {
  if (input.outcome === "succeeded" && input.externalReference?.trim() === "") {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "externalReference is required when outcome is succeeded");
  }

  if (input.outcome === "failed" && !input.failureReason?.trim()) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "failureReason is required when outcome is failed");
  }

  return db.transaction(async (tx) => {
    await getPendingBookingRequest(companyId, bookingRequestId, tx);

    const [handoff] = await tx
      .select()
      .from(bookingHandoffs)
      .where(
        and(
          eq(bookingHandoffs.companyId, companyId),
          eq(bookingHandoffs.id, handoffId),
          eq(bookingHandoffs.bookingRequestId, bookingRequestId),
          isNull(bookingHandoffs.deletedAt)
        )
      )
      .limit(1);

    if (!handoff) {
      throw new AppError(ErrorCode.NOT_FOUND, "Booking handoff not found");
    }

    if (handoff.status !== "pending_external") {
      throw new AppError(ErrorCode.CONFLICT, "Only pending handoffs can be reconciled");
    }

    const actorName = await getActorName(companyId, actorId, tx);
    const reconciledAt = new Date();
    const nextStatus = input.outcome === "succeeded" ? "succeeded" : "failed";

    const updatedRows = await tx
      .update(bookingHandoffs)
      .set({
        status: nextStatus,
        externalReference: input.externalReference?.trim() || null,
        failureReason: input.failureReason?.trim() || null,
        reconciledById: actorId,
        reconciledAt,
        updatedAt: reconciledAt
      })
      .where(eq(bookingHandoffs.id, handoff.id))
      .returning();

    const updated = updatedRows[0];

    if (!updated) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to reconcile booking handoff");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "booking.handoff_reconciled",
      actorId,
      actorType: "user",
      actorName,
      entityType: "booking_handoff",
      entityId: updated.id,
      payload: {
        bookingRequestId,
        outcome: input.outcome,
        externalReference: updated.externalReference,
        failureReason: updated.failureReason,
        targetSystem: updated.targetSystem
      },
      summary:
        input.outcome === "succeeded"
          ? `External booking confirmed in ${updated.targetSystem}`
          : `External booking handoff failed for ${updated.targetSystem}`
    });

    return toBookingHandoff(updated);
  });
}
