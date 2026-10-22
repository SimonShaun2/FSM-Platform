import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  createInquiryResponseHandler,
  getInquiryIntakeHandler,
  inboxInquiryIntakeHandler,
  staffInquiryIntakeHandler
} from "./handlers.js";
import {
  createInquiryResponseValidation,
  getInquiryIntakeValidation,
  inboxInquiryIntakeValidation,
  staffInquiryIntakeValidation
} from "./schemas.js";

const revenueInquiryRoles = requireRole(["owner", "admin", "dispatcher"]);

const revenueInquiryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/revenue/inquiries/:bookingRequestId/response-draft", {
    preHandler: [fastify.authenticate, revenueInquiryRoles],
    preValidation: [createInquiryResponseValidation]
  }, createInquiryResponseHandler);

  fastify.post("/revenue/inquiries/intake", {
    preHandler: [fastify.authenticate, revenueInquiryRoles],
    preValidation: [staffInquiryIntakeValidation]
  }, staffInquiryIntakeHandler);

  fastify.post("/revenue/inquiries/inbox", {
    preHandler: [fastify.authenticate, revenueInquiryRoles],
    preValidation: [inboxInquiryIntakeValidation]
  }, inboxInquiryIntakeHandler);

  fastify.get("/revenue/inquiries/:bookingRequestId", {
    preHandler: [fastify.authenticate, revenueInquiryRoles],
    preValidation: [getInquiryIntakeValidation]
  }, getInquiryIntakeHandler);
};

export default revenueInquiryRoutes;
