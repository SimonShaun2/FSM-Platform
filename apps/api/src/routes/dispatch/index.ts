import type { FastifyPluginAsync } from "fastify";

import {
  autoFitStubHandler,
  getDispatchViewHandler,
  getDispatchWorkloadHandler,
  listApprovedUnconvertedEstimatesHandler,
  listUnscheduledJobsHandler
} from "./handlers.js";
import {
  autoFitRouteSchema,
  dispatchDateValidation,
  dispatchViewRouteSchema,
  dispatchWorkloadRouteSchema,
  listApprovedUnconvertedEstimatesRouteSchema,
  listUnscheduledJobsRouteSchema
} from "./schemas.js";

const dispatchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/dispatch", {
    preHandler: [fastify.authenticate],
    preValidation: [dispatchDateValidation],
    schema: dispatchViewRouteSchema
  }, getDispatchViewHandler);

  fastify.get("/dispatch/workload", {
    preHandler: [fastify.authenticate],
    preValidation: [dispatchDateValidation],
    schema: dispatchWorkloadRouteSchema
  }, getDispatchWorkloadHandler);

  fastify.post("/dispatch/auto-fit", {
    preHandler: [fastify.authenticate],
    schema: autoFitRouteSchema
  }, autoFitStubHandler);

  fastify.get("/jobs/unscheduled", {
    preHandler: [fastify.authenticate],
    schema: listUnscheduledJobsRouteSchema
  }, listUnscheduledJobsHandler);

  fastify.get("/estimates/approved-unconverted", {
    preHandler: [fastify.authenticate],
    schema: listApprovedUnconvertedEstimatesRouteSchema
  }, listApprovedUnconvertedEstimatesHandler);
};

export default dispatchRoutes;
