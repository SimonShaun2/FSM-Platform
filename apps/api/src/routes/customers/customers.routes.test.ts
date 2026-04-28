import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

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
    add: vi.fn()
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
});

beforeEach(async () => {
  fakeDb.resetTestState();
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function createAuthContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner"
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

function seedCustomerGraph(companyId: string) {
  const customer = fakeDb.seedCustomer({
    companyId,
    firstName: "Chris",
    lastName: "Pine",
    email: "chris@example.com",
    phone: "555-0100",
    tags: ["vip"]
  });
  const property = fakeDb.seedProperty({
    companyId,
    customerId: customer.id,
    addressLine1: "101 Main St",
    city: "Tulsa",
    state: "OK",
    zip: "74103",
    isPrimary: true
  });
  const asset = fakeDb.seedAsset({
    companyId,
    customerId: customer.id,
    propertyId: property.id,
    name: "Main HVAC Unit",
    assetType: "hvac"
  });

  return { customer, property, asset };
}

describe("customer routes", () => {
  it("GET /customers returns paginated results and requires authentication", async () => {
    const auth = createAuthContext();
    seedCustomerGraph(auth.company.id);

    const successResponse = await request(app.server)
      .get("/api/v1/customers?page=1&limit=25")
      .set("Authorization", auth.authorization);
    const unauthorizedResponse = await request(app.server).get("/api/v1/customers");

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.data).toHaveLength(1);
    expect(successResponse.body.totalPages).toBe(1);
    expect(unauthorizedResponse.status).toBe(401);
  });

  it("GET /customers/search resolves before /:id and returns search matches", async () => {
    const auth = createAuthContext();
    seedCustomerGraph(auth.company.id);

    const response = await request(app.server)
      .get("/api/v1/customers/search?q=Chris")
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.customers[0].firstName).toBe("Chris");
  });

  it("POST /customers creates a customer and validates input", async () => {
    const auth = createAuthContext();

    const successResponse = await request(app.server)
      .post("/api/v1/customers")
      .set("Authorization", auth.authorization)
      .send({
        firstName: "Jordan",
        lastName: "Miles",
        email: "jordan@example.com"
      });
    const validationResponse = await request(app.server)
      .post("/api/v1/customers")
      .set("Authorization", auth.authorization)
      .send({
        firstName: "",
        lastName: "Miles"
      });

    expect(successResponse.status).toBe(201);
    expect(successResponse.body.customer.email).toBe("jordan@example.com");
    expect(validationResponse.status).toBe(400);
  });

  it("GET, PATCH, and DELETE /customers/:id work end-to-end", async () => {
    const auth = createAuthContext();
    const { customer } = seedCustomerGraph(auth.company.id);

    const getResponse = await request(app.server)
      .get(`/api/v1/customers/${customer.id}`)
      .set("Authorization", auth.authorization);
    const patchResponse = await request(app.server)
      .patch(`/api/v1/customers/${customer.id}`)
      .set("Authorization", auth.authorization)
      .send({
        displayName: "Chris Pine VIP"
      });
    const deleteResponse = await request(app.server)
      .delete(`/api/v1/customers/${customer.id}`)
      .set("Authorization", auth.authorization);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.customer.properties).toHaveLength(1);
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.customer.displayName).toBe("Chris Pine VIP");
    expect(deleteResponse.status).toBe(204);
  });

  it("cross-tenant customer access returns 404", async () => {
    const auth = createAuthContext();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac"
    });
    const { customer } = seedCustomerGraph(otherCompany.id);

    const response = await request(app.server)
      .get(`/api/v1/customers/${customer.id}`)
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("NOT_FOUND");
  });

  it("GET and POST /customers/:id/properties list and create properties", async () => {
    const auth = createAuthContext();
    const { customer } = seedCustomerGraph(auth.company.id);

    const listResponse = await request(app.server)
      .get(`/api/v1/customers/${customer.id}/properties`)
      .set("Authorization", auth.authorization);
    const createResponse = await request(app.server)
      .post(`/api/v1/customers/${customer.id}/properties`)
      .set("Authorization", auth.authorization)
      .send({
        addressLine1: "202 Second St",
        city: "Tulsa",
        state: "OK",
        zip: "74104",
        isPrimary: false
      });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.properties).toHaveLength(1);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.property.addressLine1).toBe("202 Second St");
  });

  it("GET, PATCH, and DELETE /customers/:id/properties/:propertyId work end-to-end", async () => {
    const auth = createAuthContext();
    const { customer, property } = seedCustomerGraph(auth.company.id);

    const getResponse = await request(app.server)
      .get(`/api/v1/customers/${customer.id}/properties/${property.id}`)
      .set("Authorization", auth.authorization);
    const patchResponse = await request(app.server)
      .patch(`/api/v1/customers/${customer.id}/properties/${property.id}`)
      .set("Authorization", auth.authorization)
      .send({
        notes: "Leave key under mat"
      });
    const deleteResponse = await request(app.server)
      .delete(`/api/v1/customers/${customer.id}/properties/${property.id}`)
      .set("Authorization", auth.authorization);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.property.assets).toHaveLength(1);
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.property.notes).toBe("Leave key under mat");
    expect(deleteResponse.status).toBe(204);
  });

  it("POST /customers/:id/properties/:propertyId/assets creates an asset", async () => {
    const auth = createAuthContext();
    const { customer, property } = seedCustomerGraph(auth.company.id);

    const response = await request(app.server)
      .post(`/api/v1/customers/${customer.id}/properties/${property.id}/assets`)
      .set("Authorization", auth.authorization)
      .send({
        name: "Water Heater",
        assetType: "water_heater"
      });

    expect(response.status).toBe(201);
    expect(response.body.asset.assetType).toBe("water_heater");
  });

  it("GET, PATCH, and DELETE /customers/:id/properties/:propertyId/assets/:assetId work end-to-end", async () => {
    const auth = createAuthContext();
    const { customer, property, asset } = seedCustomerGraph(auth.company.id);
    fakeDb.seedJob({
      companyId: auth.company.id,
      customerId: customer.id,
      propertyId: property.id,
      assetId: asset.id
    });

    const getResponse = await request(app.server)
      .get(`/api/v1/customers/${customer.id}/properties/${property.id}/assets/${asset.id}`)
      .set("Authorization", auth.authorization);
    const patchResponse = await request(app.server)
      .patch(`/api/v1/customers/${customer.id}/properties/${property.id}/assets/${asset.id}`)
      .set("Authorization", auth.authorization)
      .send({
        lastServiceDate: "2026-04-10"
      });
    const deleteResponse = await request(app.server)
      .delete(`/api/v1/customers/${customer.id}/properties/${property.id}/assets/${asset.id}`)
      .set("Authorization", auth.authorization);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.asset.jobCount).toBe(1);
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.asset.lastServiceDate).toBe("2026-04-10");
    expect(deleteResponse.status).toBe(204);
  });
});
