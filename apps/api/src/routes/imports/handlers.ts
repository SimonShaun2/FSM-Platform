import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

import type { ImportEntityType, ListImportsQuery } from "@fsm/types";
import { AppError, ErrorCode, importEntityTypeSchema } from "@fsm/types";

import {
  confirmMapping,
  createImportSession,
  getImportErrors,
  getImportSession,
  listImportSessions,
  rollbackImport,
  startImport
} from "../../services/import.service.js";
import {
  getMigrateFileBatchOperatorStatus,
  retryMigrateFileBatchFailedObjects
} from "../../services/import-migrate-file-batch-operator.service.js";
import { abortImportUploadRequest } from "./upload-guards.js";
import {
  CSV_IMPORT_MAX_FILES,
  CSV_IMPORT_TOO_MANY_FILES_MESSAGE,
  csvImportMultipartParserOptions
} from "./upload-limits.js";
import type { z } from "zod";

import {
  type ConfirmMappingBody,
  ImportFileBatchParamsSchema,
  type ImportSessionIdParams,
  type StartImportBody
} from "./schemas.js";

type ImportFileBatchParams = z.infer<typeof ImportFileBatchParamsSchema>;

function toImportSessionResponse(importSession: Awaited<ReturnType<typeof getImportSession>>) {
  return {
    id: importSession.id,
    status: importSession.status,
    entityType: importSession.entityType,
    fileName: importSession.fileName,
    totalRows: importSession.totalRows,
    validRows: importSession.validRows,
    errorRows: importSession.errorRows,
    importedRows: importSession.importedRows,
    skippedRows: importSession.skippedRows,
    duplicateRows: importSession.duplicateRows,
    columnMappings: importSession.columnMappings,
    completedAt: importSession.completedAt?.toISOString() ?? null,
    rolledBackAt: importSession.rolledBackAt?.toISOString() ?? null,
    createdAt: importSession.createdAt.toISOString(),
    errorMessage: importSession.errorMessage ?? null
  };
}

export async function createImportHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  let fileName: string | undefined;
  let mimeType: string | undefined;
  let fileBuffer: Buffer | undefined;
  let fileCount = 0;
  let entityType: ImportEntityType = "customers";

  try {
    for await (const part of request.parts(csvImportMultipartParserOptions)) {
      if (part.type === "file") {
        fileCount += 1;

        if (fileCount > CSV_IMPORT_MAX_FILES) {
          await part.toBuffer().catch(() => undefined);
          throw new AppError(ErrorCode.VALIDATION_ERROR, CSV_IMPORT_TOO_MANY_FILES_MESSAGE);
        }

        fileName = part.filename;
        mimeType = part.mimetype;
        fileBuffer = await part.toBuffer();
        continue;
      }

      if (part.type === "field" && part.fieldname === "entityType") {
        const parsedEntityType = importEntityTypeSchema.safeParse(String(await part.value));
        if (parsedEntityType.success) {
          entityType = parsedEntityType.data as ImportEntityType;
        } else {
          throw new AppError(ErrorCode.VALIDATION_ERROR, "entityType must be customers, properties, or jobs");
        }
        continue;
      }

      await part.value;
    }
  } catch (error: unknown) {
    const fastifyError = error as FastifyError;
    const multipartLimitCode = fastifyError.code;

    if (
      error instanceof AppError ||
      multipartLimitCode === "FST_FILES_LIMIT" ||
      multipartLimitCode === "FST_REQ_FILE_TOO_LARGE"
    ) {
      throw error;
    }

    abortImportUploadRequest(request);
    throw error;
  }

  if (!fileBuffer || !fileName) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "A CSV file is required");
  }

  const importSession = await createImportSession(
    request.company.id,
    request.user.id,
    fileName,
    fileBuffer,
    {
      mimeType: mimeType ?? "text/csv",
      entityType
    }
  );

  return reply.status(201).send({
    importSession: toImportSessionResponse(importSession)
  });
}

export async function listImportsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await listImportSessions(request.company.id, request.query as ListImportsQuery);

  return reply.send({
    data: result.data.map((importSession) => toImportSessionResponse(importSession)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function getImportHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ImportSessionIdParams;
  const importSession = await getImportSession(request.company.id, params.id);

  return reply.send({
    importSession: toImportSessionResponse(importSession)
  });
}

export async function confirmMappingHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ImportSessionIdParams;
  const body = request.body as ConfirmMappingBody;
  const importSession = await confirmMapping(
    request.company.id,
    request.user.id,
    params.id,
    body.mappingOverrides
  );

  return reply.send({
    importSession: toImportSessionResponse(importSession)
  });
}

export async function startImportHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ImportSessionIdParams;
  const body = request.body as StartImportBody;
  const importSession = await startImport(
    request.company.id,
    request.user.id,
    params.id,
    body.duplicateActions
  );

  return reply.send({
    importSession: toImportSessionResponse(importSession)
  });
}

export async function rollbackImportHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ImportSessionIdParams;
  const importSession = await rollbackImport(request.company.id, request.user.id, params.id);

  return reply.send({
    importSession: toImportSessionResponse(importSession)
  });
}

export async function getImportErrorsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ImportSessionIdParams;
  const errors = await getImportErrors(request.company.id, params.id);

  return reply.send({
    errors
  });
}

export async function getMigrateFileBatchStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ImportFileBatchParams;
  const status = await getMigrateFileBatchOperatorStatus(
    request.company.id,
    params.id,
    params.batchIndex
  );

  return reply.send({ fileBatch: status });
}

export async function retryMigrateFileBatchHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ImportFileBatchParams;
  const result = await retryMigrateFileBatchFailedObjects(
    request.company.id,
    params.id,
    params.batchIndex
  );

  return reply.send({ fileBatchRetry: result });
}
