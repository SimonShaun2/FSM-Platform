import type { FastifyReply, FastifyRequest } from "fastify";

import {
  createDashboardLink,
  createEmbeddedConnectSession,
  createOnboardingLink,
  getConnectStatus,
  handleOnboardingReturn
} from "../../services/stripe-connect.service.js";
import type { ConnectAccountSessionBody } from "./schemas.js";

export async function createOnboardingLinkHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await createOnboardingLink(request.company.id);
  return reply.send(result);
}

export async function handleOnboardingReturnHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const status = await handleOnboardingReturn(request.company.id);
  return reply.send(status);
}

export async function getConnectStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const status = await getConnectStatus(request.company.id);
  return reply.send(status);
}

export async function createDashboardLinkHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await createDashboardLink(request.company.id);
  return reply.send(result);
}

export async function createConnectAccountSessionHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const body = request.body as ConnectAccountSessionBody;
  const result = await createEmbeddedConnectSession(request.company.id, body.components);
  return reply.send(result);
}
