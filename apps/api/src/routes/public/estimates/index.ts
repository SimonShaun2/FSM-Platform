import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import {
  customerApproveEstimateHandler,
  customerDeclineEstimateHandler,
  getPublicEstimateHandler
} from "./handlers.js";
import {
  customerApproveValidation,
  customerDeclineValidation,
  getPublicEstimateSchema,
  publicEstimateActionSchema,
  publicEstimateValidation
} from "./schemas.js";

const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const requestTimesByToken = new Map<string, number[]>();

async function tokenRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = request.params as { token?: string };
  const token = params.token;

  if (!token) {
    return;
  }

  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const currentEntries = requestTimesByToken.get(token) ?? [];
  const activeEntries = currentEntries.filter((timestamp) => timestamp > cutoff);

  if (activeEntries.length >= RATE_LIMIT) {
    await reply.status(429).send({
      error: "RATE_LIMITED",
      message: "Too many requests for this estimate link",
      requestId: request.id
    });
    return;
  }

  activeEntries.push(now);
  requestTimesByToken.set(token, activeEntries);
}

const publicEstimateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:token", {
    preHandler: tokenRateLimit,
    preValidation: publicEstimateValidation,
    schema: getPublicEstimateSchema
  }, getPublicEstimateHandler);

  fastify.post("/:token/approve", {
    preHandler: tokenRateLimit,
    preValidation: customerApproveValidation,
    schema: publicEstimateActionSchema
  }, customerApproveEstimateHandler);

  fastify.post("/:token/decline", {
    preHandler: tokenRateLimit,
    preValidation: customerDeclineValidation,
    schema: publicEstimateActionSchema
  }, customerDeclineEstimateHandler);
};

export default publicEstimateRoutes;
