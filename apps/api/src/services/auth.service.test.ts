import { hash as hashPassword } from "bcryptjs";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AppError, ErrorCode } from "@fsm/types";

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
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("../lib/email.js", () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock
}));

type AuthServiceModule = typeof import("./auth.service.js");
type CompanyServiceModule = typeof import("./company.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");
type TokensModule = typeof import("../lib/tokens.js");
type CompanyUpdateInput = Parameters<CompanyServiceModule["updateCompany"]>[2];

let authService: AuthServiceModule;
let companyService: CompanyServiceModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;

beforeAll(async () => {
  authService = await import("./auth.service.js");
  companyService = await import("./company.service.js");
  fakeDb = await import("../test-support/fake-db.js");
  tokens = await import("../lib/tokens.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
  sendPasswordResetEmailMock.mockReset();
  vi.useRealTimers();
});

function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

describe("auth.service", () => {
  it("registers a company, owner, and hashed refresh token", async () => {
    const result = await authService.register({
      companyName: "Tulsa HVAC Pro",
      firstName: "Ava",
      lastName: "Stone",
      email: "owner@example.com",
      password: "password123",
      phone: "555-0100",
      timezone: "America/Chicago"
    });

    const state = fakeDb.getTestState();
    const storedRefreshToken = requireValue(state.refreshTokens[0], "Expected a stored refresh token");

    expect(result.company.slug).toBe("tulsa-hvac-pro");
    expect(result.user.role).toBe("owner");
    expect(result.user.passwordHash).not.toBe("password123");
    expect(state.refreshTokens).toHaveLength(1);
    expect(await tokens.compareToken(result.tokens.refreshToken, storedRefreshToken.tokenHash)).toBe(true);
    expect(state.activityEvents.map((event) => event.eventType)).toEqual([
      "company.created",
      "user.registered"
    ]);
  });

  it("rejects duplicate register email", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      firstName: "Pat",
      lastName: "Lee"
    });

    await expect(
      authService.register({
        companyName: "Other Co",
        firstName: "Sam",
        lastName: "Hill",
        email: "owner@example.com",
        password: "password123",
        timezone: "America/Chicago"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
      message: "An account with this email already exists"
    });
  });

  it("rejects weak register password", async () => {
    await expect(
      authService.register({
        companyName: "Weak Pass Co",
        firstName: "Sam",
        lastName: "Hill",
        email: "sam@example.com",
        password: "short",
        timezone: "America/Chicago"
      })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("logs in with correct credentials", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("password123", 12),
      firstName: "Pat",
      lastName: "Lee",
      role: "owner"
    });

    const result = await authService.login({
      email: "owner@example.com",
      password: "password123"
    });

    const state = fakeDb.getTestState();
    const storedRefreshToken = requireValue(state.refreshTokens[0], "Expected a stored refresh token");

    expect(result.user.id).toBe(user.id);
    expect(state.refreshTokens).toHaveLength(1);
    expect(await tokens.compareToken(result.tokens.refreshToken, storedRefreshToken.tokenHash)).toBe(true);
    expect(state.activityEvents.map((event) => event.eventType)).toEqual(["user.login"]);
  });

  it("returns the same login error for wrong email and wrong password", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("password123", 12),
      firstName: "Pat",
      lastName: "Lee"
    });

    const getLoginError = async (email: string, password: string) => {
      try {
        await authService.login({ email, password });
        throw new Error("Expected login to fail");
      } catch (error) {
        return error as AppError;
      }
    };

    const wrongEmailError = await getLoginError("missing@example.com", "password123");
    const wrongPasswordError = await getLoginError("owner@example.com", "wrong-password");

    expect(wrongEmailError.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(wrongPasswordError.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(wrongEmailError.message).toBe(wrongPasswordError.message);
  });

  it("refreshes a valid refresh token and revokes the old one", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("password123", 12),
      firstName: "Pat",
      lastName: "Lee",
      role: "owner"
    });
    const refreshToken = tokens.generateRefreshToken({
      userId: user.id,
      companyId: company.id
    });

    fakeDb.seedRefreshToken({
      companyId: company.id,
      userId: user.id,
      tokenHash: await tokens.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 60_000)
    });

    const result = await authService.refresh(refreshToken);
    const state = fakeDb.getTestState();
    const revokedRefreshToken = requireValue(state.refreshTokens[0], "Expected the original refresh token");
    const replacementRefreshToken = requireValue(state.refreshTokens[1], "Expected a replacement refresh token");

    expect(state.refreshTokens).toHaveLength(2);
    expect(revokedRefreshToken.revokedAt).toBeInstanceOf(Date);
    expect(await tokens.compareToken(result.tokens.refreshToken, replacementRefreshToken.tokenHash)).toBe(true);
  });

  it("rejects an expired refresh token", async () => {
    const refreshToken = jwt.sign(
      {
        userId: "user-1",
        companyId: "company-1",
        tokenType: "refresh"
      },
      process.env.JWT_REFRESH_SECRET ?? "",
      { expiresIn: -1 }
    );

    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED
    });
  });

  it("rejects a revoked refresh token", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("password123", 12),
      firstName: "Pat",
      lastName: "Lee"
    });
    const refreshToken = tokens.generateRefreshToken({
      userId: user.id,
      companyId: company.id
    });

    fakeDb.seedRefreshToken({
      companyId: company.id,
      userId: user.id,
      tokenHash: await tokens.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date()
    });

    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED
    });
  });

  it("revokes the token on logout", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("password123", 12),
      firstName: "Pat",
      lastName: "Lee"
    });
    const refreshToken = tokens.generateRefreshToken({
      userId: user.id,
      companyId: company.id
    });

    fakeDb.seedRefreshToken({
      companyId: company.id,
      userId: user.id,
      tokenHash: await tokens.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 60_000)
    });

    await authService.logout(user.id, refreshToken);

    const state = fakeDb.getTestState();
    const storedRefreshToken = requireValue(state.refreshTokens[0], "Expected a stored refresh token");
    expect(storedRefreshToken.revokedAt).toBeInstanceOf(Date);
  });

  it("returns void for existing and nonexistent forgot-password requests", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("password123", 12),
      firstName: "Pat",
      lastName: "Lee"
    });

    sendPasswordResetEmailMock.mockResolvedValue(undefined);

    await expect(authService.forgotPassword("owner@example.com")).resolves.toBeUndefined();
    await expect(authService.forgotPassword("missing@example.com")).resolves.toBeUndefined();
    expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1);
  });

  it("swallows send failures in forgot-password", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("password123", 12),
      firstName: "Pat",
      lastName: "Lee"
    });

    sendPasswordResetEmailMock.mockRejectedValue(new Error("SendGrid down"));

    await expect(authService.forgotPassword("owner@example.com")).resolves.toBeUndefined();
  });

  it("resets a password successfully", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("old-password", 12),
      firstName: "Pat",
      lastName: "Lee",
      passwordChangedAt: null
    });
    const refreshToken = tokens.generateRefreshToken({
      userId: user.id,
      companyId: company.id
    });
    const previousPasswordHash = user.passwordHash;

    fakeDb.seedRefreshToken({
      companyId: company.id,
      userId: user.id,
      tokenHash: await tokens.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 60_000)
    });

    const resetToken = tokens.generateResetToken({
      userId: user.id,
      email: user.email
    });

    await authService.resetPassword(resetToken, "new-password123");

    const state = fakeDb.getTestState();
    const storedUser = requireValue(state.users[0], "Expected the reset user");
    const storedRefreshToken = requireValue(state.refreshTokens[0], "Expected the revoked refresh token");
    expect(storedUser.passwordChangedAt).toBeInstanceOf(Date);
    expect(storedUser.passwordHash).not.toBe(previousPasswordHash);
    expect(storedRefreshToken.revokedAt).toBeInstanceOf(Date);
  });

  it("rejects a reset-token replay attempt", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("old-password", 12),
      firstName: "Pat",
      lastName: "Lee",
      passwordChangedAt: null
    });
    const resetToken = tokens.generateResetToken({
      userId: user.id,
      email: user.email
    });

    await authService.resetPassword(resetToken, "new-password123");

    await expect(authService.resetPassword(resetToken, "another-password123")).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED
    });
  });

  it("rejects an expired reset token", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      passwordHash: await hashPassword("old-password", 12),
      firstName: "Pat",
      lastName: "Lee"
    });
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tokenType: "reset"
      },
      process.env.JWT_SECRET ?? "",
      { expiresIn: -1 }
    );

    await expect(authService.resetPassword(resetToken, "new-password123")).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED
    });
  });
});

describe("company.service", () => {
  it("gets a company successfully", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });

    const result = await companyService.getCompany(company.id);

    expect(result.id).toBe(company.id);
  });

  it("throws not found for a missing company", async () => {
    await expect(companyService.getCompany("missing-company")).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
  });

  it("updates allowed company fields", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      firstName: "Pat",
      lastName: "Lee"
    });

    const result = await companyService.updateCompany(company.id, user.id, {
      name: "Acme HVAC",
      website: "https://example.com"
    });

    expect(result.name).toBe("Acme HVAC");
    expect(result.website).toBe("https://example.com");
  });

  it("rejects unauthorized company field updates", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      firstName: "Pat",
      lastName: "Lee"
    });

    await expect(
      companyService.updateCompany(
        company.id,
        user.id,
        { stripeAccountId: "acct_123" } as unknown as CompanyUpdateInput
      )
    ).rejects.toBeInstanceOf(ZodError);
  });
});
