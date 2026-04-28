import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  createCampaignHandler,
  generateDraftHandler,
  getCampaignHandler,
  listCampaignsHandler,
  listRecipientsHandler,
  sendCampaignHandler,
  updateCampaignHandler
} from "./handlers.js";
import {
  campaignIdValidation,
  createCampaignRouteSchema,
  createCampaignValidation,
  generateDraftRouteSchema,
  getCampaignRouteSchema,
  listCampaignRecipientsRouteSchema,
  listCampaignRecipientsValidation,
  listCampaignsRouteSchema,
  listCampaignsValidation,
  sendCampaignRouteSchema,
  updateCampaignRouteSchema,
  updateCampaignValidation
} from "./schemas.js";

const ownerOrAdmin = requireRole(["owner", "admin"]);

const campaignRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/campaigns",
    {
      preValidation: [createCampaignValidation],
      preHandler: [fastify.authenticate, ownerOrAdmin],
      schema: createCampaignRouteSchema
    },
    createCampaignHandler
  );

  fastify.get(
    "/campaigns",
    {
      preValidation: [listCampaignsValidation],
      preHandler: [fastify.authenticate],
      schema: listCampaignsRouteSchema
    },
    listCampaignsHandler
  );

  fastify.get(
    "/campaigns/:id",
    {
      preValidation: [campaignIdValidation],
      preHandler: [fastify.authenticate],
      schema: getCampaignRouteSchema
    },
    getCampaignHandler
  );

  fastify.patch(
    "/campaigns/:id",
    {
      preValidation: [updateCampaignValidation],
      preHandler: [fastify.authenticate, ownerOrAdmin],
      schema: updateCampaignRouteSchema
    },
    updateCampaignHandler
  );

  fastify.post(
    "/campaigns/:id/generate-draft",
    {
      preValidation: [campaignIdValidation],
      preHandler: [fastify.authenticate, ownerOrAdmin],
      schema: generateDraftRouteSchema
    },
    generateDraftHandler
  );

  fastify.post(
    "/campaigns/:id/send",
    {
      preValidation: [campaignIdValidation],
      preHandler: [fastify.authenticate, ownerOrAdmin],
      schema: sendCampaignRouteSchema
    },
    sendCampaignHandler
  );

  fastify.get(
    "/campaigns/:id/recipients",
    {
      preValidation: [listCampaignRecipientsValidation],
      preHandler: [fastify.authenticate],
      schema: listCampaignRecipientsRouteSchema
    },
    listRecipientsHandler
  );
};

export default campaignRoutes;
