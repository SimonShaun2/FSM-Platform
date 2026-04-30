import type { FastifyPluginAsync } from "fastify";

import {
  createReviewRequestHandler,
  getOnTheWayStatusHandler,
  listJobTimeEntriesHandler,
  sendOnTheWayHandler,
  startTimeEntryHandler,
  stopTimeEntryHandler
} from "./handlers.js";
import {
  createReviewRequestRouteSchema,
  createReviewRequestValidation,
  createTimeEntryRouteSchema,
  getOnTheWayRouteSchema,
  jobIdValidation,
  listTimeEntriesRouteSchema,
  onTheWayRouteSchema,
  onTheWayValidation,
  startTimeEntryValidation,
  stopTimeEntryValidation,
  updateTimeEntryRouteSchema
} from "./schemas.js";

const jobEngagementRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/:id/time/start", {
    preHandler: [fastify.authenticate],
    preValidation: [startTimeEntryValidation],
    schema: createTimeEntryRouteSchema
  }, startTimeEntryHandler);

  fastify.post("/:id/time/stop", {
    preHandler: [fastify.authenticate],
    preValidation: [stopTimeEntryValidation],
    schema: updateTimeEntryRouteSchema
  }, stopTimeEntryHandler);

  fastify.get("/:id/time", {
    preHandler: [fastify.authenticate],
    preValidation: [jobIdValidation],
    schema: listTimeEntriesRouteSchema
  }, listJobTimeEntriesHandler);

  fastify.post("/:id/on-the-way", {
    preHandler: [fastify.authenticate],
    preValidation: [onTheWayValidation],
    schema: onTheWayRouteSchema
  }, sendOnTheWayHandler);

  fastify.get("/:id/on-the-way", {
    preHandler: [fastify.authenticate],
    preValidation: [jobIdValidation],
    schema: getOnTheWayRouteSchema
  }, getOnTheWayStatusHandler);

  fastify.post("/:id/review-request", {
    preHandler: [fastify.authenticate],
    preValidation: [createReviewRequestValidation],
    schema: createReviewRequestRouteSchema
  }, createReviewRequestHandler);
};

export default jobEngagementRoutes;
