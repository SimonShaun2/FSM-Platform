import { env } from "@fsm/config";

import { buildWebhookApp } from "./app.js";

const app = await buildWebhookApp();

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.WEBHOOK_PORT
  });
} catch (error) {
  app.log.error({ err: error }, "Webhook server failed to start");
  process.exit(1);
}
