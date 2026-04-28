import type { FastifyPluginAsync } from "fastify";

import {
  createInvoiceHandler,
  deleteInvoiceHandler,
  getInvoiceHandler,
  listInvoicesHandler,
  updateInvoiceHandler
} from "./handlers.js";
import {
  createInvoiceSchema,
  deleteInvoiceSchema,
  getInvoiceSchema,
  listInvoicesSchema,
  updateInvoiceSchema
} from "./schemas.js";

const invoiceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", { preHandler: [fastify.authenticate], schema: listInvoicesSchema }, listInvoicesHandler);
  fastify.post("/", { preHandler: [fastify.authenticate], schema: createInvoiceSchema }, createInvoiceHandler);
  fastify.get("/:id", { preHandler: [fastify.authenticate], schema: getInvoiceSchema }, getInvoiceHandler);
  fastify.patch("/:id", { preHandler: [fastify.authenticate], schema: updateInvoiceSchema }, updateInvoiceHandler);
  fastify.delete("/:id", { preHandler: [fastify.authenticate], schema: deleteInvoiceSchema }, deleteInvoiceHandler);
};

export default invoiceRoutes;
