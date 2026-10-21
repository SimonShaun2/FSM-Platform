import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import { createInquiryResponseHandler } from "./handlers.js";
import { createInquiryResponseValidation } from "./schemas.js";

const revenueInquiryRoles = requireRole(["owner", "admin", "dispatcher"]);

const revenueInquiryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/revenue/inquiries/:bookingRequestId/response-draft", {
    preHandler: [fastify.authenticate, revenueInquiryRoles],
    preValidation: [createInquiryResponseValidation]
  }, createInquiryResponseHandler);
};

export default revenueInquiryRoutes;
