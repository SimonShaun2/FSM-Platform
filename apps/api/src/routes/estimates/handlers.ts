import type { FastifyReply, FastifyRequest } from "fastify";

import { replyNotImplemented } from "../shared/not-implemented.js";

export async function listEstimatesHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function createEstimateHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function getEstimateHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function updateEstimateHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function deleteEstimateHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}
