import { describe, expect, it } from "vitest";

import { JOB_SOURCE_REPORTING_MAX_RANGE_DAYS } from "@fsm/types";

import {
  clampJobSourceReportingRange,
  getJobSourceReportingMaxEndDate,
  isJobSourceReportingRangeValid
} from "./job-source-reporting-range.js";

describe("job-source-reporting-range", () => {
  it("allows up to 366 inclusive calendar days", () => {
    expect(isJobSourceReportingRangeValid("2024-01-01", "2024-12-31")).toBe(true);
    expect(isJobSourceReportingRangeValid("2024-01-01", "2025-01-01")).toBe(false);
  });

  it("computes max end date from start", () => {
    expect(getJobSourceReportingMaxEndDate("2026-01-01")).toBe("2027-01-01");
    expect(getJobSourceReportingMaxEndDate("2024-01-01")).toBe("2024-12-31");
  });

  it("clamps end date when range exceeds the cap", () => {
    const clamped = clampJobSourceReportingRange("2026-01-01", "2028-01-01");

    expect(clamped.startDate).toBe("2026-01-01");
    expect(
      isJobSourceReportingRangeValid(clamped.startDate, clamped.endDate)
    ).toBe(true);
    expect(clamped.endDate).toBe(getJobSourceReportingMaxEndDate("2026-01-01"));
  });

  it("exports the shared max range constant", () => {
    expect(JOB_SOURCE_REPORTING_MAX_RANGE_DAYS).toBe(366);
  });
});
