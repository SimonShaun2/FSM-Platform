import type { FastifyPluginAsync } from "fastify";

import { requireRenaviInternalAdmin } from "../../../lib/require-renavi-internal-admin.js";
<<<<<<< HEAD
import { getPlatformQueueMonitoringHandler, listPlatformDeadLetterJobsHandler } from "./handlers.js";
=======
import { getPlatformQueueMonitoringHandler } from "./handlers.js";
>>>>>>> origin/dev

const internalAdminQueueRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/internal/admin/queues/monitoring", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalAdmin]
  }, getPlatformQueueMonitoringHandler);
<<<<<<< HEAD

  fastify.get("/internal/admin/queues/:queueName/dead-letter", {
    preHandler: [fastify.authenticate, ...requireRenaviInternalAdmin]
  }, listPlatformDeadLetterJobsHandler);
=======
>>>>>>> origin/dev
};

export default internalAdminQueueRoutes;
