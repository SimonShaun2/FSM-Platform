export const FIELD_WORK_SYNC_CONTRACT_VERSION = "1.0.0";

export const FIELD_WORK_SYNC_OPERATION_TYPES = [
  "job.status.update",
  "job.note.append",
  "job.task.update",
  "job.signature.capture",
  "job.media.register"
] as const;

export type FieldWorkSyncOperationType = (typeof FIELD_WORK_SYNC_OPERATION_TYPES)[number];

export const FIELD_WORK_SYNC_OPERATION_OUTCOMES = [
  "applied",
  "duplicate",
  "conflict",
  "rejected"
] as const;

export type FieldWorkSyncOperationOutcome = (typeof FIELD_WORK_SYNC_OPERATION_OUTCOMES)[number];
