import { randomUUID } from "node:crypto";

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

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

type ProductCatalogServiceModule = typeof import("./product-catalog.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let productCatalogService: ProductCatalogServiceModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  productCatalogService = await import("./product-catalog.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function createAdminContext() {
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

  return { company, actor };
}

describe("product-catalog.service", () => {
  it("listProducts returns paginated company-scoped results with filters and default active-only behavior", async () => {
    const { company } = createAdminContext();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac"
    });

    fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Diagnostic Service",
      category: "service",
      sortOrder: 2,
      isActive: true
    });
    fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Capacitor",
      category: "material",
      sortOrder: 1,
      isActive: true
    });
    fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Legacy Item",
      category: "service",
      isActive: false
    });
    fakeDb.seedProductCatalog({
      companyId: otherCompany.id,
      name: "Other Company Product"
    });

    const activeProducts = await productCatalogService.listProducts(company.id, {
      page: 1,
      limit: 10
    });
    const materialProducts = await productCatalogService.listProducts(company.id, {
      category: "material",
      page: 1,
      limit: 10
    });
    const inactiveProducts = await productCatalogService.listProducts(company.id, {
      isActive: false,
      page: 1,
      limit: 10
    });

    expect(activeProducts.total).toBe(2);
    expect(activeProducts.data.map((product) => product.name)).toEqual(["Capacitor", "Diagnostic Service"]);
    expect(materialProducts.total).toBe(1);
    expect(materialProducts.data[0]?.name).toBe("Capacitor");
    expect(inactiveProducts.total).toBe(1);
    expect(inactiveProducts.data[0]?.name).toBe("Legacy Item");
  });

  it("searchProducts returns max 20 active matches only", async () => {
    const { company } = createAdminContext();

    for (let index = 1; index <= 22; index += 1) {
      fakeDb.seedProductCatalog({
        companyId: company.id,
        name: `Filter ${String(index).padStart(2, "0")}`,
        isActive: true,
        sortOrder: index
      });
    }

    fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Filter Inactive",
      isActive: false
    });

    const results = await productCatalogService.searchProducts(company.id, "filter");

    expect(results).toHaveLength(20);
    expect(results.every((product) => product.isActive)).toBe(true);
  });

  it("getProduct returns a product and throws NOT_FOUND for unknown or cross-tenant ids", async () => {
    const { company } = createAdminContext();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac"
    });
    const product = fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Maintenance Plan"
    });
    const otherProduct = fakeDb.seedProductCatalog({
      companyId: otherCompany.id,
      name: "Other Product"
    });

    const result = await productCatalogService.getProduct(company.id, product.id);

    expect(result.id).toBe(product.id);

    await expect(productCatalogService.getProduct(company.id, randomUUID())).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
    await expect(productCatalogService.getProduct(company.id, otherProduct.id)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
  });

  it("createProduct enforces SKU uniqueness and emits product.created", async () => {
    const { company, actor } = createAdminContext();

    fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Existing Product",
      sku: "SKU-1"
    });

    await expect(
      productCatalogService.createProduct(company.id, actor.id, {
        name: "Duplicate SKU",
        sku: "SKU-1",
        unitPrice: 49
      })
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });

    const product = await productCatalogService.createProduct(company.id, actor.id, {
      name: "New Product",
      sku: "SKU-2",
      unitPrice: 125,
      applicableAssetTypes: ["hvac"]
    });

    expect(product.unitPrice).toBe("125.00");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("product.created");
  });

  it("updateProduct updates fields and emits product.updated", async () => {
    const { company, actor } = createAdminContext();
    const product = fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Old Name",
      unitPrice: "25.00"
    });

    const updated = await productCatalogService.updateProduct(company.id, actor.id, product.id, {
      name: "Updated Name",
      unitPrice: 40,
      category: "labor"
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.unitPrice).toBe("40.00");
    expect(updated.category).toBe("labor");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("product.updated");
  });

  it("deleteProduct soft deletes products and throws CONFLICT when linked to active jobs", async () => {
    const { company, actor } = createAdminContext();
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Chris",
      lastName: "Pine"
    });
    const activeJob = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      title: "Active Job",
      status: "scheduled"
    });
    const activeProduct = fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Active Product"
    });
    fakeDb.seedJobProduct({
      companyId: company.id,
      jobId: activeJob.id,
      productCatalogId: activeProduct.id,
      name: activeProduct.name,
      unitPrice: "75.00",
      total: "75.00"
    });

    await expect(
      productCatalogService.deleteProduct(company.id, actor.id, activeProduct.id)
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });

    const completedJob = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      title: "Completed Job",
      status: "completed"
    });
    const removableProduct = fakeDb.seedProductCatalog({
      companyId: company.id,
      name: "Removable Product"
    });
    fakeDb.seedJobProduct({
      companyId: company.id,
      jobId: completedJob.id,
      productCatalogId: removableProduct.id,
      name: removableProduct.name,
      unitPrice: "55.00",
      total: "55.00"
    });

    await productCatalogService.deleteProduct(company.id, actor.id, removableProduct.id);

    expect(fakeDb.getTestState().productCatalog.find((row) => row.id === removableProduct.id)?.deletedAt).not.toBeNull();
  });
});
