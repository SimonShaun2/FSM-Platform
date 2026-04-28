import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  },
  resolve: {
    alias: {
      "@fsm/ai": fileURLToPath(new URL("../../packages/ai/src/index.ts", import.meta.url)),
      "@fsm/jobs": fileURLToPath(new URL("../../packages/jobs/src/index.ts", import.meta.url))
    }
  }
});
