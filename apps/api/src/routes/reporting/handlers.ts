import type { FastifyReply, FastifyRequest } from "fastify";

import type { JobSourceReportingQuery } from "@fsm/types";

import { getJobSourceReportingSummary } from "../../services/job-source-reporting.service.js";

export async function getJobSourceReportingHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as JobSourceReportingQuery;
  const summary = await getJobSourceReportingSummary(request.company.id, query);

  return reply.send(summary);
}
