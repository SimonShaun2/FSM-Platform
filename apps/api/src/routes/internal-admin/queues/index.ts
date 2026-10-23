import type { FastifyPluginAsync } from "fastify";

import { requireRenaviInternalAdmin } from "../../../lib/require-renavi-internal-admin.js";
import { getPlatformQueueMonitoringHandler } from "./handlers.js";

const internalAdminQueueRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/internal/admin/queues/monitoring", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalAdmin]
  }, getPlatformQueueMonitoringHandler);
};

export default internalAdminQueueRoutes;
