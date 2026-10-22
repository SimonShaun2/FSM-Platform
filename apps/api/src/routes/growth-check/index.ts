import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { enqueueGrowthCheckScanHandler, getGrowthCheckScanHandler } from "./handlers.js";
import { enqueueGrowthCheckScanValidation, getGrowthCheckScanValidation } from "./schemas.js";

const growthCheckRoles = requireRole(["owner", "admin", "dispatcher"]);

const growthCheckRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/growth-check/scans", {
    preHandler: [fastify.authenticate, growthCheckRoles],
    preValidation: [enqueueGrowthCheckScanValidation]
  }, enqueueGrowthCheckScanHandler);

  fastify.get("/growth-check/scans/:scanId", {
    preHandler: [fastify.authenticate, growthCheckRoles],
    preValidation: [getGrowthCheckScanValidation]
  }, getGrowthCheckScanHandler);
};

export default growthCheckRoutes;
