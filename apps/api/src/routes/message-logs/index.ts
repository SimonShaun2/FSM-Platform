import type { FastifyPluginAsync } from "fastify";

import { listMessageConversationsHandler, listMessageLogsHandler } from "./handlers.js";
import {
  listMessageConversationsRouteSchema,
  listMessageConversationsValidation,
  listMessageLogsRouteSchema,
  listMessageLogsValidation
} from "./schemas.js";

const messageLogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/message-logs/conversations",
    {
      preValidation: [listMessageConversationsValidation],
      preHandler: [fastify.authenticate],
      schema: listMessageConversationsRouteSchema
    },
    listMessageConversationsHandler
  );

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
