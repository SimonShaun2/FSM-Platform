import { db } from "./client.js";
import { runWithPostgresRetry, type RunWithPostgresRetryOptions } from "./postgres-retry.js";

export type TransactionExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TransactionCallback<T> = (tx: TransactionExecutor) => Promise<T>;

export type RunTransactionWithRetryOptions = RunWithPostgresRetryOptions;

/**
 * Runs a Drizzle transaction and retries only on PostgreSQL deadlock / serialization failures.
 * Callers must keep the callback idempotent: external side effects (queues, email, Stripe) belong
 * after a successful commit, not inside the callback.
 */
export async function runTransactionWithRetry<T>(
  callback: TransactionCallback<T>,
  options?: RunTransactionWithRetryOptions
): Promise<T> {
  return runWithPostgresRetry(() => db.transaction(callback), options);
}
