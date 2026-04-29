import type { FastifyPluginAsync } from "fastify";

import { listActivityEventsHandler } from "./handlers.js";
import {
  listActivityEventsRouteSchema,
  listActivityEventsValidation
} from "./schemas.js";

const activityEventRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/activity-events",
    {
      preValidation: [listActivityEventsValidation],
      preHandler: [fastify.authenticate],
      schema: listActivityEventsRouteSchema
    },
    listActivityEventsHandler
  );
};

export default activityEventRoutes;
