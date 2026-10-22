import type { FastifyReply, FastifyRequest } from "fastify";

import type { CreateDataExportBody, DataExportSessionIdParams } from "@fsm/types";

import {
  createDataExportSession,
  getDataExportManifest,
  getDataExportSession,
  listDataExportSessions,
  recordDataExportDownload,
  retryDataExportSession,
  toDataExportSessionResponse
} from "../../services/data-export.service.js";

export async function getDataExportManifestHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ manifest: getDataExportManifest() });
}

export async function createDataExportHandler(request: FastifyRequest, reply: FastifyReply) {
  const session = await createDataExportSession(
    request.company.id,
    request.user.id,
    request.body as CreateDataExportBody
  );

  return reply.code(201).send({
    dataExport: toDataExportSessionResponse(session)
  });
}

export async function listDataExportsHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number };
  const result = await listDataExportSessions(request.company.id, query.page, query.limit);

  return reply.send({
    data: result.data.map((session) => toDataExportSessionResponse(session)),
    total: result.total,
    page: result.page,
    limit: result.limit
  });
}

export async function getDataExportHandler(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as DataExportSessionIdParams;
  const session = await getDataExportSession(request.company.id, params.id);

  return reply.send({
    dataExport: toDataExportSessionResponse(session)
  });
}

export async function downloadDataExportHandler(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as DataExportSessionIdParams;
  const session = await recordDataExportDownload(request.company.id, request.user.id, params.id);

  return reply.send({
    dataExport: toDataExportSessionResponse(session)
  });
}

export async function retryDataExportHandler(request: FastifyRequest, reply: FastifyReply) {
  const params = request.params as DataExportSessionIdParams;
  const session = await retryDataExportSession(request.company.id, request.user.id, params.id);

  return reply.send({
    dataExport: toDataExportSessionResponse(session)
  });
}
