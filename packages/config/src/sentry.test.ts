import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/node", () => ({
  init: vi.fn()
}));

import * as Sentry from "@sentry/node";

import { resetEnvCacheForTests } from "./env.js";
import { initSentry, isSentryInitialized, resetSentryStateForTests } from "./sentry.js";
import { setupTestEnv } from "./test-support/env-setup.js";

describe("STACK-04 Sentry bootstrap", () => {
  afterEach(() => {
    resetSentryStateForTests();
    vi.unstubAllEnvs();
    setupTestEnv();
    resetEnvCacheForTests();
    vi.clearAllMocks();
  });

  it("does not initialize when SENTRY_DSN is unset", () => {
    setupTestEnv();
    resetEnvCacheForTests();

    initSentry("api");

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(isSentryInitialized()).toBe(false);
  });

  it("initializes once when SENTRY_DSN is provided", () => {
    setupTestEnv();
    vi.stubEnv("SENTRY_DSN", "https://example.ingest.sentry.io/123");
    vi.stubEnv("SENTRY_ENVIRONMENT", "test");
    vi.stubEnv("SENTRY_TRACES_SAMPLE_RATE", "0.1");
    resetEnvCacheForTests();

    initSentry("worker");
    initSentry("worker");

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(isSentryInitialized()).toBe(true);
  });
});
