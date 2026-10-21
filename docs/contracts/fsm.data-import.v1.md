# FSM data import contract v1

| Field | Value |
|--------|--------|
| **Contract ID** | `fsm.data-import.v1` |
| **Ticket** | [FS-11](https://app.notion.com/p/3ff317b92d1581b38b08da9045981fb8) |
| **Design** | [Figma — New/11–12](https://www.figma.com/design/jiGHTNUJNltWbHA4Il3hk7/) — nodes `12:4` (settings upload), `12:181` (results) |
| **Scope** | One-way CSV/file import into Renvani (`import_sessions` + worker). **No** live sync, outbound SoR adapters, or integrations with Jobber, Housecall Pro, or similar vendors. |

## Principles

1. **Renvani is system of record** after import completes.
2. **Tenant scope:** every read/write uses JWT `companyId`; cross-tenant access returns `NOT_FOUND`.
3. **Traceability:** ingested rows carry `importSessionId`; rollback soft-deletes all rows for that session in one transaction.
4. **Operator-assisted:** validation errors are collected per row; operators fix CSV and re-upload or adjust mappings — no external write reconciliation.
5. **Async pipeline:** mapping, validation, and execute run in BullMQ (`fsm:imports`), not in API request handlers.

## Spreadsheet formula injection (CSV)

Cell values that begin with `=`, `+`, `-`, `@`, tab, or contain carriage returns are **neutralized** on ingest (worker parse), when serving `GET /imports/:id/errors`, and when the UI exports an error CSV (leading formula characters prefixed with `'`, `\r` stripped). Shared helper: `@fsm/types` `sanitizeSpreadsheetCell`.

## `import_sessions` lifecycle

| Status | Meaning |
|--------|---------|
| `uploaded` | File in R2; worker mapping queued |
| `mapping` | AI/heuristic column mapping in progress |
| `preview` | Mappings confirmed; row validation available |
| `importing` | Worker executing ingest |
| `completed` | Ingest finished (may include row-level skips/errors) |
| `failed` | Terminal failure |
| `rolled_back` | Operator undo; tagged entities soft-deleted |

**Entity types (v1):** `customers`, `jobs` (see `@fsm/types` `ImportEntityType`).

## API surface (`/api/v1/imports`)

| Method | Path | Role |
|--------|------|------|
| `POST` | `/imports` | Owner/admin upload CSV → `201` + session `uploaded` (max **10MB**) |
| `GET` | `/imports` | Paginated list (tenant-scoped) |
| `GET` | `/imports/:id` | Session detail |
| `GET` | `/imports/:id/errors` | `validationErrors[]` for operator review (sanitized values) |
| `POST` | `/imports/:id/confirm-mapping` | Merge overrides → `preview` |
| `POST` | `/imports/:id/start` | `preview` → `importing` + execute job |
| `POST` | `/imports/:id/rollback` | `completed` → `rolled_back` |

## Duplicate actions & rollback

- Operator chooses per-row duplicate actions: `skip`, `update_existing`, `import_new` on start.
- **`update_existing`:** worker tags the customer with `importSessionId` and stores a **prior-value snapshot** in `import_sessions.aiInferences.rollbackSnapshots.customerUpdates` (including `propertyIds` created during the update). Rollback restores customer fields from snapshots, clears `importSessionId` on those customers, soft-deletes snapshot-linked properties, then soft-deletes all rows still tagged with the session id.

## Activity events

| Event | When |
|-------|------|
| `import.started` | Session created |
| `import.completed` | Worker finishes execute (success or partial) |
| `import.failed` | Session marked failed |
| `import.rolled_back` | Operator rollback |

## Idempotency & duplicates

- Duplicate detection on ingest uses company-scoped keys (email for customers; address rules per processor).
- Re-uploading the same file creates a **new** `importSessionId` (no silent merge across sessions).

## Non-goals (explicit)

- Bi-directional sync with incumbent FSM tools.
- Real-time webhooks from Jobber/HCP/QuickBooks Online (file export only in UI copy).
- Payment capture or Stripe changes during import.

## Contract tests

See `apps/api/src/routes/imports/fs-11-import.contract.test.ts`:

| ID | Coverage |
|----|----------|
| FS-11-AC-01 | Happy upload + `import.started` |
| FS-11-AC-02 | Collected row errors |
| FS-11-AC-03 | Rollback soft-deletes tagged rows |
| FS-11-AC-04 | Tenant isolation (session read) |
| FS-11-AC-05 | Operator retry (`start` from preview) |
| FS-11-AC-06 | Formula injection neutralized in errors API |
| FS-11-AC-07 | Upload rejected when CSV &gt; 10MB |
| FS-11-AC-08 | Cross-tenant `rollback`, `errors`, and `start` return `NOT_FOUND` |

Service unit tests: `apps/api/src/services/import.service.test.ts` (rollback restores `update_existing` snapshots).

Types: `packages/types/src/spreadsheet-sanitize.test.ts`.
