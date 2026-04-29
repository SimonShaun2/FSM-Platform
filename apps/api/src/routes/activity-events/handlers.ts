import type { FastifyReply, FastifyRequest } from "fastify";

import { listActivityEvents } from "../../services/activity-event.service.js";
import type { ListActivityEventsQueryInput } from "./schemas.js";

export async function listActivityEventsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await listActivityEvents(request.company.id, request.query as ListActivityEventsQueryInput);

  return reply.send({
    data: result.data.map((event) => ({
      id: event.id,
      companyId: event.companyId,
      eventType: event.eventType,
      actorId: event.actorId,
      actorType: event.actorType,
      actorName: event.actorName,
      entityType: event.entityType,
      entityId: event.entityId,
      customerId: event.customerId,
      jobId: event.jobId,
      estimateId: event.estimateId,
      invoiceId: event.invoiceId,
      payload: event.payload,
      summary: event.summary,
      occurredAt: event.occurredAt.toISOString()
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}
