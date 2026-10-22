import { beforeEach, describe, expect, it, vi } from "vitest";

const executeMock = vi.hoisted(() => vi.fn());
const pingMock = vi.hoisted(() => vi.fn());

vi.mock("@fsm/db", () => ({
  db: { execute: executeMock }
}));

vi.mock("@fsm/jobs", () => ({
  redisConnection: { ping: pingMock }
}));

import { getLivenessPayload, probeDatabase, probeRedis, runReadinessChecks } from "./runtime-health.service.js";

describe("runtime-health.service", () => {
  beforeEach(() => {
    executeMock.mockReset();
    pingMock.mockReset();
  });

  it("returns liveness without dependency calls", () => {
    const payload = getLivenessPayload();
    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("api");
    expect(payload.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("marks database ok when SELECT 1 succeeds", async () => {
    executeMock.mockResolvedValue(undefined);
    await expect(probeDatabase()).resolves.toEqual({ status: "ok" });
  });

  it("marks redis ok when ping returns PONG", async () => {
    pingMock.mockResolvedValue("PONG");
    await expect(probeRedis()).resolves.toEqual({ status: "ok" });
  });

  it("marks readiness degraded when a dependency fails", async () => {
    executeMock.mockResolvedValue(undefined);
    pingMock.mockRejectedValue(new Error("down"));

    const result = await runReadinessChecks();
    expect(result.status).toBe("degraded");
    expect(result.checks.redis.status).toBe("error");
  });
});
