import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { updateTimeEntryHandler } from "./handlers.js";
import { updateTimeEntryRouteSchema, updateTimeEntryValidation } from "./schemas.js";

const adminRoles = requireRole(["owner", "admin"]);

const timeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.patch("/:entryId", {
    preHandler: [fastify.authenticate, adminRoles],
    preValidation: [updateTimeEntryValidation],
    schema: updateTimeEntryRouteSchema
  }, updateTimeEntryHandler);
};

export default timeRoutes;
