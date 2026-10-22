import { env } from "@fsm/config";

import { buildApp } from "./app.js";

const app = await buildApp();

const shutdownSignals = ["SIGINT", "SIGTERM"] as const;
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  app.log.info({ signal }, "API graceful shutdown started");

  try {
    await app.close();
    app.log.info("API graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, "API graceful shutdown failed");
    process.exit(1);
  }
}

for (const signal of shutdownSignals) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.API_PORT
  });
  app.log.info({ port: env.API_PORT }, "API listening");
} catch (error) {
  app.log.error({ err: error }, "API server failed to start");
  process.exit(1);
}
