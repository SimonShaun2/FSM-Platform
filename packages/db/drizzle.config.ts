import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit loads this file without compiling @fsm/config.
 * Only DATABASE_URL is required for migrate/generate.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required to run drizzle-kit (e.g. export DATABASE_URL=postgres://...)"
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl
  }
});
