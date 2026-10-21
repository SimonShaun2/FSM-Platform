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
  aiQueue: { add: vi.fn() },
  invoicesQueue: { add: vi.fn() },
  notificationsQueue: { add: vi.fn() }
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

function createInternalStaffContext(role: "owner" | "admin" | "dispatcher" | "office" = "admin") {
  const company = fakeDb.seedCompany({
    id: fakeDb.RENAVANI_INTERNAL_TEST_COMPANY_ID,
    name: "Renvani Internal",
    slug: "renvani-internal",
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}@renvani.test`,
    firstName: "Riley",
    lastName: "Ops",
    role
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return { company, user, authorization: `Bearer ${accessToken}` };
}

function createExternalTenantContext() {
  const company = fakeDb.seedCompany({
    name: "Customer HVAC",
    slug: "customer-hvac",
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@customer.test",
    firstName: "Casey",
    lastName: "Owner",
    role: "owner"
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return { company, user, authorization: `Bearer ${accessToken}` };
}

describe("growth check routes (FS-53)", () => {
  it("rejects non-internal tenants", async () => {
    const external = createExternalTenantContext();

    const response = await request(app.server)
      .get("/api/v1/growth/checks")
      .set("Authorization", external.authorization);

    expect(response.status).toBe(403);
  });

  it("supports CRUD for checks, identity candidates, and findings with audit history", async () => {
    const staff = createInternalStaffContext("dispatcher");

    const createResponse = await request(app.server)
      .post("/api/v1/growth/checks")
      .set("Authorization", staff.authorization)
      .send({
        businessName: "Summit Plumbing",
        websiteUrl: "https://summit-plumbing.example",
        industry: "Home Services",
        trade: "Plumbing",
        city: "Austin",
        state: "TX",
        contactEmail: "ops@summit.example",
        targetMarket: "Residential service area"
      });

    expect(createResponse.status).toBe(201);
    const checkId = createResponse.body.check.id as string;
    expect(createResponse.body.check.ownerUserId).toBe(staff.user.id);
    expect(createResponse.body.check.status).toBe("queued");

    const queueResponse = await request(app.server)
      .get("/api/v1/growth/checks")
      .set("Authorization", staff.authorization);

    expect(queueResponse.status).toBe(200);
    expect(queueResponse.body.checks).toHaveLength(1);
    expect(queueResponse.body.checks[0]).toMatchObject({
      id: checkId,
      businessName: "Summit Plumbing",
      reviewNeeded: false,
      lastScanAt: null
    });

    const patchResponse = await request(app.server)
      .patch(`/api/v1/growth/checks/${checkId}`)
      .set("Authorization", staff.authorization)
      .send({
        reviewNeeded: true,
        status: "review_needed"
      });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.check.reviewNeeded).toBe(true);
    expect(patchResponse.body.check.status).toBe("review_needed");

    const candidateResponse = await request(app.server)
      .post(`/api/v1/growth/checks/${checkId}/identity-candidates`)
      .set("Authorization", staff.authorization)
      .send({
        displayName: "Summit Plumbing LLC",
        domain: "summit-plumbing.example",
        source: "website",
        confidenceScore: 0.92,
        isPrimary: true
      });

    expect(candidateResponse.status).toBe(201);
    const candidateId = candidateResponse.body.identityCandidate.id as string;

    const findingResponse = await request(app.server)
      .post(`/api/v1/growth/checks/${checkId}/findings`)
      .set("Authorization", staff.authorization)
      .send({
        category: "seo",
        severity: "medium",
        title: "Missing local landing page",
        description: "No city-specific service pages detected."
      });

    expect(findingResponse.status).toBe(201);
    const findingId = findingResponse.body.finding.id as string;

    const detailResponse = await request(app.server)
      .get(`/api/v1/growth/checks/${checkId}`)
      .set("Authorization", staff.authorization);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.identityCandidates).toHaveLength(1);
    expect(detailResponse.body.findings).toHaveLength(1);

    const auditResponse = await request(app.server)
      .get(`/api/v1/growth/checks/${checkId}/audit-events`)
      .set("Authorization", staff.authorization);

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.events.length).toBeGreaterThanOrEqual(4);
    const actions = auditResponse.body.events.map((event: { action: string }) => event.action);
    expect(actions).toContain("created");
    expect(actions).toContain("updated");

    const deleteFindingResponse = await request(app.server)
      .delete(`/api/v1/growth/checks/${checkId}/findings/${findingId}`)
      .set("Authorization", staff.authorization);

    expect(deleteFindingResponse.status).toBe(200);

    const deleteCandidateResponse = await request(app.server)
      .delete(`/api/v1/growth/checks/${checkId}/identity-candidates/${candidateId}`)
      .set("Authorization", staff.authorization);

    expect(deleteCandidateResponse.status).toBe(200);

    const deleteCheckResponse = await request(app.server)
      .delete(`/api/v1/growth/checks/${checkId}`)
      .set("Authorization", staff.authorization);

    expect(deleteCheckResponse.status).toBe(200);
    expect(deleteCheckResponse.body.check.deletedAt).not.toBeNull();

    const auditAfterDelete = await request(app.server)
      .get(`/api/v1/growth/checks/${checkId}/audit-events`)
      .set("Authorization", staff.authorization);

    expect(auditAfterDelete.body.events.some((event: { action: string }) => event.action === "deleted")).toBe(
      true
    );
  });

  it("returns 404 when accessing a check outside the tenant company", async () => {
    const staff = createInternalStaffContext();
    const otherCompany = fakeDb.seedCompany({
      name: "Other Internal",
      slug: "other-internal",
      timezone: "America/Chicago"
    });
    const otherUser = fakeDb.seedUser({
      companyId: otherCompany.id,
      email: "other@renvani.test",
      firstName: "Other",
      lastName: "User",
      role: "admin"
    });

    const foreignCheck = fakeDb.seedGrowthCheck({
      companyId: otherCompany.id,
      ownerUserId: otherUser.id,
      createdById: otherUser.id,
      businessName: "Foreign Co"
    });

    const response = await request(app.server)
      .get(`/api/v1/growth/checks/${foreignCheck.id}`)
      .set("Authorization", staff.authorization);

    expect(response.status).toBe(404);
  });
});
