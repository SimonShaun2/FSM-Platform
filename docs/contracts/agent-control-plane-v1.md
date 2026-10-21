# agent-control-plane@1.0.0

**Status:** PROPOSED (Pair 1 — FS-37)  
**Contract version:** `1.0.0` (`contractVersion: "1.0.0"` on every payload)  
**Types module:** `packages/types/src/agent-control-plane/v1/`  
**Zod:** exported `*Schema` parsers (e.g. `TenantContextV1Schema`, `AgentActionProposalV1Schema`) from `@fsm/types`  
**Error mapping:** `docs/contracts/agent-control-plane-v1-errors.md`

## Tenancy

- **`companyId`** is canonical on wire and in DB (`companies.id`).
- **`organizationId`** is a documentation alias only (same value as `companyId`).

## U4 — `recordVersion`

At `context.resolve`, set:

```text
recordVersion = "rv1:" + entityType + ":" + entityId + ":" + row.updatedAt.toISOString()
```

Use `buildRecordVersionV1()` from `@fsm/types`. Re-check at `policy_evaluated` and `executing`; mismatch → `ErrorCode.CONFLICT` (FS37-NT-06). No v1 DB version column.

## U5 — Agent error codes (ADR-FS-3)

| FS37-NT | `ErrorCode` | HTTP |
| --- | --- | --- |
| NT-03 / U8 payload mismatch | `CONFLICT` | 409 |
| NT-05 expired execute | `CONFLICT` | 409 |
| NT-06 stale `recordVersion` | `CONFLICT` | 409 |
| NT-07 tool not allowed | `POLICY_DENIED` | 403 |
| NT-08 consent | `CONSENT_REQUIRED` | **409** |
| NT-11 money without approval | `POLICY_DENIED` | 403 |
| NT-09 / U7 wrong tenant entity | `NOT_FOUND` | 404 |

HTTP mapping: `getHttpStatusForErrorCode()` in `@fsm/types`.

## U7–U10 (runtime — Dev A, blocked FS-10/12)

- **U7:** Wrong-tenant entity on agent APIs → `NOT_FOUND` (JWT/role exceptions unchanged).
- **U8:** Expired proposal → `CONFLICT`; safe idempotent replay → same receipt; key reuse with different payload → `CONFLICT`.
- **U9:** Unauthenticated `context.resolve` only via booking slug; never trust body `companyId`.
- **U10:** Auto-approve `context.resolve` and `message.draft` only; `message.send_proposed` always `awaiting_approval`. Default `policyVersion: "agent-policy-v1"`.

## State machine (FS-12)

`proposed` → `policy_evaluated` → (`awaiting_approval` | `approved`) → `executing` → terminal `succeeded` | `failed` | `expired` | `cancelled` | `escalated`.

Side effects only from `executing` after `approved` (or U10 auto-approved read-only tools).

## v1 tool registry (minimal slice)

| `actionType` | Approval | Execute (v1 slice) |
| --- | --- | --- |
| `context.resolve` | Auto (U10) | Read-only graph resolve |
| `message.draft` | Auto (U10) | Persist draft on proposal only |
| `message.send_proposed` | Always manual | Persist + `activity_events` only — **no** `fsm:notifications` until FS-8 |

## Shapes (normative summary)

**TenantContextV1** — `contractVersion`, `companyId`, `timezone`, `actor`, `policyVersion`, optional `sessionId`.

**CanonicalEntityRefV1** — `entityType` ∈ `customer` | `property` | `asset` | `job` | `estimate` | `invoice` | `booking_request` (no `lead` in v1), `entityId`, `companyId`, `observedAt`, `recordVersion`, optional `source`.

**AgentActionProposalV1** — `id`, `companyId`, `agentProduct`, `actionType`, `parameters`, `target`, `sourceEventIds`, `idempotencyKey`, `policyVersion`, `requiresApproval`, `expiresAt`, `state`, optional `executionReceipt`.

**Queue envelope (future `fsm:agent`)** — `{ contractVersion, companyId, proposalId, idempotencyKey }` required.

## Ownership

| Owner | Scope |
| --- | --- |
| Dev B | `packages/types/**`, route Zod `schemas.ts`, contract Vitest |
| Dev A | `packages/db` migrations (post–FS-3), services, worker, agent lifecycle `activity_event_type` enums |

## Gates

- **FS-10 / FS-12** implementation blocked until **FS-3 Ready** and contract **ACCEPTED** (FS-8 NT execution for Security PASS).
- **ACCEPTED** not claimed while ADR is Proposed or NTs are unexecuted.
