import * as Sentry from "@sentry/node";

import { env } from "./env.js";

export type SentryServiceName = "api" | "worker" | "webhook";

let sentryInitialized = false;

export function isSentryInitialized(): boolean {
  return sentryInitialized;
}

/** STACK-04: optional Sentry — enabled only when `SENTRY_DSN` is set (never committed). */
export function initSentry(serviceName: SentryServiceName): void {
  if (sentryInitialized) {
    return;
  }

  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ?? 0,
    serverName: serviceName
  });

  sentryInitialized = true;
}

export function resetSentryStateForTests(): void {
  sentryInitialized = false;
}
