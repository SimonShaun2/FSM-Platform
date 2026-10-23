import type { FastifyPluginAsync } from "fastify";

import { requireRenaviInternalAdmin } from "../../../lib/require-renavi-internal-admin.js";
import {
  getPlatformQueueMonitoringHandler,
  listPlatformDeadLetterJobsHandler,
  listPlatformFailedJobsHandler
} from "./handlers.js";

const internalAdminQueueRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/internal/admin/queues/monitoring", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalAdmin]
  }, getPlatformQueueMonitoringHandler);

  fastify.get("/internal/admin/queues/:queueName/dead-letter", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalAdmin]
  }, listPlatformDeadLetterJobsHandler);

  fastify.get("/internal/admin/queues/:queueName/failed", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalAdmin]
  }, listPlatformFailedJobsHandler);
};

export default internalAdminQueueRoutes;
