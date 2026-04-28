import type { FastifyPluginAsync } from "fastify";

import {
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
  resetPasswordHandler
} from "./handlers.js";
import {
  forgotPasswordRouteSchema,
  forgotPasswordValidation,
  loginRouteSchema,
  loginValidation,
  logoutRouteSchema,
  logoutValidation,
  refreshRouteSchema,
  refreshValidation,
  registerRouteSchema,
  registerValidation,
  resetPasswordRouteSchema,
  resetPasswordValidation
} from "./schemas.js";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/register", { preValidation: [registerValidation], schema: registerRouteSchema }, registerHandler);
  fastify.post("/login", { preValidation: [loginValidation], schema: loginRouteSchema }, loginHandler);
  fastify.post("/refresh", { preValidation: [refreshValidation], schema: refreshRouteSchema }, refreshHandler);
  fastify.post("/logout", { preValidation: [logoutValidation], schema: logoutRouteSchema }, logoutHandler);
  fastify.post(
    "/forgot-password",
    { preValidation: [forgotPasswordValidation], schema: forgotPasswordRouteSchema },
    forgotPasswordHandler
  );
  fastify.post(
    "/reset-password",
    { preValidation: [resetPasswordValidation], schema: resetPasswordRouteSchema },
    resetPasswordHandler
  );
};

export default authRoutes;
