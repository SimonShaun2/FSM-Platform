import { sql } from "drizzle-orm";

import { pingObjectStorageBucket } from "@fsm/config/storage";
import { db } from "@fsm/db";
import { redisConnection } from "@fsm/jobs";

export type HealthCheckStatus = "ok" | "error";

export type DependencyHealth = {
  status: HealthCheckStatus;
  latencyMs?: number;
  message?: string;
};

export type LivenessPayload = {
  status: "ok";
  service: "api";
  uptimeSeconds: number;
  instanceId: string | null;
};

export type ApiHealthSummary = {
  status: "ok" | "degraded";
  service: "api";
  tier: string;
  checks: {
    database: DependencyHealth;
    redis: DependencyHealth;
    objectStorage: DependencyHealth;
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

async function timedCheck(run: () => Promise<void>): Promise<DependencyHealth> {
  const started = Date.now();

  try {
    await run();
    return { status: "ok", latencyMs: Date.now() - started };
  } catch (error) {
    const message = error instanceof Error ? error.message : "dependency check failed";
    return { status: "error", latencyMs: Date.now() - started, message };
  }
}

export async function checkDatabaseHealth(): Promise<DependencyHealth> {
  return timedCheck(async () => {
    await db.execute(sql`select 1 as ok`);
  });
}

export async function checkRedisHealth(): Promise<DependencyHealth> {
  return timedCheck(async () => {
    const pong = await redisConnection.ping();
    if (pong !== "PONG") {
      throw new Error(`unexpected Redis ping response: ${pong}`);
    }
  });
}

export async function checkObjectStorageHealth(): Promise<DependencyHealth> {
  return timedCheck(async () => {
    await pingObjectStorageBucket();
  });
}

export async function getApiDependencyHealth(): Promise<ApiHealthSummary> {
  const [database, redis, objectStorage] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkObjectStorageHealth()
  ]);

  const checks = { database, redis, objectStorage };
  const degraded = Object.values(checks).some((check) => check.status === "error");

  return {
    status: degraded ? "degraded" : "ok",
    service: "api",
    tier: process.env.RENVANI_DEPLOYMENT_TIER?.trim() || "development",
    checks
  };
}
