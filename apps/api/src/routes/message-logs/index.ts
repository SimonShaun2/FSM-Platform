import type { FastifyPluginAsync } from "fastify";

import { listMessageLogsHandler } from "./handlers.js";
import {
  listMessageLogsRouteSchema,
  listMessageLogsValidation
} from "./schemas.js";

const messageLogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/message-logs",
    {
      preValidation: [listMessageLogsValidation],
      preHandler: [fastify.authenticate],
      schema: listMessageLogsRouteSchema
    },
    listMessageLogsHandler
  );
};

export default messageLogRoutes;
