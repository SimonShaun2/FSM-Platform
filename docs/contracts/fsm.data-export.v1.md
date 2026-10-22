# FSM data export contract v1

| Field | Value |
|--------|--------|
| **Contract ID** | `fsm.data-export.v1` |
| **Ticket** | [FS-89](https://app.notion.com/p/401317b92d158153923bdaaf3e2e3853) |
| **Scope** | Tenant-scoped asynchronous export of customer and operational records for operator portability. **No** database dumps, provider secrets, or live migration services. |

## Principles

1. **Tenant scope:** every read/write uses JWT `companyId`; cross-tenant access returns `NOT_FOUND`.
2. **Owner/admin only:** export request, list, detail, download, and retry require `owner` or `admin` role.
3. **Async generation:** export files are built in BullMQ (`fsm:exports`), not in API request handlers.
4. **Retention:** completed artifacts expire after **7 days** (`DATA_EXPORT_RETENTION_DAYS`).
5. **Redaction:** Stripe identifiers, auth secrets, and approval/payment tokens are excluded per manifest (`@fsm/types` `DATA_EXPORT_MANIFEST_V1`).

## Manifest

`GET /api/v1/data-exports/manifest` returns the versioned manifest (field inclusion/exclusion and relationships). Machine-readable source: `packages/types/src/data-export/v1/manifest.ts`.

## `data_export_sessions` lifecycle

| Status | Meaning |
|--------|---------|
| `pending` | Queued for worker |
| `processing` | Worker gathering rows and writing object storage |
| `completed` | File URL available until `expiresAt` |
| `failed` | Terminal error; `POST .../retry` allowed while retention window open |
| `expired` | Retention elapsed (download rejected) |

## API surface (`/api/v1/data-exports`)

| Method | Path | Role |
|--------|------|------|
| `GET` | `/data-exports/manifest` | Manifest v1 |
| `POST` | `/data-exports` | Create session + enqueue export |
| `GET` | `/data-exports` | Paginated list |
| `GET` | `/data-exports/:id` | Session detail |
| `GET` | `/data-exports/:id/download` | Returns download metadata + URL; audits `export.downloaded` |
| `POST` | `/data-exports/:id/retry` | Re-queue failed export (idempotent job id) |

## Activity events

| Event | When |
|-------|------|
| `export.requested` | Session created |
| `export.completed` | Worker finished successfully |
| `export.failed` | Worker failure |
| `export.downloaded` | Authorized download |
| `export.expired` | Reserved for retention enforcement |

## Formats

- `json` — single JSON document with nested entity arrays and stable UUID identifiers.
- `csv_bundle` — reserved; v1 worker still emits JSON payload (format flag stored for forward compatibility).

## Contract tests

See `apps/api/src/routes/data-exports/data-exports.test.ts` and `packages/types/src/data-export/v1/manifest.test.ts`.

FS-11 import/export gap matrix: `docs/operations/FS-89-import-export-compatibility.md`.
