# FSM data import contract v1

| Field | Value |
|--------|--------|
| **Contract ID** | `fsm.data-import.v1` |
| **Ticket** | [FS-11](https://app.notion.com/p/3ff317b92d1581b38b08da9045981fb8) |
| **Design** | Figma New/11–12 — nodes `12:4`, `12:181` |
| **Scope** | One-way CSV/file import into Renvani (`import_sessions` + worker). **No** live sync, outbound SoR adapters, or integrations with Jobber, Housecall Pro, or similar vendors. |

## Principles

1. **Renvani is system of record** after import completes.
2. **Tenant scope:** every read/write uses JWT `companyId`; cross-tenant access returns `NOT_FOUND`.
3. **Traceability:** ingested rows carry `importSessionId`; rollback soft-deletes all rows for that session in one transaction.
4. **Operator-assisted:** validation errors are collected per row; operators fix CSV and re-upload or adjust mappings — no external write reconciliation.
5. **Async pipeline:** mapping, validation, and execute run in BullMQ (`fsm:imports`), not in API request handlers.

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
| `POST` | `/imports` | Owner/admin upload CSV → `201` + session `uploaded` |
| `GET` | `/imports` | Paginated list (tenant-scoped) |
| `GET` | `/imports/:id` | Session detail |
| `GET` | `/imports/:id/errors` | `validationErrors[]` for operator review |
| `POST` | `/imports/:id/confirm-mapping` | Merge overrides → `preview` |
| `POST` | `/imports/:id/start` | `preview` → `importing` + execute job |
| `POST` | `/imports/:id/rollback` | `completed` → `rolled_back` |

## Activity events

| Event | When |
|-------|------|
| `import.started` | Session created |
| `import.completed` | Worker finishes execute (success or partial) |
| `import.failed` | Session marked failed |
| `import.rolled_back` | Operator rollback |

## Idempotency & duplicates

- Duplicate detection on ingest uses company-scoped keys (email for customers; address rules per processor).
- Operator chooses per-row duplicate actions: `skip`, `update_existing`, `import_new` on start.
- Re-uploading the same file creates a **new** `importSessionId` (no silent merge across sessions).

## Non-goals (explicit)

- Bi-directional sync with incumbent FSM tools.
- Real-time webhooks from Jobber/HCP/QuickBooks Online (file export only in UI copy).
- Payment capture or Stripe changes during import.

## Contract tests

See `apps/api/src/routes/imports/fs-11-import.contract.test.ts` — maps acceptance IDs **FS-11-AC-01** through **FS-11-AC-05**.
