import type { FastifyReply, FastifyRequest } from "fastify";

import {
  fetchPlatformDeadLetterJobs,
  fetchPlatformFailedJobsWithReplayMetadata,
  fetchPlatformQueueMonitoringSnapshot
} from "../../../services/queue-monitoring.service.js";
import { queueNameParamsSchema, tenantScopedQueueJobsQuerySchema } from "./schemas.js";

export async function getPlatformQueueMonitoringHandler(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const snapshot = await fetchPlatformQueueMonitoringSnapshot();
  return reply.send(snapshot);
}

export async function listPlatformDeadLetterJobsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = queueNameParamsSchema.parse(request.params);
  const query = tenantScopedQueueJobsQuerySchema.parse(request.query);
  const jobs = await fetchPlatformDeadLetterJobs(params.queueName, {
    companyId: query.companyId,
    ...(query.start !== undefined ? { start: query.start } : {}),
    ...(query.limit !== undefined ? { limit: query.limit } : {})
  });
  return reply.send(jobs);
}

export async function listPlatformFailedJobsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = queueNameParamsSchema.parse(request.params);
  const query = tenantScopedQueueJobsQuerySchema.parse(request.query);
  const jobs = await fetchPlatformFailedJobsWithReplayMetadata(params.queueName, {
    companyId: query.companyId,
    ...(query.start !== undefined ? { start: query.start } : {}),
    ...(query.limit !== undefined ? { limit: query.limit } : {})
  });
  return reply.send(jobs);
}
