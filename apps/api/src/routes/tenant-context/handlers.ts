import type { FastifyReply, FastifyRequest } from "fastify";

import {
  buildTenantContext,
  resolveEntityRef,
  resolveInquiryGraphAnchor
} from "../../services/tenant-context.service.js";
import type { ResolveEntityBody } from "./schemas.js";

export async function getTenantContextHandler(request: FastifyRequest, reply: FastifyReply) {
  const context = await buildTenantContext(request.company.id, {
    id: request.user.id,
    type: "user"
  });
  return reply.send(context);
}

export async function resolveEntityHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as ResolveEntityBody;
  const ref = await resolveEntityRef(request.company.id, body.entityType, body.entityId);
  return reply.send(ref);
}

export async function resolveInquiryAnchorHandler(request: FastifyRequest, reply: FastifyReply) {
  const { bookingRequestId } = request.params as { bookingRequestId: string };
  const anchor = await resolveInquiryGraphAnchor(request.company.id, bookingRequestId);
  return reply.send(anchor);
}
