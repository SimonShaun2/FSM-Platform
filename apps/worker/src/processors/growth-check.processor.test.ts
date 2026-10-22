import type { Job } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GROWTH_QUEUE_JOB_NAMES } from "@fsm/types";

const scanState = vi.hoisted(() => ({
  status: "queued" as "queued" | "running" | "completed" | "failed",
  progress: {
    rubricId: "residential-cleaning",
    rubricVersion: "1.0.0",
    areasCompleted: 0,
    totalAreas: 4,
    currentAreaId: "web_presence",
    areas: [
      { areaId: "web_presence", completedChecks: 0, totalChecks: 2 },
      { areaId: "local_discovery", completedChecks: 0, totalChecks: 1 },
      { areaId: "booking_intake", completedChecks: 0, totalChecks: 1 },
      { areaId: "private_operations", completedChecks: 0, totalChecks: 2 }
    ]
  },
  findings: [] as Array<{
    checkId: string;
    status: string;
    summary: string;
  }>
}));

vi.mock("@fsm/config/feature-flags", () => ({
  featureFlags: {
    growthCheckPublicScan: true
  }
}));

vi.mock("@fsm/db", () => ({
  db: {
    query: {
      growthCheckScans: {
        findFirst: vi.fn(async () => ({
          id: "scan-1",
          companyId: "company-1",
          status: scanState.status,
          progress: scanState.progress,
          targetUrl: "https://example-cleaning.com"
        }))
      }
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => undefined)
      }))
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [])
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async (row: { checkId: string; status: string; summary: string }) => {
        scanState.findings.push({
          checkId: row.checkId,
          status: row.status,
          summary: row.summary
        });
      })
    }))
  },
  emitEvent: vi.fn(),
  growthCheckFindings: { id: "id", companyId: "companyId", scanId: "scanId", checkId: "checkId" },
  growthCheckScans: { id: "id", companyId: "companyId", status: "status", progress: "progress" }
}));

import { processGrowthCheckPublicScan } from "./growth-check.processor.js";

function createJob(): Job<Record<string, unknown>> {
  return {
    id: "job-1",
    name: GROWTH_QUEUE_JOB_NAMES.publicScan,
    data: {
      companyId: "company-1",
      scanId: "scan-1",
      targetUrl: "https://example-cleaning.com",
      rubricId: "residential-cleaning",
      rubricVersion: "1.0.0",
      idempotencyKey: "idem-1",
      requestedByUserId: "user-1"
    },
    updateProgress: vi.fn()
  } as unknown as Job<Record<string, unknown>>;
}

describe("growth-check.processor", () => {
  beforeEach(() => {
    scanState.status = "queued";
    scanState.findings = [];
    scanState.progress.areas.forEach((area) => {
      area.completedChecks = 0;
    });
    scanState.progress.areasCompleted = 0;
  });

  it("records private_ops checks as unknown", async () => {
    await processGrowthCheckPublicScan(createJob() as never, {
      fetchPage: async () => ({
        statusCode: 200,
        body: "<html><title>Clean Co</title><a href='/book'>Book now</a></html>"
      })
    });

    const privateFindings = scanState.findings.filter((row) =>
      ["dispatch_coverage", "quality_assurance"].includes(row.checkId)
    );

    expect(privateFindings).toHaveLength(2);
    expect(privateFindings.every((row) => row.status === "unknown")).toBe(true);
  });

  it("skips when scan already completed", async () => {
    scanState.status = "completed";

    await processGrowthCheckPublicScan(createJob() as never, {
      fetchPage: vi.fn()
    });

    expect(scanState.findings).toHaveLength(0);
  });
});
