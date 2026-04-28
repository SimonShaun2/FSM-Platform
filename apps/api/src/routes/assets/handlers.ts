import type { FastifyReply, FastifyRequest } from "fastify";

import { replyNotImplemented } from "../shared/not-implemented.js";

export async function listAssetsHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function createAssetHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function getAssetHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function updateAssetHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function deleteAssetHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}
