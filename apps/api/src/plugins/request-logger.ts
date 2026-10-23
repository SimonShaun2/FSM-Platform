import fp from "fastify-plugin";

import { requestPathForLog } from "../lib/request-log-path.js";

declare module "fastify" {
  interface FastifyRequest {
    requestStartTime: number;
  }
}

const requestLoggerPlugin = fp(async (fastify) => {
  fastify.decorateRequest("requestStartTime", 0);

  fastify.addHook("onRequest", async (request) => {
    request.requestStartTime = Date.now();
  });

  fastify.addHook("onResponse", async (request, reply) => {
    const durationMs = Date.now() - request.requestStartTime;

    request.log.info(
      {
        requestId: request.id,
        companyId: request.company?.id ?? null,
        userId: request.user?.id ?? null,
        method: request.method,
        path: requestPathForLog(request.url),
        statusCode: reply.statusCode,
        durationMs
      },
      "Request completed"
    );
  });
});

export default requestLoggerPlugin;
