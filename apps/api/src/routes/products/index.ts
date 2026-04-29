import type { FastifyPluginAsync } from "fastify";

import { requireRole } from "../../lib/authorize.js";
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  listProductsHandler,
  searchProductsHandler,
  updateProductHandler
} from "./handlers.js";
import {
  createProductRouteSchema,
  createProductValidation,
  deleteProductSchema,
  getProductSchema,
  listProductsSchema,
  listProductsValidation,
  productIdValidation,
  searchProductsSchema,
  searchProductsValidation,
  updateProductRouteSchema,
  updateProductValidation
} from "./schemas.js";

const productRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = [fastify.authenticate];
  const adminRoles = requireRole(["owner", "admin"]);

  fastify.get("/products", {
    preHandler: authenticate,
    preValidation: listProductsValidation,
    schema: listProductsSchema
  }, listProductsHandler);

  fastify.post("/products", {
    preHandler: [fastify.authenticate, adminRoles],
    preValidation: createProductValidation,
    schema: createProductRouteSchema
  }, createProductHandler);

  fastify.get("/products/search", {
    preHandler: authenticate,
    preValidation: searchProductsValidation,
    schema: searchProductsSchema
  }, searchProductsHandler);

  fastify.get("/products/:id", {
    preHandler: authenticate,
    preValidation: productIdValidation,
    schema: getProductSchema
  }, getProductHandler);

  fastify.patch("/products/:id", {
    preHandler: [fastify.authenticate, adminRoles],
    preValidation: updateProductValidation,
    schema: updateProductRouteSchema
  }, updateProductHandler);

  fastify.delete("/products/:id", {
    preHandler: [fastify.authenticate, adminRoles],
    preValidation: productIdValidation,
    schema: deleteProductSchema
  }, deleteProductHandler);
};

export default productRoutes;
