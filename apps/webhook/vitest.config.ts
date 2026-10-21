import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    hookTimeout: 30000,
    testTimeout: 30000,
    server: {
      deps: {
        inline: ["@fsm/db", "@fsm/config"]
      }
    }
  },
  resolve: {
    alias: {
      // Force tests to use the stub queue so `pnpm build` does not load dist/BullMQ.
      "@fsm/jobs": fileURLToPath(new URL("./src/test-support/fsm-jobs.mock.ts", import.meta.url))
    }
  }
});
