import { env } from "@fsm/config";

import { db } from "./client.js";
import { isRetryablePostgresError } from "./postgres-errors.js";

export type TransactionExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TransactionCallback<T> = (tx: TransactionExecutor) => Promise<T>;

export interface RunTransactionWithRetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function jitterMs(baseMs: number): number {
  return baseMs + Math.floor(Math.random() * baseMs);
}

/**
 * Runs a Drizzle transaction and retries only on PostgreSQL deadlock / serialization failures.
 * Callers must keep the callback idempotent: external side effects (queues, email, Stripe) belong
 * after a successful commit, not inside the callback.
 */
export async function runTransactionWithRetry<T>(
  callback: TransactionCallback<T>,
  options?: RunTransactionWithRetryOptions
): Promise<T> {
  const maxRetries = options?.maxRetries ?? env.DATABASE_TRANSACTION_MAX_RETRIES;
  const baseDelayMs = options?.baseDelayMs ?? env.DATABASE_TRANSACTION_RETRY_BASE_MS;

  let attempt = 0;

  while (true) {
    try {
      return await db.transaction(callback);
    } catch (error: unknown) {
      if (!isRetryablePostgresError(error) || attempt >= maxRetries) {
        throw error;
      }

      const delayMs = jitterMs(baseDelayMs * 2 ** attempt);
      attempt += 1;
      await sleep(delayMs);
    }
  }
}
