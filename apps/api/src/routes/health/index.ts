import type { FastifyPluginAsync } from "fastify";

import {
  checkDatabaseHealth,
  checkObjectStorageHealth,
  checkRedisHealth,
  getApiDependencyHealth
} from "../../services/health.service.js";

function dependencyReply(
  check: Awaited<ReturnType<typeof checkDatabaseHealth>>,
  reply: { code: (status: number) => { send: (body: unknown) => unknown } }
) {
  const statusCode = check.status === "ok" ? 200 : 503;
  return reply.code(statusCode).send(check);
}

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async (_request, reply) => {
    return reply.send({ status: "ok", service: "api" });
  });

  fastify.get("/health/ready", async (_request, reply) => {
    const summary = await getApiDependencyHealth();
    const statusCode = summary.status === "ok" ? 200 : 503;
    return reply.code(statusCode).send(summary);
  });

  fastify.get("/health/db", async (_request, reply) => {
    return dependencyReply(await checkDatabaseHealth(), reply);
  });

  fastify.get("/health/redis", async (_request, reply) => {
    return dependencyReply(await checkRedisHealth(), reply);
  });

  fastify.get("/health/storage", async (_request, reply) => {
    return dependencyReply(await checkObjectStorageHealth(), reply);
  });
};

export default healthRoutes;
