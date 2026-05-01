import type { FastifyReply, FastifyRequest } from "fastify";

import type { ListImportsQuery } from "@fsm/types";
import { AppError, ErrorCode } from "@fsm/types";

import {
  confirmMapping,
  createImportSession,
  getImportErrors,
  getImportSession,
  listImportSessions,
  rollbackImport,
  startImport
} from "../../services/import.service.js";
import type {
  ConfirmMappingBody,
  ImportSessionIdParams,
  StartImportBody
} from "./schemas.js";

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
  const filePart = await request.file();

  if (!filePart) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "A CSV file is required");
  }

  const fileBuffer = await filePart.toBuffer();
  const importSession = await createImportSession(
    request.company.id,
    request.user.id,
    filePart.filename,
    fileBuffer,
    {
      mimeType: filePart.mimetype,
      entityType: "customers"
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
