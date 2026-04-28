import Fastify from "fastify";
import pino from "pino";

import { env } from "@fsm/config";

import authenticatePlugin from "./plugins/authenticate.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import requestLoggerPlugin from "./plugins/request-logger.js";
import authRoutes from "./routes/auth/index.js";
import companyRoutes from "./routes/company/index.js";
import customerRoutes from "./routes/customers/index.js";
import estimateRoutes from "./routes/estimates/index.js";
import invoiceRoutes from "./routes/invoices/index.js";
import jobRoutes from "./routes/jobs/index.js";
import technicianRoutes from "./routes/technicians/index.js";

export async function buildApp() {
  const logger = pino({
    level: env.NODE_ENV === "production" ? "info" : "debug"
  });

  const app = Fastify({
    loggerInstance: logger
  });

  await app.register(requestLoggerPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(authenticatePlugin);

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(companyRoutes, { prefix: "/api/v1/company" });
  await app.register(customerRoutes, { prefix: "/api/v1/customers" });
  await app.register(jobRoutes, { prefix: "/api/v1/jobs" });
  await app.register(technicianRoutes, { prefix: "/api/v1/technicians" });
  await app.register(estimateRoutes, { prefix: "/api/v1/estimates" });
  await app.register(invoiceRoutes, { prefix: "/api/v1/invoices" });

  return app;
}
