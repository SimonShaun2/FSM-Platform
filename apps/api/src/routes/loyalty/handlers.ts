import type { FastifyReply, FastifyRequest } from "fastify";

import { listLoyaltyReminderCandidates } from "../../services/loyalty-reminder-candidates.service.js";

export async function listLoyaltyReminderCandidatesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const query = request.query as { horizonDays?: number };
  const result = await listLoyaltyReminderCandidates(request.company.id, {
    horizonDays: query.horizonDays ?? 14
  });

  return reply.send(result);
}
