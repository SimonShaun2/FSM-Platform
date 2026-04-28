import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const sendPasswordResetEmailMock = vi.hoisted(() => vi.fn());

process.env.NODE_ENV = "test";
process.env.API_PORT = "3001";
process.env.WEBHOOK_PORT = "3002";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/fsm";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
process.env.STRIPE_PLATFORM_FEE_PERCENT = "3";
process.env.OPENAI_API_KEY = "openai_dummy";
process.env.TWILIO_ACCOUNT_SID = "twilio_sid";
process.env.TWILIO_AUTH_TOKEN = "twilio_token";
process.env.TWILIO_FROM_NUMBER = "+15555555555";
process.env.SENDGRID_API_KEY = "sendgrid_dummy";
process.env.SENDGRID_FROM_EMAIL = "noreply@example.com";
process.env.R2_ACCOUNT_ID = "r2_account";
process.env.R2_ACCESS_KEY_ID = "r2_access";
process.env.R2_SECRET_ACCESS_KEY = "r2_secret";
process.env.R2_BUCKET_NAME = "fsm-bucket";
process.env.APP_URL = "http://localhost:3000";
process.env.JWT_SECRET = "jwt_secret";
process.env.JWT_REFRESH_SECRET = "jwt_refresh_secret";
process.env.ACCESS_TOKEN_TTL_SECONDS = "900";
process.env.REFRESH_TOKEN_TTL_SECONDS = "2592000";
process.env.RESET_TOKEN_TTL_SECONDS = "3600";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";

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

vi.mock("../../lib/email.js", () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;
type ResetTokenInput = Parameters<TokensModule["generateResetToken"]>[0];

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
  sendPasswordResetEmailMock.mockReset();
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

async function registerUser() {
  const response = await request(app.server).post("/api/v1/auth/register").send({
    companyName: "Tulsa HVAC Pro",
    firstName: "Ava",
    lastName: "Stone",
    email: "owner@example.com",
    password: "password123",
    phone: "555-0100"
  });

  expect(response.status).toBe(201);
  return response.body as {
    user: { id: string };
    company: { id: string; name: string; slug: string };
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  };
}

describe("auth and company routes", () => {
  it("POST /auth/register returns 201 on success", async () => {
    const response = await request(app.server).post("/api/v1/auth/register").send({
      companyName: "Tulsa HVAC Pro",
      firstName: "Ava",
      lastName: "Stone",
      email: "owner@example.com",
      password: "password123"
    });

    expect(response.status).toBe(201);
    expect(response.body.company.slug).toBe("tulsa-hvac-pro");
    expect(response.body.tokens.accessToken).toBeTruthy();
  });

  it("POST /auth/register returns 400 on validation failure", async () => {
    const response = await request(app.server).post("/api/v1/auth/register").send({
      companyName: "A",
      firstName: "Ava",
      lastName: "Stone",
      email: "not-an-email",
      password: "short"
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });

  it("POST /auth/register returns 409 for duplicate email", async () => {
    await registerUser();

    const response = await request(app.server).post("/api/v1/auth/register").send({
      companyName: "Another Co",
      firstName: "Ava",
      lastName: "Stone",
      email: "owner@example.com",
      password: "password123"
    });

    expect(response.status).toBe(409);
  });

  it("POST /auth/login returns 200 on success", async () => {
    await registerUser();

    const response = await request(app.server).post("/api/v1/auth/login").send({
      email: "owner@example.com",
      password: "password123"
    });

    expect(response.status).toBe(200);
    expect(response.body.tokens.refreshToken).toBeTruthy();
  });

  it("POST /auth/login returns 401 for wrong credentials", async () => {
    await registerUser();

    const response = await request(app.server).post("/api/v1/auth/login").send({
      email: "owner@example.com",
      password: "wrong-password"
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("UNAUTHORIZED");
  });

  it("POST /auth/refresh succeeds with a valid token", async () => {
    const registerResponse = await registerUser();

    const response = await request(app.server).post("/api/v1/auth/refresh").send({
      refreshToken: registerResponse.tokens.refreshToken
    });

    expect(response.status).toBe(200);
    expect(response.body.tokens.accessToken).toBeTruthy();
  });

  it("POST /auth/refresh returns 401 for expired or revoked tokens", async () => {
    const registerResponse = await registerUser();

    await request(app.server).post("/api/v1/auth/logout").send({
      refreshToken: registerResponse.tokens.refreshToken
    });

    const revokedResponse = await request(app.server).post("/api/v1/auth/refresh").send({
      refreshToken: registerResponse.tokens.refreshToken
    });

    const expiredToken = jwt.sign(
      {
        userId: registerResponse.user.id,
        companyId: registerResponse.company.id,
        tokenType: "refresh"
      },
      process.env.JWT_REFRESH_SECRET ?? "",
      { expiresIn: -1 }
    );

    const expiredResponse = await request(app.server).post("/api/v1/auth/refresh").send({
      refreshToken: expiredToken
    });

    expect(revokedResponse.status).toBe(401);
    expect(expiredResponse.status).toBe(401);
  });

  it("POST /auth/logout returns 204 even if already logged out", async () => {
    const registerResponse = await registerUser();

    const firstResponse = await request(app.server).post("/api/v1/auth/logout").send({
      refreshToken: registerResponse.tokens.refreshToken
    });
    const secondResponse = await request(app.server).post("/api/v1/auth/logout").send({
      refreshToken: registerResponse.tokens.refreshToken
    });

    expect(firstResponse.status).toBe(204);
    expect(secondResponse.status).toBe(204);
  });

  it("POST /auth/forgot-password returns 200 for existing and nonexistent email", async () => {
    await registerUser();
    sendPasswordResetEmailMock.mockRejectedValueOnce(new Error("SendGrid down"));

    const existingResponse = await request(app.server).post("/api/v1/auth/forgot-password").send({
      email: "owner@example.com"
    });
    const missingResponse = await request(app.server).post("/api/v1/auth/forgot-password").send({
      email: "missing@example.com"
    });

    expect(existingResponse.status).toBe(200);
    expect(missingResponse.status).toBe(200);
    expect(existingResponse.body.message).toBe(missingResponse.body.message);
  });

  it("POST /auth/reset-password succeeds, rejects replay, and rejects expired tokens", async () => {
    const registerResponse = await registerUser();
    const resetToken = tokens.generateResetToken({
      userId: registerResponse.user.id,
      email: "owner@example.com"
    } satisfies ResetTokenInput);

    const successResponse = await request(app.server).post("/api/v1/auth/reset-password").send({
      resetToken,
      newPassword: "new-password123"
    });
    const replayResponse = await request(app.server).post("/api/v1/auth/reset-password").send({
      resetToken,
      newPassword: "another-password123"
    });

    const expiredToken = jwt.sign(
      {
        userId: registerResponse.user.id,
        email: "owner@example.com",
        tokenType: "reset"
      },
      process.env.JWT_SECRET ?? "",
      { expiresIn: -1 }
    );

    const expiredResponse = await request(app.server).post("/api/v1/auth/reset-password").send({
      resetToken: expiredToken,
      newPassword: "another-password123"
    });

    expect(successResponse.status).toBe(200);
    expect(replayResponse.status).toBe(401);
    expect(expiredResponse.status).toBe(401);
  });

  it("GET /company succeeds with a token and returns 401 without one", async () => {
    const registerResponse = await registerUser();

    const successResponse = await request(app.server)
      .get("/api/v1/company")
      .set("Authorization", `Bearer ${registerResponse.tokens.accessToken}`);
    const unauthorizedResponse = await request(app.server).get("/api/v1/company");

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.company.slug).toBe("tulsa-hvac-pro");
    expect(unauthorizedResponse.status).toBe(401);
  });

  it("PATCH /company succeeds, validates input, and returns 401 without a token", async () => {
    const registerResponse = await registerUser();

    const successResponse = await request(app.server)
      .patch("/api/v1/company")
      .set("Authorization", `Bearer ${registerResponse.tokens.accessToken}`)
      .send({
        name: "Updated HVAC Co",
        website: "https://example.com"
      });
    const validationResponse = await request(app.server)
      .patch("/api/v1/company")
      .set("Authorization", `Bearer ${registerResponse.tokens.accessToken}`)
      .send({
        website: "not-a-url"
      });
    const unauthorizedResponse = await request(app.server)
      .patch("/api/v1/company")
      .send({
        name: "Unauthorized Update"
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.company.name).toBe("Updated HVAC Co");
    expect(validationResponse.status).toBe(400);
    expect(unauthorizedResponse.status).toBe(401);
  });
});
