import type { FastifyPluginAsync } from "fastify";

import { getJobSourceReportingHandler } from "./handlers.js";
import { jobSourceReportingRouteSchema, jobSourceReportingValidation } from "./schemas.js";

const reportingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/reporting/job-sources", {
    preValidation: [jobSourceReportingValidation],
    preHandler: [fastify.authenticate],
    schema: jobSourceReportingRouteSchema
  }, getJobSourceReportingHandler);
};

export default reportingRoutes;
