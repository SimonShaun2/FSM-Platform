# Field work sync — mobile client profile (FS-87) v1.0.0

Extends [`field-work-sync-v1.md`](./field-work-sync-v1.md) for native/hybrid technician clients. Server contract unchanged; this document captures **client obligations** for MVP Serve.

## Client requirements

| Area | Requirement |
| --- | --- |
| Auth | Bearer JWT; refresh via existing staff session flows (FS-84) |
| Device identity | Stable `deviceId` (1–128 chars) persisted across app restarts |
| Batch queue | Durable local queue keyed by `batchClientId`; resume with `resumeBatchId` after network loss |
| Ordering | Monotonic `sequence` per batch; never reuse `clientOperationId` for different payloads |
| Optimistic lock | Supply `baseRecordVersion` for `job.status.update`, `job.task.update`, `job.signature.capture` |
| Media | Register via `job.media.register`; upload bytes through attachment API after register ack |
| Background sync | Exponential backoff; max 200 operations per batch POST |

## Offline windows

- Client must tolerate **409** conflict responses and surface operator-visible retry (no silent drop).
- Client must not call sync for jobs not assigned to the signed-in technician profile.

## Versioning

- `contractVersion` must be `1.0.0` until a breaking FS-87 revision is published on `dev`.

**Owners:** Priya + Leo (Pair 2) · **PO:** Elena (Serve MVP cut-line)
