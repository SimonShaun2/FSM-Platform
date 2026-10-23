import { and, eq, isNull } from "drizzle-orm";
import pino from "pino";

import { buildImportBundleObjectKey } from "@fsm/config/import-bundle-storage";
import { db, importSessions } from "@fsm/db";
import { buildDefaultEnqueueJobOptions, importsQueue } from "@fsm/jobs";
import {
  AppError,
  ErrorCode,
  IMPORT_QUEUE_JOB_NAMES,
  MigrateFileBatchJobDataSchema,
  MigrateFileBatchManifestSchema,
  buildMigrateFileBatchIdempotencyKey,
  buildMigrateFileBatchJobId,
  type MigrateFileBatchManifest
} from "@fsm/types";

type ImportSessionRow = typeof importSessions.$inferSelect;

const logger = pino({
  name: "import-migrate-file-batch-service"
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractMigrateFileBatchManifest(aiInferences: unknown): MigrateFileBatchManifest | null {
  if (!isPlainObject(aiInferences)) {
    return null;
  }

  const raw = aiInferences.migrateFileBatchManifest;
  if (raw === undefined || raw === null) {
    return null;
  }

  const parsed = MigrateFileBatchManifestSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function getImportSessionRow(companyId: string, importSessionId: string): Promise<ImportSessionRow> {
  const rows = await db
    .select()
    .from(importSessions)
    .where(
      and(
        eq(importSessions.companyId, companyId),
        eq(importSessions.id, importSessionId),
        isNull(importSessions.deletedAt)
      )
    )
    .limit(1);
  const session = rows[0];

  if (!session) {
    throw new AppError(ErrorCode.NOT_FOUND, "Import session not found");
  }

  return session;
}

export async function scheduleMigrateFileBatchesFromSessionAiInferences(
  companyId: string,
  importSessionId: string
): Promise<number> {
  const session = await getImportSessionRow(companyId, importSessionId);
  const manifest = extractMigrateFileBatchManifest(session.aiInferences);

  if (!manifest) {
    return 0;
  }

  let enqueued = 0;

  for (const batch of manifest.batches) {
    if (batch.batchIndex >= batch.batchesTotal) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "migrateFileBatchManifest batch index is out of range");
    }

    const objects = batch.objects.map((object) => ({
      ...object,
      r2Key:
        object.r2Key ??
        buildImportBundleObjectKey(companyId, manifest.importBundleId, object.relativePath)
    }));

    const payload = MigrateFileBatchJobDataSchema.parse({
      companyId,
      importSessionId,
      importBundleId: manifest.importBundleId,
      sourceSystem: manifest.sourceSystem,
      batchIndex: batch.batchIndex,
      batchesTotal: batch.batchesTotal,
      idempotencyKey: buildMigrateFileBatchIdempotencyKey(importSessionId, batch.batchIndex),
      cursor: batch.cursor,
      objects
    });

    await importsQueue.add(
      IMPORT_QUEUE_JOB_NAMES.migrateFileBatch,
      payload,
      buildDefaultEnqueueJobOptions({
        jobId: buildMigrateFileBatchJobId(importSessionId, batch.batchIndex)
      })
    );

    enqueued += 1;
  }

  logger.info(
    {
      companyId,
      importSessionId,
      importBundleId: manifest.importBundleId,
      enqueuedBatches: enqueued
    },
    "Enqueued migrate-file-batch jobs from import session manifest"
  );

  return enqueued;
}
