import type { FastifyReply, FastifyRequest } from "fastify";

import type { AgentActionState } from "../../services/agent-action.service.js";
import { editAgentActionParameters } from "../../services/agent-action.service.js";
import {
  getJobTimelineForProvenance,
  getOperatorInboxItem,
  listOperatorInbox
} from "../../services/operator-inbox.service.js";
import type { ListAgentActionsQuery } from "../agent-actions/schemas.js";
import type { EditAgentActionBody } from "./schemas.js";

export async function listOperatorInboxHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as ListAgentActionsQuery;
  const filters: { state?: AgentActionState; agentProduct?: string } = {};
  if (query.state !== undefined) {
    filters.state = query.state;
  }
  if (query.agentProduct !== undefined) {
    filters.agentProduct = query.agentProduct;
  }

  const items = await listOperatorInbox(request.company.id, filters);
  return reply.send({ contractVersion: "0.1.0", items });
}

export async function getOperatorInboxItemHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const item = await getOperatorInboxItem(request.company.id, id);
  return reply.send(item);
}

export async function editOperatorInboxItemHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const body = request.body as EditAgentActionBody;
  const patch: { channel?: "sms" | "email"; subject?: string | null; body: string } = { body: body.body };
  if (body.channel !== undefined) {
    patch.channel = body.channel;
  }
  if (body.subject !== undefined) {
    patch.subject = body.subject;
  }

  const action = await editAgentActionParameters(request.company.id, id, request.user.id, patch);
  const item = await getOperatorInboxItem(request.company.id, action.id);
  return reply.send(item);
}

export async function getJobProvenanceHandler(request: FastifyRequest, reply: FastifyReply) {
  const { jobId } = request.params as { jobId: string };
  const { eventIds } = request.query as { eventIds: string };
  const parsedIds = eventIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const events = await getJobTimelineForProvenance(request.company.id, jobId, parsedIds);
  return reply.send({ items: events });
}
