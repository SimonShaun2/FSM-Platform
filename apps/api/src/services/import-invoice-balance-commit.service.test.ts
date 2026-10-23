import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("../../../../packages/db/src/client.js", async () => {
  const helper = await import("../test-support/fake-db.js");
  return { db: helper.db };
});

vi.mock("../../../../packages/db/src/events.js", () => ({
  emitEventWithExecutor: vi.fn(async () => undefined),
}));

vi.mock("../../../../packages/db/src/schema.js", async () => {
  const helper = await import("../test-support/fake-db.js");
  return {
    invoices: helper.invoices,
    payments: helper.payments,
    activityEvents: helper.activityEvents,
  };
});

type FakeDbModule = typeof import("../test-support/fake-db.js");
type CommitModule = typeof import("../../../../packages/db/src/import-invoice-balance-commit.service.js");

let fakeDb: FakeDbModule;
let commitModule: CommitModule;

beforeAll(async () => {
  fakeDb = await import("../test-support/fake-db.js");
  commitModule = await import("../../../../packages/db/src/import-invoice-balance-commit.service.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

describe("import-invoice-balance-commit.service", () => {
  it("preserves paid_at on fully paid invoice rows", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme-paid" });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Pat",
      lastName: "Lee",
    });
    const importSession = fakeDb.seedImportSession({
      companyId: company.id,
      entityType: "invoices",
      status: "importing",
      fileName: "invoices.csv",
      fileUrl: "https://r2.test/invoices.csv",
    });
    const paidAt = new Date("2024-06-15T12:00:00.000Z");

    await commitModule.commitImportedInvoiceRows(
      {
        companyId: company.id,
        importSessionId: importSession.id,
        sourceSystem: "qbo",
      },
      [
        {
          rowNumber: 2,
          sourceId: "inv-paid-1",
          invoiceNumber: "INV-1002",
          customerId: customer.id,
          total: "300.00",
          balanceDue: "0.00",
          paidAt,
        },
      ],
      {
        async resolveCustomerId({ customerId }) {
          return customerId ?? null;
        },
      },
    );

    const paidInvoice = fakeDb.getTestState().invoices.find((row) => row.sourceId === "inv-paid-1");
    expect(paidInvoice?.paidAt?.toISOString()).toBe(paidAt.toISOString());
    expect(paidInvoice?.status).toBe("paid");
  });

  it("clears open balance when payments are committed", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme-open" });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Pat",
      lastName: "Lee",
    });
    const importSession = fakeDb.seedImportSession({
      companyId: company.id,
      entityType: "invoices",
      status: "importing",
      fileName: "invoices.csv",
      fileUrl: "https://r2.test/invoices.csv",
    });

    await commitModule.commitImportedInvoiceRows(
      {
        companyId: company.id,
        importSessionId: importSession.id,
        sourceSystem: "qbo",
      },
      [
        {
          rowNumber: 2,
          sourceId: "inv-open-1",
          invoiceNumber: "INV-1001",
          customerId: customer.id,
          total: "500.00",
          balanceDue: "200.00",
        },
      ],
      {
        async resolveCustomerId({ customerId }) {
          return customerId ?? null;
        },
      },
    );

    const paymentPaidAt = new Date("2024-06-20T15:30:00.000Z");
    await commitModule.commitImportedPaymentRows(
      {
        companyId: company.id,
        importSessionId: importSession.id,
        sourceSystem: "qbo",
      },
      [
        {
          rowNumber: 2,
          sourceId: "pay-1",
          invoiceSourceId: "inv-open-1",
          amount: "200.00",
          paidAt: paymentPaidAt,
          method: "check",
        },
      ],
      {
        async resolveCustomerId() {
          return customer.id;
        },
      },
    );

    const openInvoice = fakeDb.getTestState().invoices.find((row) => row.sourceId === "inv-open-1");
    const payment = fakeDb.getTestState().payments.find((row) => row.sourceId === "pay-1");

    expect(openInvoice?.balanceDue).toBe("0.00");
    expect(openInvoice?.status).toBe("paid");
    expect(payment?.paidAt?.toISOString()).toBe(paymentPaidAt.toISOString());
  });
});
