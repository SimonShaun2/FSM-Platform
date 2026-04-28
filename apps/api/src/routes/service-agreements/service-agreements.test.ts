import { randomUUID } from "node:crypto";

import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

const {
  addAiQueueJob,
  addInvoiceQueueJob,
  addNotificationQueueJob,
  archiveStripePriceMock,
  cancelServiceAgreementSubscriptionMock,
  createServiceAgreementPriceMock,
  createServiceAgreementSubscriptionMock,
  createStripeCustomerMock,
  updateServiceAgreementSubscriptionCancelAtPeriodEndMock
} = vi.hoisted(() => ({
  addAiQueueJob: vi.fn(),
  addInvoiceQueueJob: vi.fn(),
  addNotificationQueueJob: vi.fn(),
  archiveStripePriceMock: vi.fn(),
  cancelServiceAgreementSubscriptionMock: vi.fn(),
  createServiceAgreementPriceMock: vi.fn(),
  createServiceAgreementSubscriptionMock: vi.fn(),
  createStripeCustomerMock: vi.fn(),
  updateServiceAgreementSubscriptionCancelAtPeriodEndMock: vi.fn()
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
    add: addAiQueueJob
  },
  invoicesQueue: {
    add: addInvoiceQueueJob
  },
  notificationsQueue: {
    add: addNotificationQueueJob
  }
}));

vi.mock("../../lib/stripe.js", async () => {
  const actual = await vi.importActual<typeof import("../../lib/stripe.js")>("../../lib/stripe.js");
  return {
    ...actual,
    archiveStripePrice: archiveStripePriceMock,
    cancelServiceAgreementSubscription: cancelServiceAgreementSubscriptionMock,
    createServiceAgreementPrice: createServiceAgreementPriceMock,
    createServiceAgreementSubscription: createServiceAgreementSubscriptionMock,
    createStripeCustomer: createStripeCustomerMock,
    updateServiceAgreementSubscriptionCancelAtPeriodEnd: updateServiceAgreementSubscriptionCancelAtPeriodEndMock
  };
});

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let app: AppInstance;
let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;

beforeAll(async () => {
  buildAppModule = await import("../../app.js");
  fakeDb = await import("../../test-support/fake-db.js");
  tokens = await import("../../lib/tokens.js");
}, 20000);

beforeEach(async () => {
  fakeDb.resetTestState();
  addAiQueueJob.mockReset();
  addInvoiceQueueJob.mockReset();
  addNotificationQueueJob.mockReset();
  archiveStripePriceMock.mockReset();
  cancelServiceAgreementSubscriptionMock.mockReset();
  createServiceAgreementPriceMock.mockReset();
  createServiceAgreementSubscriptionMock.mockReset();
  createStripeCustomerMock.mockReset();
  updateServiceAgreementSubscriptionCancelAtPeriodEndMock.mockReset();

  createServiceAgreementPriceMock.mockResolvedValue({ id: "price_template_123" });
  createStripeCustomerMock.mockResolvedValue({ id: "cus_123" });
  createServiceAgreementSubscriptionMock.mockResolvedValue({
    id: "sub_123",
    currentPeriodStart: new Date("2026-04-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
    cancelAtPeriodEnd: false
  });
  updateServiceAgreementSubscriptionCancelAtPeriodEndMock.mockResolvedValue({
    id: "sub_123",
    currentPeriodStart: new Date("2026-04-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
    cancelAtPeriodEnd: true
  });
  cancelServiceAgreementSubscriptionMock.mockResolvedValue({
    id: "sub_123",
    currentPeriodStart: new Date("2026-04-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-04-28T00:00:00.000Z"),
    cancelAtPeriodEnd: false
  });

  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function createAuthContext(role: "owner" | "admin" | "technician" = "owner") {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: `acme-${role}`,
    stripeAccountId: "acct_123",
    timezone: "America/Chicago"
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

function seedAgreementGraph(companyId: string) {
  const customer = fakeDb.seedCustomer({
    companyId,
    firstName: "Chris",
    lastName: "Pine",
    email: "chris@example.com"
  });
  const property = fakeDb.seedProperty({
    companyId,
    customerId: customer.id,
    addressLine1: "101 Main St",
    city: "Tulsa",
    state: "OK",
    zip: "74103"
  });
  const asset = fakeDb.seedAsset({
    companyId,
    customerId: customer.id,
    propertyId: property.id,
    name: "Main HVAC",
    assetType: "hvac"
  });
  const template = fakeDb.seedServiceAgreementTemplate({
    companyId,
    name: "Gold Plan",
    visitsPerYear: 2,
    frequency: "bi_annual",
    monthlyPrice: "29.99",
    annualPrice: "299.00",
    stripeMthlyPriceId: "price_monthly_123",
    stripeAnnualPriceId: "price_annual_123"
  });

  return { customer, property, asset, template };
}

describe("service agreement routes", () => {
  it("GET /service-agreements/templates returns 200 with auth and 401 without auth", async () => {
    const auth = createAuthContext("owner");
    fakeDb.seedServiceAgreementTemplate({
      companyId: auth.company.id,
      name: "Silver Plan",
      visitsPerYear: 2,
      frequency: "bi_annual"
    });

    const successResponse = await request(app.server)
      .get("/api/v1/service-agreements/templates")
      .set("Authorization", auth.authorization);
    const unauthorizedResponse = await request(app.server)
      .get("/api/v1/service-agreements/templates");

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.templates).toHaveLength(1);
    expect(successResponse.body.templates[0].name).toBe("Silver Plan");
    expect(unauthorizedResponse.status).toBe(401);
  });

  it("POST /service-agreements/templates allows admin and forbids technician", async () => {
    const admin = createAuthContext("admin");
    const technician = createAuthContext("technician");

    const successResponse = await request(app.server)
      .post("/api/v1/service-agreements/templates")
      .set("Authorization", admin.authorization)
      .send({
        name: "Gold Plan",
        visitsPerYear: 2,
        frequency: "bi_annual",
        monthlyPrice: "29.99"
      });
    const forbiddenResponse = await request(app.server)
      .post("/api/v1/service-agreements/templates")
      .set("Authorization", technician.authorization)
      .send({
        name: "Gold Plan",
        visitsPerYear: 2,
        frequency: "bi_annual"
      });

    expect(successResponse.status).toBe(201);
    expect(successResponse.body.template.monthlyPrice).toBe("29.99");
    expect(forbiddenResponse.status).toBe(403);
  });

  it("PATCH /service-agreements/templates/:id supports success and validation failure", async () => {
    const auth = createAuthContext("owner");
    const template = fakeDb.seedServiceAgreementTemplate({
      companyId: auth.company.id,
      name: "Starter Plan",
      visitsPerYear: 2,
      frequency: "bi_annual"
    });

    const successResponse = await request(app.server)
      .patch(`/api/v1/service-agreements/templates/${template.id}`)
      .set("Authorization", auth.authorization)
      .send({
        name: "Updated Plan",
        sortOrder: 3
      });
    const validationResponse = await request(app.server)
      .patch(`/api/v1/service-agreements/templates/${template.id}`)
      .set("Authorization", auth.authorization)
      .send({
        name: ""
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.template.name).toBe("Updated Plan");
    expect(successResponse.body.template.sortOrder).toBe(3);
    expect(validationResponse.status).toBe(400);
  });

  it("DELETE /service-agreements/templates/:id supports success and 409 when active plans exist", async () => {
    const auth = createAuthContext("owner");
    const deletableTemplate = fakeDb.seedServiceAgreementTemplate({
      companyId: auth.company.id,
      name: "Retired Plan",
      visitsPerYear: 2,
      frequency: "bi_annual"
    });
    const { customer, template } = seedAgreementGraph(auth.company.id);
    fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      serviceAgreementTemplateId: template.id,
      name: "Protected Plan",
      frequency: "quarterly",
      status: "active"
    });

    const successResponse = await request(app.server)
      .delete(`/api/v1/service-agreements/templates/${deletableTemplate.id}`)
      .set("Authorization", auth.authorization);
    const conflictResponse = await request(app.server)
      .delete(`/api/v1/service-agreements/templates/${template.id}`)
      .set("Authorization", auth.authorization);

    expect(successResponse.status).toBe(204);
    expect(conflictResponse.status).toBe(409);
  });

  it("POST /service-agreements supports success, validation failure, and unknown customers", async () => {
    const auth = createAuthContext("owner");
    const { customer, property, asset, template } = seedAgreementGraph(auth.company.id);

    const successResponse = await request(app.server)
      .post("/api/v1/service-agreements")
      .set("Authorization", auth.authorization)
      .send({
        customerId: customer.id,
        serviceAgreementTemplateId: template.id,
        propertyId: property.id,
        name: "Customer Plan",
        frequency: "quarterly",
        startDate: "2026-04-28",
        assetIds: [asset.id]
      });
    const validationResponse = await request(app.server)
      .post("/api/v1/service-agreements")
      .set("Authorization", auth.authorization)
      .send({
        customerId: customer.id,
        name: "",
        frequency: "quarterly",
        startDate: "2026-04-28"
      });
    const missingCustomerResponse = await request(app.server)
      .post("/api/v1/service-agreements")
      .set("Authorization", auth.authorization)
      .send({
        customerId: randomUUID(),
        name: "Missing Customer",
        frequency: "quarterly",
        startDate: "2026-04-28"
      });

    expect(successResponse.status).toBe(201);
    expect(successResponse.body.agreement.name).toBe("Customer Plan");
    expect(successResponse.body.agreement.nextServiceDate).toBe("2026-07-28");
    expect(validationResponse.status).toBe(400);
    expect(missingCustomerResponse.status).toBe(404);
  });

  it("GET /service-agreements/:id returns detail and 404 for unknown agreements", async () => {
    const auth = createAuthContext("owner");
    const { customer, property, asset, template } = seedAgreementGraph(auth.company.id);
    const agreement = fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      propertyId: property.id,
      serviceAgreementTemplateId: template.id,
      name: "Detail Plan",
      frequency: "quarterly",
      assetIds: [asset.id]
    });
    fakeDb.seedMaintenanceVisit({
      companyId: auth.company.id,
      maintenancePlanId: agreement.id,
      completedDate: "2026-04-01",
      notes: "Visit complete"
    });

    const successResponse = await request(app.server)
      .get(`/api/v1/service-agreements/${agreement.id}`)
      .set("Authorization", auth.authorization);
    const missingResponse = await request(app.server)
      .get(`/api/v1/service-agreements/${randomUUID()}`)
      .set("Authorization", auth.authorization);

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.agreement.customer.email).toBe("chris@example.com");
    expect(successResponse.body.agreement.assets).toHaveLength(1);
    expect(successResponse.body.agreement.recentVisits).toHaveLength(1);
    expect(missingResponse.status).toBe(404);
  });

  it("GET /service-agreements returns a paginated list and filters by status", async () => {
    const auth = createAuthContext("owner");
    const { customer } = seedAgreementGraph(auth.company.id);
    fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      name: "Active Plan",
      frequency: "quarterly",
      status: "active",
      nextServiceDate: "2026-06-01",
      createdAt: new Date("2026-04-20T00:00:00.000Z")
    });
    fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      name: "Paused Plan",
      frequency: "annual",
      status: "paused",
      nextServiceDate: "2026-07-01",
      createdAt: new Date("2026-04-21T00:00:00.000Z")
    });

    const response = await request(app.server)
      .get("/api/v1/service-agreements?status=active&page=1&limit=1")
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Active Plan");
  });

  it("PATCH /service-agreements/:id supports success and 404 for unknown agreements", async () => {
    const auth = createAuthContext("owner");
    const { customer, property, asset } = seedAgreementGraph(auth.company.id);
    const replacementAsset = fakeDb.seedAsset({
      companyId: auth.company.id,
      customerId: customer.id,
      propertyId: property.id,
      name: "Replacement HVAC",
      assetType: "hvac"
    });
    const agreement = fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      propertyId: property.id,
      name: "Editable Plan",
      frequency: "quarterly",
      status: "active",
      assetIds: [asset.id]
    });

    const successResponse = await request(app.server)
      .patch(`/api/v1/service-agreements/${agreement.id}`)
      .set("Authorization", auth.authorization)
      .send({
        name: "Updated Plan",
        assetIds: [replacementAsset.id]
      });
    const missingResponse = await request(app.server)
      .patch(`/api/v1/service-agreements/${randomUUID()}`)
      .set("Authorization", auth.authorization)
      .send({
        name: "Missing Plan"
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.agreement.name).toBe("Updated Plan");
    expect(successResponse.body.agreement.assets).toHaveLength(1);
    expect(successResponse.body.agreement.assets[0].id).toBe(replacementAsset.id);
    expect(missingResponse.status).toBe(404);
  });

  it("POST /service-agreements/:id/cancel succeeds and returns 409 for already cancelled plans", async () => {
    const auth = createAuthContext("owner");
    const { customer } = seedAgreementGraph(auth.company.id);
    const activeAgreement = fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      name: "Active Plan",
      frequency: "quarterly",
      status: "active"
    });
    const cancelledAgreement = fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      name: "Cancelled Plan",
      frequency: "quarterly",
      status: "cancelled"
    });

    const successResponse = await request(app.server)
      .post(`/api/v1/service-agreements/${activeAgreement.id}/cancel`)
      .set("Authorization", auth.authorization)
      .send({
        cancelImmediately: true,
        reason: "Requested"
      });
    const conflictResponse = await request(app.server)
      .post(`/api/v1/service-agreements/${cancelledAgreement.id}/cancel`)
      .set("Authorization", auth.authorization)
      .send({
        cancelImmediately: true
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.agreement.status).toBe("cancelled");
    expect(conflictResponse.status).toBe(409);
  });

  it("POST /service-agreements/:id/visits records a visit and updates dates", async () => {
    const auth = createAuthContext("owner");
    const { customer, property, asset } = seedAgreementGraph(auth.company.id);
    const agreement = fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      propertyId: property.id,
      name: "Visit Plan",
      frequency: "quarterly",
      status: "active",
      assetIds: [asset.id]
    });
    const job = fakeDb.seedJob({
      companyId: auth.company.id,
      customerId: customer.id,
      propertyId: property.id,
      assetId: asset.id,
      title: "Visit Job"
    });

    const response = await request(app.server)
      .post(`/api/v1/service-agreements/${agreement.id}/visits`)
      .set("Authorization", auth.authorization)
      .send({
        completedDate: "2026-04-28",
        jobId: job.id,
        notes: "Completed"
      });

    expect(response.status).toBe(201);
    expect(response.body.visit.completedDate).toBe("2026-04-28");
    expect(fakeDb.getTestState().maintenancePlans.find((row) => row.id === agreement.id)?.lastServiceDate).toBe("2026-04-28");
    expect(fakeDb.getTestState().maintenancePlans.find((row) => row.id === agreement.id)?.nextServiceDate).toBe("2026-07-28");
    expect(fakeDb.getTestState().assets.find((row) => row.id === asset.id)?.lastServiceDate).toBe("2026-04-28");
    expect(fakeDb.getTestState().assets.find((row) => row.id === asset.id)?.nextServiceDate).toBe("2026-07-28");
  });

  it("GET /service-agreements/:id/visits returns visit history", async () => {
    const auth = createAuthContext("owner");
    const { customer } = seedAgreementGraph(auth.company.id);
    const agreement = fakeDb.seedMaintenancePlan({
      companyId: auth.company.id,
      customerId: customer.id,
      name: "History Plan",
      frequency: "quarterly",
      status: "active"
    });
    fakeDb.seedMaintenanceVisit({
      companyId: auth.company.id,
      maintenancePlanId: agreement.id,
      completedDate: "2026-04-01",
      notes: "First visit"
    });
    fakeDb.seedMaintenanceVisit({
      companyId: auth.company.id,
      maintenancePlanId: agreement.id,
      completedDate: "2026-04-15",
      notes: "Second visit"
    });

    const response = await request(app.server)
      .get(`/api/v1/service-agreements/${agreement.id}/visits`)
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.visits).toHaveLength(2);
    expect(response.body.visits[0].completedDate).toBe("2026-04-15");
    expect(response.body.visits[1].completedDate).toBe("2026-04-01");
  });
});
