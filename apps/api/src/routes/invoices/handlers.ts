import type { FastifyReply, FastifyRequest } from "fastify";

import { replyNotImplemented } from "../shared/not-implemented.js";

export async function listInvoicesHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function createInvoiceHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function getInvoiceHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function updateInvoiceHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}

export async function deleteInvoiceHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  return replyNotImplemented(request, reply);
}
