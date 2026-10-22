import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

vi.mock("../../services/health.service.js", () => ({
  getLivenessPayload: vi.fn(() => ({
    status: "ok",
    service: "api",
    uptimeSeconds: 1,
    instanceId: null
  })),
  checkDatabaseHealth: vi.fn(async () => ({ status: "ok", latencyMs: 1 })),
  checkRedisHealth: vi.fn(async () => ({ status: "ok", latencyMs: 1 })),
  checkObjectStorageHealth: vi.fn(async () => ({ status: "ok", latencyMs: 1 })),
  getApiDependencyHealth: vi.fn(async () => ({
    status: "ok",
    service: "api",
    tier: "staging",
    checks: {
      database: { status: "ok" },
      redis: { status: "ok" },
      objectStorage: { status: "ok" }
    }
  }))
}));

type BuildApp = typeof import("../../app.js").buildApp;

describe("health routes (FS-79)", () => {
  let app: Awaited<ReturnType<BuildApp>>;

  beforeAll(async () => {
    const { buildApp } = await import("../../app.js");
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns liveness without auth", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", service: "api" });
  });

  it("GET /health/db returns dependency status", async () => {
    const response = await app.inject({ method: "GET", url: "/health/db" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });
  });

  it("GET /health/ready returns 503 when a dependency is unhealthy", async () => {
    const healthService = await import("../../services/health.service.js");
    const getSummary = vi.mocked(healthService.getApiDependencyHealth);
    getSummary.mockResolvedValueOnce({
      status: "degraded",
      service: "api",
      tier: "staging",
      checks: {
        database: { status: "error", message: "db down" },
        redis: { status: "ok" },
        objectStorage: { status: "ok" }
      }
    });

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: "degraded" });
  });
});
