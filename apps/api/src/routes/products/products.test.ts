import { randomUUID } from "node:crypto";

import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

const { addQueueJob } = vi.hoisted(() => ({
  addQueueJob: vi.fn()
}));

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  aiQueue: {
    add: addQueueJob
  }
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;

beforeAll(async () => {
  buildAppModule = await import("../../app.js");
  fakeDb = await import("../../test-support/fake-db.js");
  tokens = await import("../../lib/tokens.js");
}, 20000);

beforeEach(async () => {
  fakeDb.resetTestState();
  addQueueJob.mockReset();
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function createAuthContext(role: "owner" | "admin" | "dispatcher" = "owner") {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}@example.com`,
    firstName: "Ava",
    lastName: "Stone",
    role
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return {
    company,
    user,
    authorization: `Bearer ${accessToken}`
  };
}

describe("product routes", () => {
  it("GET /products returns paginated results and supports filters", async () => {
    const auth = createAuthContext();

    fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "Capacitor",
      category: "material",
      sortOrder: 1
    });
    fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "Diagnostic Service",
      category: "service",
      sortOrder: 2
    });
    fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "Inactive Product",
      isActive: false
    });

    const response = await request(app.server)
      .get("/api/v1/products?category=material")
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0].name).toBe("Capacitor");
  });

  it("GET /products/search returns max 20 active matches only", async () => {
    const auth = createAuthContext();

    for (let index = 1; index <= 22; index += 1) {
      fakeDb.seedProductCatalog({
        companyId: auth.company.id,
        name: `Filter ${String(index).padStart(2, "0")}`,
        isActive: true,
        sortOrder: index
      });
    }

    fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "Filter Inactive",
      isActive: false
    });

    const response = await request(app.server)
      .get("/api/v1/products/search?q=filter")
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(20);
    expect(response.body.products.every((product: { isActive: boolean }) => product.isActive)).toBe(true);
  });

  it("product write routes require owner/admin and support create, update, and delete", async () => {
    const ownerAuth = createAuthContext("owner");
    const dispatcherAuth = createAuthContext("dispatcher");
    const product = fakeDb.seedProductCatalog({
      companyId: ownerAuth.company.id,
      name: "Existing Product"
    });

    const createResponse = await request(app.server)
      .post("/api/v1/products")
      .set("Authorization", ownerAuth.authorization)
      .send({
        name: "New Product",
        unitPrice: 99
      });
    const createForbiddenResponse = await request(app.server)
      .post("/api/v1/products")
      .set("Authorization", dispatcherAuth.authorization)
      .send({
        name: "Blocked Product",
        unitPrice: 50
      });
    const updateResponse = await request(app.server)
      .patch(`/api/v1/products/${product.id}`)
      .set("Authorization", ownerAuth.authorization)
      .send({
        name: "Updated Product",
        unitPrice: 150
      });
    const updateForbiddenResponse = await request(app.server)
      .patch(`/api/v1/products/${product.id}`)
      .set("Authorization", dispatcherAuth.authorization)
      .send({
        name: "Blocked Update"
      });
    const deleteResponse = await request(app.server)
      .delete(`/api/v1/products/${product.id}`)
      .set("Authorization", ownerAuth.authorization);
    const deleteForbiddenResponse = await request(app.server)
      .delete(`/api/v1/products/${product.id}`)
      .set("Authorization", dispatcherAuth.authorization);

    expect(createResponse.status).toBe(201);
    expect(createForbiddenResponse.status).toBe(403);
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.product.name).toBe("Updated Product");
    expect(updateForbiddenResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteForbiddenResponse.status).toBe(403);
  });

  it("GET /products/:id supports success and 404 for unknown ids", async () => {
    const auth = createAuthContext();
    const product = fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "Diagnostic Service"
    });

    const successResponse = await request(app.server)
      .get(`/api/v1/products/${product.id}`)
      .set("Authorization", auth.authorization);
    const missingResponse = await request(app.server)
      .get(`/api/v1/products/${randomUUID()}`)
      .set("Authorization", auth.authorization);

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.product.id).toBe(product.id);
    expect(missingResponse.status).toBe(404);
  });

  it("DELETE /products/:id returns 409 when the product is linked to an active job", async () => {
    const auth = createAuthContext();
    const customer = fakeDb.seedCustomer({
      companyId: auth.company.id,
      firstName: "Chris",
      lastName: "Pine"
    });
    const job = fakeDb.seedJob({
      companyId: auth.company.id,
      customerId: customer.id,
      title: "Active Job",
      status: "scheduled"
    });
    const product = fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "Active Product"
    });

    fakeDb.seedJobProduct({
      companyId: auth.company.id,
      jobId: job.id,
      productCatalogId: product.id,
      name: product.name,
      unitPrice: "25.00",
      total: "25.00"
    });

    const response = await request(app.server)
      .delete(`/api/v1/products/${product.id}`)
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("CONFLICT");
  });
});
