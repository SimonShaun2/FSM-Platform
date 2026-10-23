import { runTransactionWithTenantSession, type TransactionCallback } from "@fsm/db";

/**
 * STACK-02 — run business logic in a transaction with tenant session GUC set for RLS.
 */
export async function runCompanyScopedTransaction<T>(
  companyId: string,
  callback: TransactionCallback<T>
): Promise<T> {
  return runTransactionWithTenantSession(companyId, callback);
}
