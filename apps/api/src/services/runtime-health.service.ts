import { sql } from "drizzle-orm";

import { db } from "@fsm/db";

export type HealthComponentStatus = "ok" | "error";

export type HealthComponentResult = {
  status: HealthComponentStatus;
  message?: string;
};

export type LivenessPayload = {
  status: "ok";
  service: "api";
  uptimeSeconds: number;
  instanceId: string | null;
};

export type ReadinessPayload = {
  status: "ok" | "degraded";
  service: "api";
  checks: {
    database: HealthComponentResult;
    redis: HealthComponentResult;
  };
};

const processStartMs = Date.now();

export function getLivenessPayload(): LivenessPayload {
  const instanceId = process.env.API_INSTANCE_ID?.trim() || null;

  return {
    status: "ok",
    service: "api",
    uptimeSeconds: Math.floor((Date.now() - processStartMs) / 1000),
    instanceId
  };
}

export async function probeDatabase(): Promise<HealthComponentResult> {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "ok" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "database unreachable"
    };
  }
}

export async function probeRedis(): Promise<HealthComponentResult> {
  try {
    const { redisConnection } = await import("@fsm/jobs");
    const pong = await redisConnection.ping();
    if (pong !== "PONG") {
      return { status: "error", message: "unexpected redis ping response" };
    }
    return { status: "ok" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "redis unreachable"
    };
  }
}

export async function runReadinessChecks(): Promise<ReadinessPayload> {
  const [database, redis] = await Promise.all([probeDatabase(), probeRedis()]);
  const status = database.status === "ok" && redis.status === "ok" ? "ok" : "degraded";

  return {
    status,
    service: "api",
    checks: { database, redis }
  };
}
