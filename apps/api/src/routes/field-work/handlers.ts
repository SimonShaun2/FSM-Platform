import type { FastifyReply, FastifyRequest } from "fastify";

import type { SubmitFieldWorkSyncBatchBody } from "@fsm/types";

import { submitFieldWorkSyncBatch } from "../../services/field-work-sync.service.js";

export async function submitFieldWorkSyncBatchHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as SubmitFieldWorkSyncBatchBody;

  const response = await submitFieldWorkSyncBatch(
    {
      companyId: request.company.id,
      userId: request.user.id,
      role: request.user.role
    },
    body
  );

  return reply.code(200).send(response);
}
