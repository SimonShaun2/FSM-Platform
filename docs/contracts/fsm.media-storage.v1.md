# FSM media & document storage (v1) — FS-85

## Storage model

- Binary objects live in private object storage (`attachments/{companyId}/…` keys).
- `file_attachments.file_url` stores an opaque provider reference (R2 URL or `memory-object://` in tests).
- Provider selection: `OBJECT_STORAGE_PROVIDER` (`r2` default, `memory` in API tests).

## Access

- Direct multipart upload (`POST /api/v1/attachments`) remains supported for server-mediated uploads.
- Signed flows:
  - `POST /api/v1/attachments/upload-url` — mints short-lived upload URL after entity authorization.
  - `GET /api/v1/attachments/:id/download-url` — mints short-lived download URL for a tenant-owned attachment.

TTL: `MEDIA_SIGNED_URL_TTL_SECONDS` (default 900). Signed URL query credentials are redacted in structured logs.

## Validation

- Allowed MIME types and 50MB max size are enforced on upload intent and multipart upload.
- Filenames are normalized to safe characters.

## Deletion

- `DELETE /api/v1/attachments/:id` soft-deletes metadata (`deletedAt`); object cleanup is provider-specific follow-up (FS-93).

## Tenant isolation

- All metadata queries filter `companyId` from JWT.
- Cross-tenant attachment IDs return `NOT_FOUND` without probe leakage (see `fs-85-tenant-safe-media.routes.test.ts`).
