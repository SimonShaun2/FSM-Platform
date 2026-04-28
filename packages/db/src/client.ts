import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "@fsm/config";

import * as schema from "./schema.js";

const sql = postgres(env.DATABASE_URL, {
  max: 1
});

export const db = drizzle(sql, {
  schema
});

export type Database = typeof db;
