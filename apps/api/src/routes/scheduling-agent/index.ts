import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  confirmSchedulingOptionHandler,
  listSchedulingOptionsHandler,
  selectSchedulingOptionHandler
} from "./handlers.js";
import {
  confirmSchedulingOptionValidation,
  listSchedulingOptionsValidation,
  selectSchedulingOptionValidation
} from "./schemas.js";

const schedulingAgentRoles = requireRole(["owner", "admin", "dispatcher"]);

const schedulingAgentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/scheduling-agent/booking-requests/:bookingRequestId/options", {
    preHandler: [fastify.authenticate, schedulingAgentRoles],
    preValidation: [listSchedulingOptionsValidation]
  }, listSchedulingOptionsHandler);

  fastify.post("/scheduling-agent/booking-requests/:bookingRequestId/select-option", {
    preHandler: [fastify.authenticate, schedulingAgentRoles],
    preValidation: [selectSchedulingOptionValidation]
  }, selectSchedulingOptionHandler);

  fastify.post("/scheduling-agent/booking-requests/:bookingRequestId/confirm", {
    preHandler: [fastify.authenticate, schedulingAgentRoles],
    preValidation: [confirmSchedulingOptionValidation]
  }, confirmSchedulingOptionHandler);
};

export default schedulingAgentRoutes;
