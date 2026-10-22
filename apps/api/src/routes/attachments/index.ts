import fastifyMultipart from "@fastify/multipart";
import type { FastifyPluginAsync } from "fastify";

import {
  createAttachmentUploadUrlHandler,
  deleteAttachmentHandler,
  listAttachmentsHandler,
  mintAttachmentDownloadUrlHandler,
  uploadAttachmentHandler
} from "./handlers.js";
import {
  attachmentIdValidation,
  attachmentListValidation,
  createAttachmentUploadUrlRouteSchema,
  createAttachmentUploadUrlValidation,
  deleteAttachmentRouteSchema,
  listAttachmentsRouteSchema,
  mintAttachmentDownloadUrlRouteSchema,
  uploadAttachmentRouteSchema
} from "./schemas.js";

const ATTACHMENT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const attachmentRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: ATTACHMENT_MAX_FILE_SIZE_BYTES,
      files: 1,
      parts: 20
    }
  });

  fastify.post("/attachments", {
    preHandler: [fastify.authenticate],
    schema: uploadAttachmentRouteSchema
  }, uploadAttachmentHandler);

  fastify.get("/attachments", {
    preHandler: [fastify.authenticate],
    preValidation: [attachmentListValidation],
    schema: listAttachmentsRouteSchema
  }, listAttachmentsHandler);

  fastify.get("/attachments/:id/download-url", {
    preHandler: [fastify.authenticate],
    preValidation: [attachmentIdValidation],
    schema: mintAttachmentDownloadUrlRouteSchema
  }, mintAttachmentDownloadUrlHandler);

  fastify.post("/attachments/upload-url", {
    preHandler: [fastify.authenticate],
    preValidation: [createAttachmentUploadUrlValidation],
    schema: createAttachmentUploadUrlRouteSchema
  }, createAttachmentUploadUrlHandler);

  fastify.delete("/attachments/:id", {
    preHandler: [fastify.authenticate],
    preValidation: [attachmentIdValidation],
    schema: deleteAttachmentRouteSchema
  }, deleteAttachmentHandler);
};

export default attachmentRoutes;
