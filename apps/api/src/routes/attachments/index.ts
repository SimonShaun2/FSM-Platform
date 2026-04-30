import type { FastifyPluginAsync } from "fastify";

import {
  deleteAttachmentHandler,
  listAttachmentsHandler,
  uploadAttachmentHandler
} from "./handlers.js";
import {
  attachmentIdValidation,
  attachmentListValidation,
  deleteAttachmentRouteSchema,
  listAttachmentsRouteSchema,
  uploadAttachmentRouteSchema
} from "./schemas.js";

const attachmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/attachments", {
    preHandler: [fastify.authenticate],
    schema: uploadAttachmentRouteSchema
  }, uploadAttachmentHandler);

  fastify.get("/attachments", {
    preHandler: [fastify.authenticate],
    preValidation: [attachmentListValidation],
    schema: listAttachmentsRouteSchema
  }, listAttachmentsHandler);

  fastify.delete("/attachments/:id", {
    preHandler: [fastify.authenticate],
    preValidation: [attachmentIdValidation],
    schema: deleteAttachmentRouteSchema
  }, deleteAttachmentHandler);
};

export default attachmentRoutes;
