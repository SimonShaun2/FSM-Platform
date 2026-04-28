import type { FastifyReply, FastifyRequest } from "fastify";

import { replyNotImplemented } from "../shared/not-implemented.js";

export async function listPropertiesHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function createPropertyHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function getPropertyHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function updatePropertyHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function deletePropertyHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}
