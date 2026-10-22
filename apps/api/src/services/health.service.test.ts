import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeMock, pingMock, redisPingMock } = vi.hoisted(() => ({
  executeMock: vi.fn(async () => [{ ok: 1 }]),
  pingMock: vi.fn(async () => undefined),
  redisPingMock: vi.fn(async () => "PONG")
}));

vi.mock("@fsm/db", () => ({
  db: {
    execute: executeMock
  }
}));

vi.mock("@fsm/config/storage", () => ({
  pingObjectStorageBucket: pingMock
}));

vi.mock("@fsm/jobs", () => ({
  redisConnection: {
    ping: redisPingMock
  }
}));

import {
  checkDatabaseHealth,
  checkObjectStorageHealth,
  checkRedisHealth,
  getApiDependencyHealth
} from "./health.service.js";

describe("health.service (FS-79)", () => {
  beforeEach(() => {
    executeMock.mockClear();
    pingMock.mockClear();
    redisPingMock.mockClear();
  });

  it("reports ok when database, redis, and object storage respond", async () => {
    const summary = await getApiDependencyHealth();
    expect(summary.status).toBe("ok");
    expect(summary.tier).toBe("development");
    expect(summary.checks.database.status).toBe("ok");
    expect(summary.checks.redis.status).toBe("ok");
    expect(summary.checks.objectStorage.status).toBe("ok");
  });

  it("marks database check as error when query fails", async () => {
    executeMock.mockRejectedValueOnce(new Error("db down"));
    const result = await checkDatabaseHealth();
    expect(result.status).toBe("error");
    expect(result.message).toContain("db down");
  });

  it("marks redis check as error when ping fails", async () => {
    redisPingMock.mockResolvedValueOnce("NOPE");
    const result = await checkRedisHealth();
    expect(result.status).toBe("error");
  });

  it("marks object storage check as error when head bucket fails", async () => {
    pingMock.mockRejectedValueOnce(new Error("r2 unreachable"));
    const result = await checkObjectStorageHealth();
    expect(result.status).toBe("error");
  });
});
