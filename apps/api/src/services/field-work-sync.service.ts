import { createHash } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import {
  db,
  emitEventWithExecutor,
  fieldSyncBatches,
  fieldSyncOperations,
  jobs,
  jobTasks,
  technicians
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  FIELD_WORK_SYNC_CONTRACT_VERSION,
  type FieldWorkSyncOperationInput,
  type FieldWorkSyncOperationOutcome,
  type SubmitFieldWorkSyncBatchBody,
  type SubmitFieldWorkSyncBatchResponse,
  buildRecordVersionV1,
  isStaleRecordVersion,
  parseRecordVersionV1,
  type UserRole
} from "@fsm/types";

import { addNote, addPhoto, transitionStatus } from "./job.service.js";
import { updateTask } from "./job-tasks.service.js";

type BatchRow = typeof fieldSyncBatches.$inferSelect;
type OperationRow = typeof fieldSyncOperations.$inferSelect;

export interface FieldWorkSyncActor {
  companyId: string;
  userId: string;
  role: UserRole;
}

function hashPayload(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function toOperationResult(row: OperationRow) {
  const resultPayload = row.resultPayload as Record<string, unknown>;
  return {
    clientOperationId: row.clientOperationId,
    sequence: row.sequence,
    outcome: row.outcome as FieldWorkSyncOperationOutcome,
    serverOperationId: row.id,
    recordVersion: typeof resultPayload.recordVersion === "string" ? resultPayload.recordVersion : undefined,
    entityId: typeof resultPayload.entityId === "string" ? resultPayload.entityId : undefined,
    message: typeof resultPayload.message === "string" ? resultPayload.message : undefined,
    conflict:
      resultPayload.conflict && typeof resultPayload.conflict === "object"
        ? (resultPayload.conflict as { liveRecordVersion: string; reason: string })
        : undefined
  };
}

async function assertJobFieldAccess(
  companyId: string,
  userId: string,
  role: UserRole,
  jobId: string
): Promise<void> {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.id, jobId), isNull(jobs.deletedAt)))
    .limit(1);

  if (!job) {
    throw new AppError(ErrorCode.NOT_FOUND, "Job not found");
  }

  if (role === "owner" || role === "admin" || role === "dispatcher") {
    return;
  }

  if (role === "technician") {
    const [technician] = await db
      .select()
      .from(technicians)
      .where(
        and(eq(technicians.companyId, companyId), eq(technicians.userId, userId), isNull(technicians.deletedAt))
      )
      .limit(1);

    if (!technician || job.technicianId !== technician.id) {
      throw new AppError(ErrorCode.FORBIDDEN, "You are not authorized to sync work for this job");
    }

    return;
  }

  throw new AppError(ErrorCode.FORBIDDEN, "You are not authorized to sync field work");
}

async function findExistingOperation(
  companyId: string,
  clientOperationId: string
): Promise<OperationRow | null> {
  const [row] = await db
    .select()
    .from(fieldSyncOperations)
    .where(
      and(
        eq(fieldSyncOperations.companyId, companyId),
        eq(fieldSyncOperations.clientOperationId, clientOperationId),
        isNull(fieldSyncOperations.deletedAt)
      )
    )
    .limit(1);

  return row ?? null;
}

async function resolveBatch(
  actor: FieldWorkSyncActor,
  input: SubmitFieldWorkSyncBatchBody
): Promise<BatchRow> {
  if (input.resumeBatchId) {
    const [resumed] = await db
      .select()
      .from(fieldSyncBatches)
      .where(
        and(
          eq(fieldSyncBatches.id, input.resumeBatchId),
          eq(fieldSyncBatches.companyId, actor.companyId),
          eq(fieldSyncBatches.userId, actor.userId),
          eq(fieldSyncBatches.deviceId, input.deviceId),
          isNull(fieldSyncBatches.deletedAt)
        )
      )
      .limit(1);

    if (!resumed) {
      throw new AppError(ErrorCode.NOT_FOUND, "Sync batch not found for resume");
    }

    if (resumed.batchClientId !== input.batchClientId) {
      throw new AppError(ErrorCode.CONFLICT, "batchClientId does not match resumed batch");
    }

    return resumed;
  }

  const [existing] = await db
    .select()
    .from(fieldSyncBatches)
    .where(
      and(
        eq(fieldSyncBatches.companyId, actor.companyId),
        eq(fieldSyncBatches.deviceId, input.deviceId),
        eq(fieldSyncBatches.batchClientId, input.batchClientId),
        isNull(fieldSyncBatches.deletedAt)
      )
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const inserted = await db
    .insert(fieldSyncBatches)
    .values({
      companyId: actor.companyId,
      userId: actor.userId,
      deviceId: input.deviceId,
      batchClientId: input.batchClientId,
      status: "open",
      lastAcknowledgedSequence: 0
    })
    .returning();

  const batch = inserted[0];
  if (!batch) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create sync batch");
  }

  return batch;
}

function conflictResult(
  sequence: number,
  clientOperationId: string,
  liveRecordVersion: string,
  reason: string
) {
  return {
    clientOperationId,
    sequence,
    outcome: "conflict" as const,
    conflict: { liveRecordVersion, reason }
  };
}

async function applyOperation(
  actor: FieldWorkSyncActor,
  operation: FieldWorkSyncOperationInput
): Promise<{
  outcome: FieldWorkSyncOperationOutcome;
  resultPayload: Record<string, unknown>;
}> {
  await assertJobFieldAccess(actor.companyId, actor.userId, actor.role, operation.jobId);

  switch (operation.type) {
    case "job.note.append": {
      const note = await addNote(actor.companyId, actor.userId, operation.jobId, {
        content: operation.payload.content,
        isInternal: operation.payload.isInternal ?? true
      });

      return {
        outcome: "applied",
        resultPayload: {
          entityId: note.id,
          message: "Note recorded"
        }
      };
    }
    case "job.status.update": {
      const [job] = await db
        .select()
        .from(jobs)
        .where(
          and(eq(jobs.companyId, actor.companyId), eq(jobs.id, operation.jobId), isNull(jobs.deletedAt))
        )
        .limit(1);

      if (!job) {
        return { outcome: "rejected", resultPayload: { message: "Job not found" } };
      }

      const liveVersion = buildRecordVersionV1("job", job.id, job.updatedAt);
      if (isStaleRecordVersion(operation.baseRecordVersion, liveVersion)) {
        return {
          outcome: "conflict",
          resultPayload: {
            conflict: {
              liveRecordVersion: liveVersion,
              reason: "Job recordVersion is stale"
            }
          }
        };
      }

      const updated = await transitionStatus(
        actor.companyId,
        actor.userId,
        operation.jobId,
        operation.payload.toStatus,
        operation.payload.reason
      );

      return {
        outcome: "applied",
        resultPayload: {
          entityId: updated.id,
          recordVersion: buildRecordVersionV1("job", updated.id, updated.updatedAt)
        }
      };
    }
    case "job.task.update": {
      const parsed = parseRecordVersionV1(operation.baseRecordVersion);
      if (!parsed || parsed.entityType !== "job_task" || parsed.entityId !== operation.payload.taskId) {
        return {
          outcome: "rejected",
          resultPayload: { message: "baseRecordVersion must target the job task being updated" }
        };
      }

      const [task] = await db
        .select()
        .from(jobTasks)
        .where(
          and(
            eq(jobTasks.companyId, actor.companyId),
            eq(jobTasks.jobId, operation.jobId),
            eq(jobTasks.id, operation.payload.taskId),
            isNull(jobTasks.deletedAt)
          )
        )
        .limit(1);

      if (!task) {
        return { outcome: "rejected", resultPayload: { message: "Task not found" } };
      }

      const liveVersion = buildRecordVersionV1("job_task", task.id, task.updatedAt);
      if (isStaleRecordVersion(operation.baseRecordVersion, liveVersion)) {
        return {
          outcome: "conflict",
          resultPayload: {
            conflict: {
              liveRecordVersion: liveVersion,
              reason: "Task recordVersion is stale"
            }
          }
        };
      }

      const taskUpdateInput = {
        ...(operation.payload.status !== undefined ? { status: operation.payload.status } : {}),
        ...(operation.payload.notes !== undefined ? { notes: operation.payload.notes } : {})
      };
      const updated = await updateTask(actor.companyId, operation.jobId, operation.payload.taskId, taskUpdateInput);

      return {
        outcome: "applied",
        resultPayload: {
          entityId: updated.id,
          recordVersion: buildRecordVersionV1("job_task", updated.id, updated.updatedAt)
        }
      };
    }
    case "job.signature.capture": {
      const [job] = await db
        .select()
        .from(jobs)
        .where(
          and(eq(jobs.companyId, actor.companyId), eq(jobs.id, operation.jobId), isNull(jobs.deletedAt))
        )
        .limit(1);

      if (!job) {
        return { outcome: "rejected", resultPayload: { message: "Job not found" } };
      }

      const liveVersion = buildRecordVersionV1("job", job.id, job.updatedAt);
      if (isStaleRecordVersion(operation.baseRecordVersion, liveVersion)) {
        return {
          outcome: "conflict",
          resultPayload: {
            conflict: {
              liveRecordVersion: liveVersion,
              reason: "Job recordVersion is stale"
            }
          }
        };
      }

      if (job.signatureUrl && job.signatureUrl !== operation.payload.signatureUrl) {
        return {
          outcome: "conflict",
          resultPayload: {
            conflict: {
              liveRecordVersion: liveVersion,
              reason: "Job already has a different signature on file"
            }
          }
        };
      }

      if (job.signatureUrl === operation.payload.signatureUrl) {
        return {
          outcome: "applied",
          resultPayload: {
            entityId: job.id,
            recordVersion: liveVersion,
            message: "Signature already captured"
          }
        };
      }

      const signedAt = new Date();
      const updatedRows = await db
        .update(jobs)
        .set({
          signatureUrl: operation.payload.signatureUrl,
          signedByName: operation.payload.signedByName,
          signedAt,
          updatedAt: signedAt
        })
        .where(
          and(eq(jobs.companyId, actor.companyId), eq(jobs.id, operation.jobId), isNull(jobs.deletedAt))
        )
        .returning();
      const updated = updatedRows[0];

      if (!updated) {
        return { outcome: "rejected", resultPayload: { message: "Failed to capture signature" } };
      }

      await emitEventWithExecutor(db, "job.updated", {
        companyId: actor.companyId,
        actorId: actor.userId,
        actorType: "user",
        entityType: "job",
        entityId: updated.id,
        jobId: updated.id,
        customerId: updated.customerId,
        summary: `Captured customer signature on job ${updated.jobNumber}`,
        payload: { signatureUrl: updated.signatureUrl }
      });

      return {
        outcome: "applied",
        resultPayload: {
          entityId: updated.id,
          recordVersion: buildRecordVersionV1("job", updated.id, updated.updatedAt)
        }
      };
    }
    case "job.media.register": {
      const photoInput = {
        url: operation.payload.url,
        photoType: operation.payload.photoType ?? "general",
        ...(operation.payload.caption !== undefined ? { caption: operation.payload.caption } : {})
      };
      const photo = await addPhoto(actor.companyId, actor.userId, operation.jobId, photoInput);

      return {
        outcome: "applied",
        resultPayload: {
          entityId: photo.id,
          message: "Media metadata registered"
        }
      };
    }
    default: {
      return { outcome: "rejected", resultPayload: { message: "Unsupported operation type" } };
    }
  }
}

export async function submitFieldWorkSyncBatch(
  actor: FieldWorkSyncActor,
  input: SubmitFieldWorkSyncBatchBody
): Promise<SubmitFieldWorkSyncBatchResponse> {
  const sortedOperations = [...input.operations].sort((left, right) => left.sequence - right.sequence);
  const batch = await resolveBatch(actor, input);
  const results: SubmitFieldWorkSyncBatchResponse["results"] = [];
  let lastAcknowledgedSequence = batch.lastAcknowledgedSequence;

  for (const operation of sortedOperations) {
    const existing = await findExistingOperation(actor.companyId, operation.clientOperationId);
    if (existing) {
      const storedHash = existing.payloadHash;
      const incomingHash = hashPayload(operation);
      const outcome =
        existing.outcome === "applied" && storedHash === incomingHash ? "duplicate" : existing.outcome;
      const mapped = toOperationResult(existing);
      results.push({ ...mapped, outcome });
      lastAcknowledgedSequence = Math.max(lastAcknowledgedSequence, operation.sequence);
      continue;
    }

    let applyResult: { outcome: FieldWorkSyncOperationOutcome; resultPayload: Record<string, unknown> };
    try {
      applyResult = await applyOperation(actor, operation);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        applyResult = {
          outcome: error.code === ErrorCode.FORBIDDEN || error.code === ErrorCode.NOT_FOUND ? "rejected" : "rejected",
          resultPayload: { message: error.message }
        };
      } else {
        throw error;
      }
    }

    const inserted = await db
      .insert(fieldSyncOperations)
      .values({
        companyId: actor.companyId,
        batchId: batch.id,
        sequence: operation.sequence,
        clientOperationId: operation.clientOperationId,
        jobId: operation.jobId,
        operationType: operation.type,
        requestPayload: operation,
        outcome: applyResult.outcome,
        resultPayload: applyResult.resultPayload,
        payloadHash: hashPayload(operation)
      })
      .returning();

    const stored = inserted[0];
    if (!stored) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to persist sync operation");
    }

    results.push(toOperationResult(stored));
    if (applyResult.outcome === "applied" || applyResult.outcome === "duplicate") {
      lastAcknowledgedSequence = Math.max(lastAcknowledgedSequence, operation.sequence);
    }
  }

  const ackRows = await db
    .select()
    .from(fieldSyncOperations)
    .where(and(eq(fieldSyncOperations.batchId, batch.id), isNull(fieldSyncOperations.deletedAt)));

  lastAcknowledgedSequence = ackRows.reduce((maxSequence, row) => {
    if (row.outcome === "applied" || row.outcome === "duplicate") {
      return Math.max(maxSequence, row.sequence);
    }
    return maxSequence;
  }, lastAcknowledgedSequence);

  await db
    .update(fieldSyncBatches)
    .set({
      lastAcknowledgedSequence,
      status: "open",
      updatedAt: new Date()
    })
    .where(eq(fieldSyncBatches.id, batch.id));

  return {
    contractVersion: FIELD_WORK_SYNC_CONTRACT_VERSION,
    batchId: batch.id,
    deviceId: input.deviceId,
    batchClientId: input.batchClientId,
    lastAcknowledgedSequence,
    results
  };
}
