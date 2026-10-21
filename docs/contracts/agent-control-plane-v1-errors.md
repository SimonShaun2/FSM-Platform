# agent-control-plane@1.0.0 — Error codes (ADR-FS-3 U5)

Shared definitions live in `@fsm/types` (`ErrorCode`, `getHttpStatusForErrorCode`, `agent-control-plane/v1`).

| FS37-NT | Scenario | `ErrorCode` | HTTP |
| --- | --- | --- | --- |
| NT-03 | Same idempotency key, different payload | `CONFLICT` | 409 |
| NT-06 | Stale `recordVersion` (`rv1:…`) | `CONFLICT` | 409 |
| NT-07 | Tool not allowlisted | `POLICY_DENIED` | 403 |
| NT-08 | Outbound without consent | `CONSENT_REQUIRED` | 409 |
| NT-11 | AI money state without approval | `POLICY_DENIED` | 403 |

`recordVersion` at resolve: `rv1:{entityType}:{entityId}:{row.updatedAt.toISOString()}` — see `buildRecordVersionV1()`.
