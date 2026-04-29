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

type JobProductsServiceModule = typeof import("./job-products.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let jobProductsService: JobProductsServiceModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  jobProductsService = await import("./job-products.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function createContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac"
  });
  const actor = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner"
  });
  const customer = fakeDb.seedCustomer({
    companyId: company.id,
    firstName: "Chris",
    lastName: "Pine"
  });
  const job = fakeDb.seedJob({
    companyId: company.id,
    customerId: customer.id,
    title: "Maintenance Job"
  });

  return { company, actor, customer, job };
}

describe("job-products.service", () => {
  it("listJobProducts returns products in created order", async () => {
    const { company, job } = createContext();

    fakeDb.seedJobProduct({
      companyId: company.id,
      jobId: job.id,
      name: "Filter",
      unitPrice: "25.00",
      total: "25.00",
      createdAt: new Date("2026-04-28T09:00:00.000Z")
    });
    fakeDb.seedJobProduct({
      companyId: company.id,
      jobId: job.id,
      name: "Capacitor",
      unitPrice: "50.00",
      total: "50.00",
      createdAt: new Date("2026-04-28T10:00:00.000Z")
    });

    const products = await jobProductsService.listJobProducts(company.id, job.id);

    expect(products.map((product) => product.name)).toEqual(["Filter", "Capacitor"]);
  });

  it("addProduct snapshots catalog price and preserves it when the catalog changes later", async () => {
    const { company, actor, job } = createContext();
    const catalogProduct = fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Capacitor",
      unitPrice: "89.00",
      description: "45/5 capacitor"
    });

    const added = await jobProductsService.addProduct(company.id, job.id, actor.id, {
      productCatalogId: catalogProduct.id,
      quantity: 2
    });

    fakeDb.getTestState().productCatalog.find((row) => row.id === catalogProduct.id)!.unitPrice = "120.00";

    const listed = await jobProductsService.listJobProducts(company.id, job.id);

    expect(added.unitPrice).toBe("89.00");
    expect(added.total).toBe("178.00");
    expect(listed[0]?.unitPrice).toBe("89.00");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.product_added");
  });

  it("updateJobProduct recalculates totals", async () => {
    const { company, job } = createContext();
    const product = fakeDb.seedJobProduct({
      companyId: company.id,
      jobId: job.id,
      name: "Filter",
      quantity: "1.000",
      unitPrice: "25.00",
      total: "25.00"
    });

    const updated = await jobProductsService.updateJobProduct(company.id, job.id, product.id, {
      quantity: 3,
      unitPrice: 30
    });

    expect(updated.quantity).toBe("3.000");
    expect(updated.unitPrice).toBe("30.00");
    expect(updated.total).toBe("90.00");
  });

  it("removeJobProduct soft deletes the product and emits job.product_removed", async () => {
    const { company, job } = createContext();
    const product = fakeDb.seedJobProduct({
      companyId: company.id,
      jobId: job.id,
      name: "Filter",
      unitPrice: "25.00",
      total: "25.00"
    });

    await jobProductsService.removeJobProduct(company.id, job.id, product.id);

    expect(fakeDb.getTestState().jobProducts.find((row) => row.id === product.id)?.deletedAt).not.toBeNull();
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.product_removed");
  });

  it("approveUpsell updates the product and emits job.upsell_approved", async () => {
    const { company, actor, job } = createContext();
    const product = fakeDb.seedJobProduct({
      companyId: company.id,
      jobId: job.id,
      name: "UV Light",
      unitPrice: "250.00",
      total: "250.00",
      isUpsell: true
    });

    const approved = await jobProductsService.approveUpsell(company.id, job.id, product.id, actor.id);

    expect(approved.upsellApproved).toBe(true);
    expect(approved.upsellApprovedAt).not.toBeNull();
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.upsell_approved");
  });
});
