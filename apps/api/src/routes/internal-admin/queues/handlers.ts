import type { FastifyReply, FastifyRequest } from "fastify";

import { fetchPlatformQueueMonitoringSnapshot } from "../../../services/queue-monitoring.service.js";

export async function getPlatformQueueMonitoringHandler(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const snapshot = await fetchPlatformQueueMonitoringSnapshot();
  return reply.send(snapshot);
}
