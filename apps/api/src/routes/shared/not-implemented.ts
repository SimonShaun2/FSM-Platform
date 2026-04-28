import type { FastifyReply, FastifyRequest } from "fastify";

export function replyNotImplemented(request: FastifyRequest, reply: FastifyReply): FastifyReply {
  return reply.code(501).send({
    error: "NOT_IMPLEMENTED",
    message: "Not Implemented",
    requestId: request.id
  });
}
