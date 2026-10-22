import type { FastifyReply, FastifyRequest } from "fastify";

import {
  getLivenessPayload,
  probeDatabase,
  runReadinessChecks
} from "../../services/runtime-health.service.js";

export async function livenessHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.code(200).send(getLivenessPayload());
}

export async function liveHandler(_request: FastifyRequest, reply: FastifyReply) {
  return livenessHandler(_request, reply);
}

export async function readinessHandler(_request: FastifyRequest, reply: FastifyReply) {
  const payload = await runReadinessChecks();
  const statusCode = payload.status === "ok" ? 200 : 503;
  return reply.code(statusCode).send(payload);
}

export async function databaseHealthHandler(_request: FastifyRequest, reply: FastifyReply) {
  const database = await probeDatabase();
  if (database.status === "ok") {
    return reply.code(200).send({ status: "ok", check: "database" });
  }

  return reply.code(503).send({
    status: "degraded",
    check: "database",
    message: database.message
  });
}
