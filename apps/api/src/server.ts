import { env } from "@fsm/config";

import { buildApp } from "./app.js";

const app = await buildApp();

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.PORT ?? env.API_PORT
  });
} catch (error) {
  app.log.error({ err: error }, "API server failed to start");
  process.exit(1);
}
