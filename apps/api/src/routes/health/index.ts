import type { FastifyInstance } from "fastify";

import {
  databaseHealthHandler,
  liveHandler,
  livenessHandler,
  readinessHandler
} from "./handlers.js";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", livenessHandler);
  fastify.get("/health/live", liveHandler);
  fastify.get("/health/ready", readinessHandler);
  fastify.get("/health/db", databaseHealthHandler);
}
