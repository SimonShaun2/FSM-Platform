import type { FastifyReply, FastifyRequest } from "fastify";

import type { AutoFitResponse } from "@fsm/types";

import { getAutoFitSuggestions } from "../../services/dispatch-intelligence.service.js";
import {
  getDispatchView,
  getDispatchWorkload,
  listApprovedUnconvertedEstimates,
  listUnscheduledJobs
} from "../../services/dispatch.service.js";
import type { AutoFitBody, DispatchDateQuery } from "./schemas.js";

export async function getDispatchViewHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as DispatchDateQuery;
  const dispatchView = await getDispatchView(request.company.id, query.date);

  return reply.send(dispatchView);
}

export async function getDispatchWorkloadHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as DispatchDateQuery;
  const workload = await getDispatchWorkload(request.company.id, query.date);

  return reply.send({
    workload
  });
}

export async function listUnscheduledJobsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const jobs = await listUnscheduledJobs(request.company.id);

  return reply.send({
    jobs: jobs.map((job) => ({
      ...job,
      createdAt: job.createdAt.toISOString()
    }))
  });
}

export async function listApprovedUnconvertedEstimatesHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const estimates = await listApprovedUnconvertedEstimates(request.company.id);

  return reply.send({
    estimates: estimates.map((estimate) => ({
      ...estimate,
      approvedAt: estimate.approvedAt?.toISOString() ?? null
    }))
  });
}

export async function autoFitHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const body = request.body as AutoFitBody;
  const response: AutoFitResponse = await getAutoFitSuggestions({
    companyId: request.company.id,
    jobId: body.jobId,
    date: body.date
  });

  return reply.send(response);
}
