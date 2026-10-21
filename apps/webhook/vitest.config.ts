import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 30000,
    server: {
      deps: {
        // Workspace packages must be transformed so vi.mock("@fsm/jobs") replaces
        // notificationsQueue before stripe.handler.ts is loaded (avoids real BullMQ).
        inline: ["@fsm/jobs", "@fsm/db", "@fsm/config"]
      }
    }
  }
});
