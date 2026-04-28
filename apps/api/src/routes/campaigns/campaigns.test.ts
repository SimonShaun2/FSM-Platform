import { randomUUID } from "node:crypto";

import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

const {
  addQueueJob,
  generateCampaignMessageMock,
  redisDelMock,
  redisGetMock,
  redisSetMock,
  resetRedisStore
} = vi.hoisted(() => {
  const store = new Map<string, string>();

  return {
    addQueueJob: vi.fn(),
    generateCampaignMessageMock: vi.fn(),
    redisDelMock: vi.fn(async (key: string) => {
      const deleted = store.delete(key);
      return deleted ? 1 : 0;
    }),
    redisGetMock: vi.fn(async (key: string) => store.get(key) ?? null),
    redisSetMock: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return "OK";
    }),
    resetRedisStore: () => {
      store.clear();
    }
  };
});

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/ai", () => ({
  generateCampaignMessage: generateCampaignMessageMock
}));

vi.mock("@fsm/jobs", () => ({
  aiQueue: {
    add: vi.fn()
  },
  agreementsQueue: {
    add: vi.fn()
  },
  importsQueue: {
    add: vi.fn()
  },
  invoicesQueue: {
    add: vi.fn()
  },
  notificationsQueue: {
    add: addQueueJob
  },
  redisConnection: {
    get: redisGetMock,
    set: redisSetMock,
    del: redisDelMock
  },
  webhooksQueue: {
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
  addQueueJob.mockReset();
  generateCampaignMessageMock.mockReset();
  redisDelMock.mockClear();
  redisGetMock.mockClear();
  redisSetMock.mockClear();
  resetRedisStore();
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

function seedCampaignGraph(companyId: string) {
  const customer = fakeDb.seedCustomer({
    companyId,
    firstName: "Chris",
    lastName: "Pine",
    email: "chris@example.com",
    phone: "555-0100"
  });
  const secondCustomer = fakeDb.seedCustomer({
    companyId,
    firstName: "Morgan",
    lastName: "Lane",
    email: "morgan@example.com",
    phone: "555-0101"
  });
  const recommendation = fakeDb.seedAiRecommendation({
    companyId,
    type: "reactivation",
    customerId: customer.id,
    estimatedRevenue: "300.00",
    urgencyScore: 80,
    headline: "Reach back out",
    body: "Dormant customer"
  });
  const secondRecommendation = fakeDb.seedAiRecommendation({
    companyId,
    type: "seasonal_campaign",
    customerId: secondCustomer.id,
    estimatedRevenue: "225.00",
    urgencyScore: 60,
    headline: "Seasonal push",
    body: "Seasonal customer"
  });

  return { customer, secondCustomer, recommendation, secondRecommendation };
}

describe("campaign routes", () => {
  it("POST /campaigns supports success, validation failure, and technician rejection", async () => {
    const owner = createAuthContext("owner");
    const technician = createAuthContext("technician");
    const { recommendation } = seedCampaignGraph(owner.company.id);

    const successResponse = await request(app.server)
      .post("/api/v1/campaigns")
      .set("Authorization", owner.authorization)
      .send({
        name: "Dormant win-back",
        type: "reactivation",
        channel: "sms",
        recommendationIds: [recommendation.id]
      });

    const validationResponse = await request(app.server)
      .post("/api/v1/campaigns")
      .set("Authorization", owner.authorization)
      .send({
        name: "",
        type: "reactivation",
        channel: "sms",
        recommendationIds: []
      });

    const forbiddenResponse = await request(app.server)
      .post("/api/v1/campaigns")
      .set("Authorization", technician.authorization)
      .send({
        name: "Dormant win-back",
        type: "reactivation",
        channel: "sms",
        recommendationIds: [recommendation.id]
      });

    expect(successResponse.status).toBe(201);
    expect(successResponse.body.campaign.name).toBe("Dormant win-back");
    expect(validationResponse.status).toBe(400);
    expect(forbiddenResponse.status).toBe(403);
  });

  it("GET /campaigns returns a paginated campaign list", async () => {
    const auth = createAuthContext("owner");
    fakeDb.seedCampaign({
      companyId: auth.company.id,
      type: "reactivation",
      name: "Dormant win-back",
      status: "sent",
      recipientCount: 2,
      deliveredCount: 1,
      convertedCount: 1,
      revenueAttributed: "250.00"
    });

    const response = await request(app.server)
      .get("/api/v1/campaigns?page=1&limit=10")
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0]).toMatchObject({
      name: "Dormant win-back",
      status: "sent"
    });
  });

  it("GET /campaigns/:id returns campaign detail", async () => {
    const auth = createAuthContext("owner");
    const { customer } = seedCampaignGraph(auth.company.id);
    const campaign = fakeDb.seedCampaign({
      companyId: auth.company.id,
      type: "custom",
      name: "Manual campaign",
      body: "Hello there"
    });
    fakeDb.seedCampaignRecipient({
      companyId: auth.company.id,
      campaignId: campaign.id,
      customerId: customer.id
    });

    const response = await request(app.server)
      .get(`/api/v1/campaigns/${campaign.id}`)
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.campaign.id).toBe(campaign.id);
    expect(response.body.campaign.recipients).toHaveLength(1);
  });

  it("POST /campaigns/:id/generate-draft populates the campaign body", async () => {
    const auth = createAuthContext("owner");
    const { customer, recommendation } = seedCampaignGraph(auth.company.id);
    const campaign = fakeDb.seedCampaign({
      companyId: auth.company.id,
      createdById: auth.user.id,
      type: "reactivation",
      name: "Dormant win-back",
      aiRecommendationId: recommendation.id,
      body: ""
    });
    fakeDb.seedCampaignRecipient({
      companyId: auth.company.id,
      campaignId: campaign.id,
      customerId: customer.id
    });
    generateCampaignMessageMock.mockResolvedValue("Hi Chris, Acme HVAC can help with your next service visit. Reply if you'd like to get scheduled.");

    const response = await request(app.server)
      .post(`/api/v1/campaigns/${campaign.id}/generate-draft`)
      .set("Authorization", auth.authorization)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.campaign.body).toContain("Hi Chris");
  });

  it("PATCH /campaigns/:id updates draft campaigns and returns 409 for sent campaigns", async () => {
    const auth = createAuthContext("owner");
    const draftCampaign = fakeDb.seedCampaign({
      companyId: auth.company.id,
      type: "custom",
      name: "Draft campaign",
      body: "Old body"
    });
    const sentCampaign = fakeDb.seedCampaign({
      companyId: auth.company.id,
      type: "custom",
      name: "Sent campaign",
      status: "sent",
      body: "Already sent"
    });

    const successResponse = await request(app.server)
      .patch(`/api/v1/campaigns/${draftCampaign.id}`)
      .set("Authorization", auth.authorization)
      .send({
        body: "Updated body"
      });

    const conflictResponse = await request(app.server)
      .patch(`/api/v1/campaigns/${sentCampaign.id}`)
      .set("Authorization", auth.authorization)
      .send({
        body: "Cannot update"
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.campaign.body).toBe("Updated body");
    expect(conflictResponse.status).toBe(409);
  });

  it("POST /campaigns/:id/send supports success, missing body conflict, and technician rejection", async () => {
    const owner = createAuthContext("owner");
    const technician = createAuthContext("technician");
    const { customer } = seedCampaignGraph(owner.company.id);
    const readyCampaign = fakeDb.seedCampaign({
      companyId: owner.company.id,
      createdById: owner.user.id,
      type: "reactivation",
      name: "Ready campaign",
      channel: "sms",
      body: "Hi Chris, Acme HVAC can help with your next service visit. Reply if you'd like to get scheduled."
    });
    fakeDb.seedCampaignRecipient({
      companyId: owner.company.id,
      campaignId: readyCampaign.id,
      customerId: customer.id
    });
    const emptyCampaign = fakeDb.seedCampaign({
      companyId: owner.company.id,
      createdById: owner.user.id,
      type: "reactivation",
      name: "Empty campaign",
      channel: "sms",
      body: ""
    });
    fakeDb.seedCampaignRecipient({
      companyId: owner.company.id,
      campaignId: emptyCampaign.id,
      customerId: customer.id
    });

    const successResponse = await request(app.server)
      .post(`/api/v1/campaigns/${readyCampaign.id}/send`)
      .set("Authorization", owner.authorization)
      .send();

    const conflictResponse = await request(app.server)
      .post(`/api/v1/campaigns/${emptyCampaign.id}/send`)
      .set("Authorization", owner.authorization)
      .send();

    const forbiddenResponse = await request(app.server)
      .post(`/api/v1/campaigns/${readyCampaign.id}/send`)
      .set("Authorization", technician.authorization)
      .send();

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.campaign.status).toBe("sent");
    expect(addQueueJob).toHaveBeenCalledTimes(1);
    expect(conflictResponse.status).toBe(409);
    expect(forbiddenResponse.status).toBe(403);
  });

  it("GET /campaigns/:id/recipients returns recipient delivery status", async () => {
    const auth = createAuthContext("owner");
    const { customer } = seedCampaignGraph(auth.company.id);
    const campaign = fakeDb.seedCampaign({
      companyId: auth.company.id,
      type: "custom",
      name: "Recipient status",
      status: "sent",
      body: "Hello there"
    });
    const recipient = fakeDb.seedCampaignRecipient({
      companyId: auth.company.id,
      campaignId: campaign.id,
      customerId: customer.id,
      sentAt: new Date("2026-04-28T10:00:00.000Z"),
      deliveredAt: new Date("2026-04-28T10:00:05.000Z")
    });
    fakeDb.seedMessageLog({
      companyId: auth.company.id,
      customerId: customer.id,
      campaignId: campaign.id,
      channel: "sms",
      direction: "outbound",
      toAddress: customer.phone ?? "555-0100",
      body: "Hello there",
      sentAt: new Date("2026-04-28T10:00:00.000Z"),
      deliveredAt: new Date("2026-04-28T10:00:05.000Z")
    });

    const response = await request(app.server)
      .get(`/api/v1/campaigns/${campaign.id}/recipients?page=1&limit=10`)
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0]).toMatchObject({
      id: recipient.id,
      status: "delivered"
    });
  });

  it("GET /campaigns/:id returns 404 for an unknown campaign id", async () => {
    const auth = createAuthContext("owner");

    const response = await request(app.server)
      .get(`/api/v1/campaigns/${randomUUID()}`)
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(404);
  });
});
