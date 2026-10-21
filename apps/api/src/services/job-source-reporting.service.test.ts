import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

type ReportingModule = typeof import("./job-source-reporting.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let reporting: ReportingModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  reporting = await import("./job-source-reporting.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

describe("classifyJobGrowthChannel", () => {
  it("prioritizes import and repeat attribution", () => {
    expect(
      reporting.classifyJobGrowthChannel({
        job: {
          leadSource: "website",
          importSessionId: "11111111-1111-4111-8111-111111111111",
          customerId: "cust",
          createdAt: new Date(),
          status: "scheduled"
        },
        customer: null,
        hasPriorBookedJob: false
      })
    ).toBe("imported_or_other");

    expect(
      reporting.classifyJobGrowthChannel({
        job: {
          leadSource: "website",
          importSessionId: null,
          customerId: "cust",
          createdAt: new Date(),
          status: "scheduled"
        },
        customer: null,
        hasPriorBookedJob: true
      })
    ).toBe("repeat_customers");
  });

  it("maps booking and owned web sources", () => {
    expect(
      reporting.classifyJobGrowthChannel({
        job: {
          leadSource: "google",
          importSessionId: null,
          customerId: "cust",
          createdAt: new Date(),
          status: "scheduled"
        },
        customer: null,
        hasPriorBookedJob: false
      })
    ).toBe("booking");

    expect(
      reporting.classifyJobGrowthChannel({
        job: {
          leadSource: "direct_web",
          importSessionId: null,
          customerId: "cust",
          createdAt: new Date(),
          status: "scheduled"
        },
        customer: null,
        hasPriorBookedJob: false
      })
    ).toBe("own_website");
  });
});

describe("getJobSourceReportingSummary", () => {
  it("aggregates booked jobs and revenue by growth channel", async () => {
    const company = fakeDb.seedCompany({ name: "Growth Co", slug: "growth-co" });
    const importSession = fakeDb.seedImportSession({
      companyId: company.id,
      fileName: "jobs.csv",
      fileUrl: "https://example.com/jobs.csv"
    });

    const websiteCustomer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Web",
      lastName: "Lead",
      leadSource: "direct_web"
    });
    const bookingCustomer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Book",
      lastName: "Lead",
      leadSource: "google"
    });
    const repeatCustomer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Repeat",
      lastName: "Buyer",
      leadSource: "website"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: websiteCustomer.id,
      jobNumber: "JOB-1001",
      title: "Website job",
      status: "completed",
      leadSource: "direct_web",
      scheduledStart: new Date("2026-10-10T15:00:00.000Z"),
      amountPaid: "250.00"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: bookingCustomer.id,
      jobNumber: "JOB-1002",
      title: "Booking job",
      status: "scheduled",
      leadSource: "google",
      scheduledStart: new Date("2026-10-12T10:00:00.000Z"),
      invoiceTotal: "180.00"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: repeatCustomer.id,
      jobNumber: "JOB-1000",
      title: "First visit",
      status: "completed",
      leadSource: "website",
      scheduledStart: new Date("2026-09-01T12:00:00.000Z"),
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
      amountPaid: "120.00"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: repeatCustomer.id,
      jobNumber: "JOB-1003",
      title: "Repeat visit",
      status: "completed",
      leadSource: "website",
      scheduledStart: new Date("2026-10-15T12:00:00.000Z"),
      createdAt: new Date("2026-10-15T12:00:00.000Z"),
      amountPaid: "300.00"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: websiteCustomer.id,
      jobNumber: "JOB-1004",
      title: "Imported job",
      status: "paid",
      leadSource: null,
      importSessionId: importSession.id,
      scheduledStart: new Date("2026-10-18T09:00:00.000Z"),
      amountPaid: "90.00"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: bookingCustomer.id,
      jobNumber: "JOB-0999",
      title: "Open lead",
      status: "lead",
      leadSource: "google",
      scheduledStart: new Date("2026-10-11T09:00:00.000Z")
    });

    const summary = await reporting.getJobSourceReportingSummary(company.id, {
      startDate: "2026-10-01",
      endDate: "2026-10-31"
    });

    expect(summary.totals.bookedJobCount).toBe(4);
    expect(summary.totals.revenue).toBe("820.00");

    const byChannel = new Map(summary.channels.map((channel) => [channel.channel, channel]));

    expect(byChannel.get("own_website")?.bookedJobCount).toBe(1);
    expect(byChannel.get("booking")?.bookedJobCount).toBe(1);
    expect(byChannel.get("repeat_customers")?.bookedJobCount).toBe(1);
    expect(byChannel.get("imported_or_other")?.bookedJobCount).toBe(1);
    expect(summary.totals.unknownAttributionCount).toBe(0);
  });
});
