import { describe, expect, it } from "vitest";

import { resolveApiListenPort, resolveWebhookListenPort, type Env } from "@fsm/config";

function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: "test",
    API_PORT: 3001,
    WEBHOOK_PORT: 3002,
    DATABASE_URL: "postgres://localhost/test",
    REDIS_URL: "redis://localhost:6379",
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    STRIPE_CONNECT_CLIENT_ID: "ca_test",
    STRIPE_PLATFORM_FEE_PERCENT: 0,
    OPENAI_API_KEY: "sk-openai",
    TWILIO_ACCOUNT_SID: "ACtest",
    TWILIO_AUTH_TOKEN: "token",
    TWILIO_FROM_NUMBER: "+15555550100",
    SENDGRID_API_KEY: "SG.test",
    SENDGRID_FROM_EMAIL: "ops@example.com",
    R2_ACCOUNT_ID: "acct",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET_NAME: "bucket",
    APP_URL: "https://app.example.com",
    JWT_SECRET: "jwt",
    JWT_REFRESH_SECRET: "jwt_refresh",
    BOOKING_HOLD_TOKEN_SECRET: "hold",
    ACCESS_TOKEN_TTL_SECONDS: 900,
    REFRESH_TOKEN_TTL_SECONDS: 604800,
    RESET_TOKEN_TTL_SECONDS: 3600,
    ESTIMATE_EXPIRY_DAYS: 30,
    INVOICE_DUE_DAYS: 30,
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    RENVANI_INTERNAL_COMPANY_ID: "00000000-0000-4000-8000-000000000053",
    DATABASE_IDLE_TIMEOUT_SECONDS: 20,
    DATABASE_CONNECT_TIMEOUT_SECONDS: 10,
    DATABASE_POOL_MAX: 10,
    DATABASE_SERVICE_MAX_CONNECTIONS: 100,
    DATABASE_TRANSACTION_MAX_RETRIES: 3,
    DATABASE_TRANSACTION_RETRY_BASE_MS: 25,
    OBJECT_STORAGE_PROVIDER: "r2",
    MEDIA_SIGNED_URL_TTL_SECONDS: 900,
    ...overrides
  } as Env;
}

describe("resolve listen ports (Render PORT)", () => {
  it("prefers PORT over API_PORT", () => {
    expect(resolveApiListenPort(baseEnv({ PORT: 10000, API_PORT: 3001 }))).toBe(10000);
  });

  it("falls back to API_PORT when PORT is unset", () => {
    expect(resolveApiListenPort(baseEnv({ API_PORT: 3001 }))).toBe(3001);
  });

  it("prefers PORT over WEBHOOK_PORT", () => {
    expect(resolveWebhookListenPort(baseEnv({ PORT: 10000, WEBHOOK_PORT: 3002 }))).toBe(10000);
  });
});
