import { and, eq, isNull } from "drizzle-orm";

import { db, importBundles, importSessions } from "@fsm/db";
import {
  buildImportBundleFileDescriptors,
  computeImportBundleProgress,
  parseImportChunkSessionProgress
} from "@fsm/import-engine";
import {
  AppError,
  ErrorCode,
  ImportSessionChunkProgressSchema,
  migrateOnboardingStepStateSchema,
  type ImportSessionChunkProgress,
  type ImportSessionIngestProgressResponse,
  type MigrateOnboardingIngestProgressResponse,
  type MigrateOnboardingStepState
} from "@fsm/types";

function inferImportFileMimeType(fileName: string): string {
  return /\.xlsx?$/iu.test(fileName)
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : "text/csv";
}

function toChunkProgress(progress: unknown): ImportSessionChunkProgress | null {
  const parsed = parseImportChunkSessionProgress(progress);

  if (typeof parsed.chunksTotal !== "number" || parsed.chunksTotal <= 0) {
    return null;
  }

  let lastCursor: ImportSessionChunkProgress["lastCursor"];
  if (parsed.lastCursor) {
    const cursor: NonNullable<ImportSessionChunkProgress["lastCursor"]> = {};
    if (typeof parsed.lastCursor.rowOffset === "number") {
      cursor.rowOffset = parsed.lastCursor.rowOffset;
    }
    if (typeof parsed.lastCursor.lastSourceId === "string") {
      cursor.lastSourceId = parsed.lastCursor.lastSourceId;
    }
    if (cursor.rowOffset !== undefined || cursor.lastSourceId !== undefined) {
      lastCursor = cursor;
    }
  }

  const validated = ImportSessionChunkProgressSchema.parse({
    entityType: parsed.entityType ?? "unknown",
    chunksTotal: parsed.chunksTotal,
    chunksDone: parsed.chunksDone ?? 0,
    rowsOk: parsed.rowsOk ?? 0,
    rowsFailed: parsed.rowsFailed ?? 0,
    ...(lastCursor ? { lastCursor } : {}),
    ...(parsed.lastIdempotencyKey ? { lastIdempotencyKey: parsed.lastIdempotencyKey } : {})
  });

  return validated as ImportSessionChunkProgress;
}

export async function getImportSessionIngestProgress(
  companyId: string,
  importSessionId: string
): Promise<ImportSessionIngestProgressResponse> {
  const [session] = await db
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

  if (!session) {
    throw new AppError(ErrorCode.NOT_FOUND, "Import session not found");
  }

  return {
    importSessionId: session.id,
    status: session.status,
    entityType: session.entityType,
    fileName: session.fileName,
    chunk: toChunkProgress(session.progress)
  };
}

function parseStepState(value: unknown): MigrateOnboardingStepState {
  const parsed = migrateOnboardingStepStateSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  return { files: [] };
}

export async function getMigrateOnboardingIngestProgress(
  companyId: string,
  bundleId: string
): Promise<MigrateOnboardingIngestProgressResponse> {
  const [bundle] = await db
    .select()
    .from(importBundles)
    .where(
      and(eq(importBundles.id, bundleId), eq(importBundles.companyId, companyId), isNull(importBundles.deletedAt))
    )
    .limit(1);

  if (!bundle) {
    throw new AppError(ErrorCode.NOT_FOUND, "Onboarding bundle not found");
  }

  const sessions = await db
    .select()
    .from(importSessions)
    .where(
      and(
        eq(importSessions.companyId, companyId),
        eq(importSessions.importBundleId, bundleId),
        isNull(importSessions.deletedAt)
      )
    );

  const stepState = parseStepState(bundle.stepState);
  const files = buildImportBundleFileDescriptors(
    stepState.files.map((file) => ({
      fileName: file.fileName,
      mimeType: inferImportFileMimeType(file.fileName),
      byteSize: 0,
      importSessionId: file.importSessionId
    }))
  );

  let chunksCommitted = 0;
  let chunksTotal = 0;
  let hasChunkTotals = false;

  const sessionProgress = sessions.map((session) => {
    const chunk = toChunkProgress(session.progress);
    if (chunk) {
      hasChunkTotals = true;
      chunksTotal += chunk.chunksTotal;
      chunksCommitted += chunk.chunksDone;
    }

    return {
      importSessionId: session.id,
      entityType: session.entityType,
      status: session.status,
      fileName: session.fileName,
      chunk
    };
  });

  const progress = computeImportBundleProgress({
    files,
    chunksCommitted,
    chunksTotal: hasChunkTotals ? chunksTotal : null
  });

  return {
    bundleId,
    progress,
    sessions: sessionProgress
  };
}
