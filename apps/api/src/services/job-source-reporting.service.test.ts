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

    const summary = await reporting.getJobSourceReportingSummary(company.id, company.timezone, {
      startDate: "2026-10-01",
      endDate: "2026-10-31"
    });

    expect(summary.period.timeZone).toBe(company.timezone);
    expect(summary.period.dateInterpretation).toBe("company_local_days");
    expect(summary.totals.bookedJobCount).toBe(4);
    expect(summary.totals.revenue).toBe("820.00");
    expect(summary.totals.unknownAttributionDefinition).toBe(reporting.UNKNOWN_ATTRIBUTION_DEFINITION);

    const byChannel = new Map(summary.channels.map((channel) => [channel.channel, channel]));

    expect(byChannel.get("own_website")?.bookedJobCount).toBe(1);
    expect(byChannel.get("booking")?.bookedJobCount).toBe(1);
    expect(byChannel.get("repeat_customers")?.bookedJobCount).toBe(1);
    expect(byChannel.get("imported_or_other")?.bookedJobCount).toBe(1);
    expect(summary.totals.unknownAttributionCount).toBe(0);
    expect(byChannel.get("own_website")).not.toHaveProperty("jobIds");
  });

  it("omits other companies' jobs (tenant scope via SQL filters)", async () => {
    const companyA = fakeDb.seedCompany({ name: "Tenant A", slug: "tenant-a" });
    const companyB = fakeDb.seedCompany({ name: "Tenant B", slug: "tenant-b" });
    const customerA = fakeDb.seedCustomer({
      companyId: companyA.id,
      firstName: "A",
      lastName: "Customer",
      leadSource: "website"
    });
    const customerB = fakeDb.seedCustomer({
      companyId: companyB.id,
      firstName: "B",
      lastName: "Customer",
      leadSource: "website"
    });

    fakeDb.seedJob({
      companyId: companyA.id,
      customerId: customerA.id,
      jobNumber: "JOB-A1",
      title: "A job",
      status: "completed",
      leadSource: "website",
      scheduledStart: new Date("2026-10-10T12:00:00.000Z"),
      amountPaid: "100.00"
    });

    fakeDb.seedJob({
      companyId: companyB.id,
      customerId: customerB.id,
      jobNumber: "JOB-B1",
      title: "B job",
      status: "completed",
      leadSource: "website",
      scheduledStart: new Date("2026-10-10T12:00:00.000Z"),
      amountPaid: "50.00"
    });

    const summaryB = await reporting.getJobSourceReportingSummary(companyB.id, companyB.timezone, {
      startDate: "2026-10-01",
      endDate: "2026-10-31"
    });

    expect(summaryB.totals.bookedJobCount).toBe(1);
    expect(summaryB.totals.revenue).toBe("50.00");
  });

  it("caps includeJobIds at 25 per channel and sets jobIdsTruncated", async () => {
    const company = fakeDb.seedCompany({ name: "Cap Co", slug: "cap-co" });

    for (let index = 0; index < 26; index += 1) {
      const customer = fakeDb.seedCustomer({
        companyId: company.id,
        firstName: "Web",
        lastName: `Lead${index}`,
        leadSource: "direct_web"
      });

      fakeDb.seedJob({
        companyId: company.id,
        customerId: customer.id,
        jobNumber: `JOB-CAP-${index}`,
        title: `Web job ${index}`,
        status: "completed",
        leadSource: "direct_web",
        scheduledStart: new Date(`2026-10-${String(10 + (index % 10)).padStart(2, "0")}T12:00:00.000Z`),
        amountPaid: "10.00"
      });
    }

    const summary = await reporting.getJobSourceReportingSummary(company.id, company.timezone, {
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      includeJobIds: true
    });

    const ownWebsite = summary.channels.find((channel) => channel.channel === "own_website");

    expect(ownWebsite?.bookedJobCount).toBe(26);
    expect(ownWebsite?.jobIds).toHaveLength(reporting.MAX_JOB_IDS_PER_CHANNEL);
    expect(ownWebsite?.jobIdsTruncated).toBe(true);
  });
});
