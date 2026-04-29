import type { FastifyReply, FastifyRequest } from "fastify";

import { listMessageLogs } from "../../services/message-log.service.js";
import type { ListMessageLogsQueryInput } from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function listMessageLogsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await listMessageLogs(request.company.id, request.query as ListMessageLogsQueryInput);

  return reply.send({
    data: result.data.map((log) => ({
      id: log.id,
      customerId: log.customerId,
      campaignId: log.campaignId,
      campaignName: log.campaignName,
      channel: log.channel,
      direction: log.direction,
      toAddress: log.toAddress,
      fromAddress: log.fromAddress,
      subject: log.subject,
      body: log.body,
      providerStatus: log.providerStatus,
      sentAt: toIsoString(log.sentAt),
      deliveredAt: toIsoString(log.deliveredAt),
      failedAt: toIsoString(log.failedAt),
      failureReason: log.failureReason,
      createdAt: log.createdAt.toISOString()
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}
