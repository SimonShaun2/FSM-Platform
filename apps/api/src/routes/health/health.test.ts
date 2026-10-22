import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getLivenessPayloadMock = vi.hoisted(() =>
  vi.fn(() => ({
    status: "ok" as const,
    service: "api" as const,
    uptimeSeconds: 10,
    instanceId: null
  }))
);

const probeDatabaseMock = vi.hoisted(() => vi.fn());
const runReadinessChecksMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/runtime-health.service.js", () => ({
  getLivenessPayload: getLivenessPayloadMock,
  probeDatabase: probeDatabaseMock,
  runReadinessChecks: runReadinessChecksMock
}));

import healthRoutes from "./index.js";

describe("health routes", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    probeDatabaseMock.mockReset();
    runReadinessChecksMock.mockReset();
    app = Fastify();
    await app.register(healthRoutes);
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /health returns liveness without auth", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", service: "api" });
  });

  it("GET /health/db returns 503 when database probe fails", async () => {
    probeDatabaseMock.mockResolvedValueOnce({ status: "error", message: "db down" });

    const response = await app.inject({ method: "GET", url: "/health/db" });
    expect(response.statusCode).toBe(503);
  });

  it("GET /health/ready returns 200 when readiness checks pass", async () => {
    runReadinessChecksMock.mockResolvedValueOnce({
      status: "ok",
      service: "api",
      checks: {
        database: { status: "ok" },
        redis: { status: "ok" }
      }
    });

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(200);
  });
});
