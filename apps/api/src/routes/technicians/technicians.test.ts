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

function createAuthContext(role: "admin" | "technician" = "admin") {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}@example.com`,
    firstName: role === "admin" ? "Ava" : "Taylor",
    lastName: "User",
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

function seedTechnician(companyId: string) {
  return fakeDb.seedTechnician({
    companyId,
    firstName: "Casey",
    lastName: "Crew",
    email: "casey@example.com",
    phone: "555-0100",
    skills: ["hvac"],
    serviceAreaIds: ["11111111-1111-1111-1111-111111111111"],
    totalJobsCompleted: 9,
    avgJobDurationMinutes: 90,
    estimateCloseRate: "0.4200",
    avgTicketValue: "215.00"
  });
}

describe("technician routes", () => {
  it("GET /technicians returns 200 with data and 401 without a token", async () => {
    const auth = createAuthContext("admin");
    seedTechnician(auth.company.id);

    const successResponse = await request(app.server)
      .get("/api/v1/technicians")
      .set("Authorization", auth.authorization);
    const unauthorizedResponse = await request(app.server).get("/api/v1/technicians");

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.data).toHaveLength(1);
    expect(unauthorizedResponse.status).toBe(401);
  });

  it("POST /technicians enforces auth, validation, and owner/admin role", async () => {
    const adminAuth = createAuthContext("admin");
    const technicianAuth = createAuthContext("technician");
    const requestBody = {
      firstName: "Jordan",
      lastName: "Miles",
      phone: "555-0101",
      skills: ["hvac"]
    };

    const successResponse = await request(app.server)
      .post("/api/v1/technicians")
      .set("Authorization", adminAuth.authorization)
      .send(requestBody);
    const forbiddenResponse = await request(app.server)
      .post("/api/v1/technicians")
      .set("Authorization", technicianAuth.authorization)
      .send(requestBody);
    const validationResponse = await request(app.server)
      .post("/api/v1/technicians")
      .set("Authorization", adminAuth.authorization)
      .send({
        firstName: "",
        lastName: "Miles",
        phone: "555-0101"
      });
    const unauthorizedResponse = await request(app.server)
      .post("/api/v1/technicians")
      .send(requestBody);

    expect(successResponse.status).toBe(201);
    expect(successResponse.body.technician.firstName).toBe("Jordan");
    expect(forbiddenResponse.status).toBe(403);
    expect(validationResponse.status).toBe(400);
    expect(unauthorizedResponse.status).toBe(401);
  });

  it("GET /technicians/:id returns 200 on success, 404 for unknown ids, and 401 without a token", async () => {
    const auth = createAuthContext("admin");
    const technician = seedTechnician(auth.company.id);

    const successResponse = await request(app.server)
      .get(`/api/v1/technicians/${technician.id}`)
      .set("Authorization", auth.authorization);
    const notFoundResponse = await request(app.server)
      .get("/api/v1/technicians/11111111-1111-4111-8111-111111111111")
      .set("Authorization", auth.authorization);
    const unauthorizedResponse = await request(app.server).get(`/api/v1/technicians/${technician.id}`);

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.technician.id).toBe(technician.id);
    expect(notFoundResponse.status).toBe(404);
    expect(unauthorizedResponse.status).toBe(401);
  });

  it("PATCH /technicians/:id updates as admin and returns 403 for technician users", async () => {
    const adminAuth = createAuthContext("admin");
    const technicianAuth = createAuthContext("technician");
    const technician = seedTechnician(adminAuth.company.id);

    const successResponse = await request(app.server)
      .patch(`/api/v1/technicians/${technician.id}`)
      .set("Authorization", adminAuth.authorization)
      .send({
        notes: "Prefers tune-up work"
      });
    const forbiddenResponse = await request(app.server)
      .patch(`/api/v1/technicians/${technician.id}`)
      .set("Authorization", technicianAuth.authorization)
      .send({
        notes: "Blocked"
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.technician.notes).toBe("Prefers tune-up work");
    expect(forbiddenResponse.status).toBe(403);
  });

  it("DELETE /technicians/:id succeeds as admin and returns 403 for technician users", async () => {
    const adminAuth = createAuthContext("admin");
    const technicianAuth = createAuthContext("technician");
    const technician = seedTechnician(adminAuth.company.id);

    const successResponse = await request(app.server)
      .delete(`/api/v1/technicians/${technician.id}`)
      .set("Authorization", adminAuth.authorization);
    const forbiddenResponse = await request(app.server)
      .delete(`/api/v1/technicians/${technician.id}`)
      .set("Authorization", technicianAuth.authorization);

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.success).toBe(true);
    expect(forbiddenResponse.status).toBe(403);
  });

  it("GET /technicians/:id/availability returns grouped days and validates max range", async () => {
    const auth = createAuthContext("admin");
    const technician = seedTechnician(auth.company.id);

    fakeDb.seedScheduleSlot({
      companyId: auth.company.id,
      technicianId: technician.id,
      startTime: new Date("2026-04-10T14:00:00.000Z"),
      endTime: new Date("2026-04-10T15:30:00.000Z"),
      isConfirmed: true
    });

    const successResponse = await request(app.server)
      .get(`/api/v1/technicians/${technician.id}/availability?startDate=2026-04-10&endDate=2026-04-11`)
      .set("Authorization", auth.authorization);
    const validationResponse = await request(app.server)
      .get(`/api/v1/technicians/${technician.id}/availability?startDate=2026-04-01&endDate=2026-05-10`)
      .set("Authorization", auth.authorization);

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.availability.days).toHaveLength(2);
    expect(successResponse.body.availability.days[1].slots).toHaveLength(0);
    expect(validationResponse.status).toBe(400);
  });

  it("GET /technicians/:id/performance returns 200 for admins and 403 for technician users", async () => {
    const adminAuth = createAuthContext("admin");
    const technicianAuth = createAuthContext("technician");
    const technician = seedTechnician(adminAuth.company.id);
    const customer = fakeDb.seedCustomer({
      companyId: adminAuth.company.id,
      firstName: "Chris",
      lastName: "Pine"
    });

    fakeDb.seedJob({
      companyId: adminAuth.company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "completed",
      invoiceTotal: "250.00",
      actualEnd: new Date()
    });

    const successResponse = await request(app.server)
      .get(`/api/v1/technicians/${technician.id}/performance`)
      .set("Authorization", adminAuth.authorization);
    const forbiddenResponse = await request(app.server)
      .get(`/api/v1/technicians/${technician.id}/performance`)
      .set("Authorization", technicianAuth.authorization);

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.performance.last30Days.revenue).toBe("250.00");
    expect(forbiddenResponse.status).toBe(403);
  });

  it("POST /technicians/:id/link-user succeeds, returns 409 for linked users, and 403 for technician actors", async () => {
    const adminAuth = createAuthContext("admin");
    const technicianAuth = createAuthContext("technician");
    const technician = seedTechnician(adminAuth.company.id);
    const linkableUser = fakeDb.seedUser({
      companyId: adminAuth.company.id,
      email: "linkable@example.com",
      firstName: "Link",
      lastName: "Able",
      role: "technician"
    });

    const successResponse = await request(app.server)
      .post(`/api/v1/technicians/${technician.id}/link-user`)
      .set("Authorization", adminAuth.authorization)
      .send({
        userId: linkableUser.id
      });

    const otherTechnician = fakeDb.seedTechnician({
      companyId: adminAuth.company.id,
      firstName: "Other",
      lastName: "Tech",
      phone: "555-0199"
    });
    const alreadyLinkedUser = fakeDb.seedUser({
      companyId: adminAuth.company.id,
      email: "linked@example.com",
      firstName: "Already",
      lastName: "Linked",
      role: "technician",
      technicianId: otherTechnician.id
    });

    const conflictResponse = await request(app.server)
      .post(`/api/v1/technicians/${technician.id}/link-user`)
      .set("Authorization", adminAuth.authorization)
      .send({
        userId: alreadyLinkedUser.id
      });
    const forbiddenResponse = await request(app.server)
      .post(`/api/v1/technicians/${technician.id}/link-user`)
      .set("Authorization", technicianAuth.authorization)
      .send({
        userId: linkableUser.id
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.technician.userId).toBe(linkableUser.id);
    expect(conflictResponse.status).toBe(409);
    expect(forbiddenResponse.status).toBe(403);
  });
});
