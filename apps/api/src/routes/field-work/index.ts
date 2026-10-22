import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { submitFieldWorkSyncBatchHandler } from "./handlers.js";
import { submitFieldWorkSyncBatchValidation } from "./schemas.js";

const fieldWorkRoles = requireRole(["owner", "admin", "dispatcher", "technician"]);

const fieldWorkRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/field-work/sync/batches", {
    preHandler: [fastify.authenticate, fieldWorkRoles],
    preValidation: [submitFieldWorkSyncBatchValidation]
  }, submitFieldWorkSyncBatchHandler);
};

export default fieldWorkRoutes;
