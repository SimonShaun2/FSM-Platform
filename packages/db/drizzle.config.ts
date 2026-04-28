import { defineConfig } from "drizzle-kit";

import { env } from "../config/src/env.js";

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL
  }
});
