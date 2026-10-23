export { db } from "./client.js";
export type { Database } from "./client.js";
export {
  buildPostgresClientOptions,
  computeConnectionBudget,
  resolveDatabasePoolMax,
  type ConnectionBudgetInput,
  type ConnectionBudgetResult,
  type ProcessConnectionRole
} from "./connection-config.js";
export { isRetryablePostgresError } from "./postgres-errors.js";
export {
  loadMigrationJournalFromFile,
  scanMigrationSqlForDestructiveStatements,
  validateMigrationBundle,
  validateRepoMigrationBundle,
  type MigrationSafetyIssue,
  type MigrationSafetyResult
} from "./migration-safety.js";
export { runWithPostgresRetry, type RunWithPostgresRetryOptions } from "./postgres-retry.js";
export { runTransactionWithRetry, type RunTransactionWithRetryOptions, type TransactionCallback } from "./transactions.js";
export {
  REVENUE_SUMMARY_CACHE_TTL_SECONDS,
  buildRevenueSummaryCacheKey,
  computeRevenueSummarySnapshot,
  listActiveCompanyIdsForRevenueSummary
} from "./ai-revenue-helpers.js";
export type {
  RevenueSummaryCacheEntry,
  RevenueSummaryCountBucketRecord,
  RevenueSummaryTopRecommendationRecord,
  RevenueSummaryValueBucketRecord
} from "./ai-revenue-helpers.js";
export { emitEvent } from "./events.js";
export type { EmitEventContext } from "./events.js";
export { emitEventWithExecutor } from "./events.js";
export { markInvoiceOverdueIfNeeded } from "./invoice-helpers.js";
export type { InvoiceOverdueRecord } from "./invoice-helpers.js";
export * from "./import-invoice-balance-commit.logic.js";
export {
  commitImportedInvoiceRows,
  commitImportedPaymentRows,
  type ImportInvoiceBalanceEntityResolver,
} from "./import-invoice-balance-commit.service.js";
export * from "./schema.js";
