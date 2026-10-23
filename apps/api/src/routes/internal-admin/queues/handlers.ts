import type { FastifyReply, FastifyRequest } from "fastify";

<<<<<<< HEAD
import {
  fetchPlatformDeadLetterJobs,
  fetchPlatformQueueMonitoringSnapshot
} from "../../../services/queue-monitoring.service.js";
import { listDeadLetterJobsParamsSchema, listDeadLetterJobsQuerySchema } from "./schemas.js";
=======
import { fetchPlatformQueueMonitoringSnapshot } from "../../../services/queue-monitoring.service.js";
>>>>>>> origin/dev

export async function getPlatformQueueMonitoringHandler(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const snapshot = await fetchPlatformQueueMonitoringSnapshot();
  return reply.send(snapshot);
}
<<<<<<< HEAD

export async function listPlatformDeadLetterJobsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = listDeadLetterJobsParamsSchema.parse(request.params);
  const query = listDeadLetterJobsQuerySchema.parse(request.query);
  const jobs = await fetchPlatformDeadLetterJobs(params.queueName, {
    ...(query.start !== undefined ? { start: query.start } : {}),
    ...(query.limit !== undefined ? { limit: query.limit } : {})
  });
  return reply.send(jobs);
}
=======
>>>>>>> origin/dev
