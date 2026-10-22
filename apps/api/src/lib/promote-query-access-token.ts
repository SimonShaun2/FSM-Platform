import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * EventSource cannot send Authorization headers. For SSE routes only, promote
 * `access_token` query param to Bearer before `fastify.authenticate`.
 */
export function promoteQueryAccessTokenToHeader(
  request: FastifyRequest,
  _reply: FastifyReply
): void {
  if (request.headers.authorization) {
    return;
  }

  const query = request.query as { access_token?: string };

  if (query.access_token) {
    request.headers.authorization = `Bearer ${query.access_token}`;
  }
}
