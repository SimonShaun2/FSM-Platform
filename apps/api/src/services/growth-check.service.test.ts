import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

const featureFlagState = vi.hoisted(() => ({
  growthCheckPublicScan: true
}));

vi.mock("@fsm/config/feature-flags", () => ({
  featureFlags: {
    get growthCheckPublicScan() {
      return featureFlagState.growthCheckPublicScan;
    }
  }
}));

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  growthQueueAdd: vi.fn()
}));

vi.mock("@fsm/db", () => ({
  db: {
    query: {
      growthCheckScans: {
        findFirst: mocks.findFirst
      }
    },
    insert: mocks.insert,
    select: mocks.select,
    update: vi.fn()
  },
  emitEvent: vi.fn(),
  growthCheckScans: {},
  growthCheckFindings: {}
}));

vi.mock("@fsm/jobs", () => ({
  growthQueue: {
    add: mocks.growthQueueAdd
  }
}));

vi.mock("../lib/growth-check/enqueue-rate-limit.js", () => ({
  checkGrowthCheckEnqueueRateLimits: vi.fn(async () => ({ allowed: true, scope: null }))
}));

import { enqueueGrowthCheckPublicScan } from "./growth-check.service.js";

describe("growth-check.service", () => {
  beforeEach(() => {
    featureFlagState.growthCheckPublicScan = true;
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue(null);
    mocks.insert.mockReturnValue({
      returning: vi.fn(async () => [
        {
          id: "scan-1",
          companyId: "company-1",
          targetUrl: "https://example-cleaning.com",
          rubricId: "residential-cleaning",
          rubricVersion: "1.0.0",
          status: "queued",
          progress: {},
          idempotencyKey: "idem-12345678",
          failureReason: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
    });
    mocks.growthQueueAdd.mockResolvedValue(undefined);
    mocks.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(async () => [])
      }))
    });
  });

  it("returns existing scan for duplicate idempotency key", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "scan-existing",
      companyId: "company-1",
      targetUrl: "https://example-cleaning.com",
      rubricId: "residential-cleaning",
      rubricVersion: "1.0.0",
      status: "queued",
      progress: {},
      idempotencyKey: "idem-12345678",
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await enqueueGrowthCheckPublicScan("company-1", "user-1", {
      targetUrl: "https://example-cleaning.com",
      idempotencyKey: "idem-12345678"
    });

    expect(result.id).toBe("scan-existing");
    expect(mocks.growthQueueAdd).not.toHaveBeenCalled();
  });

  it("rejects disallowed target hosts", async () => {
    await expect(
      enqueueGrowthCheckPublicScan("company-1", "user-1", {
        targetUrl: "http://127.0.0.1"
      })
    ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
  });

  it("blocks enqueue when feature flag is off", async () => {
    featureFlagState.growthCheckPublicScan = false;

    await expect(
      enqueueGrowthCheckPublicScan("company-1", "user-1", {
        targetUrl: "https://example-cleaning.com"
      })
    ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
  });
});
