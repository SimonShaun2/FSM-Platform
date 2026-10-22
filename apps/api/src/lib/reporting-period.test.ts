import { describe, expect, it } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";
import {
  assertJobSourceReportingPeriodAllowed,
  resolveReportingPeriod
} from "./reporting-period.js";

setupTestEnv();

describe("resolveReportingPeriod", () => {
  it("interprets YYYY-MM-DD bounds in the company timezone", () => {
    const period = resolveReportingPeriod("2026-10-01", "2026-10-01", "America/Chicago");

    expect(period.dateInterpretation).toBe("company_local_days");
    expect(period.timeZone).toBe("America/Chicago");
    expect(period.start.toISOString()).toBe("2026-10-01T05:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-10-02T04:59:59.999Z");
  });

  it("treats full ISO timestamps as UTC instants", () => {
    const period = resolveReportingPeriod(
      "2026-10-01T00:00:00.000Z",
      "2026-10-31T23:59:59.999Z",
      "America/Chicago"
    );

    expect(period.dateInterpretation).toBe("utc_instant");
    expect(period.start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-10-31T23:59:59.999Z");
  });
});

describe("assertJobSourceReportingPeriodAllowed", () => {
  it("rejects inverted ranges and spans longer than 366 days", () => {
    const valid = resolveReportingPeriod("2024-01-01", "2024-12-31", "America/Chicago");
    assertJobSourceReportingPeriodAllowed(valid);

    const inverted = resolveReportingPeriod("2026-10-10", "2026-10-01", "America/Chicago");
    expect(() => assertJobSourceReportingPeriodAllowed(inverted)).toThrow(
      "startDate must be on or before endDate"
    );

    const tooLong = resolveReportingPeriod("2024-01-01", "2025-01-01", "America/Chicago");
    expect(() => assertJobSourceReportingPeriodAllowed(tooLong)).toThrow(
      "Reporting date range cannot exceed 366 days"
    );
  });
});
