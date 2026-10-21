# ADR-FS-3: V1/V2 schema and governance baseline

**Status:** Proposed (FS-3 In Progress — not Done; merge to protected **`dev`** only per E.. CoS; **`main`** promotion by founder only)

**Recorded:** 2026-10-21  
**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Governance PR #1 head:** `99bb96b54c21ee65c5904b0c1d70d98c63e1946e` (draft, unmerged)

## Context

FSM P0 requires a single schema/governance baseline before agent control-plane contracts (FS-37) and downstream implementation. This ADR records the Tech Lead decision at the verified `main` baseline.

## Decision

### AF-V1E — Keep committed V1 DDL

- Keep committed V1 DDL (38 tables, migrations `0000`–`0016`).
- Additive agent control-plane tables only for P1.
- Defer full FSM entity model expansion and overlay migration `0017` (**schema scope only** — not a deferral of Renvani product scope).
- **Canonical schema file:** `packages/db/src/schema.ts`.
- Retire duplicate `fsm-schema.ts` under reconciliation ticket FSM-0004 (tracked separately).

### Product scope vs schema scope (PO acknowledged 2026-10-21)

- **Renvani product portfolio (in scope):** Growth, Revenue, Operations, Retention, and Command Center — one lifecycle, staged delivery.
- **FSM facilitator modules (in scope):** Existing repository capabilities (customers, properties, jobs, dispatch, estimates, invoices, booking, agreements, field tools, reporting, customer-facing workflows) are **finished and improved** per inventory-led tickets; not excluded as “optional suite later.”
- **Agent-first wedge:** Operators may adopt agents and adapters on incumbent systems before migrating workflow to Renvani-hosted modules; that is a **go-to-market sequence**, not permission to ignore FSM completion work.
- **What AF-V1E defers:** Overlay migration `0017` and broad entity-model expansion until control-plane contracts land — not the product decision to ship FSM functionality.

### Tenant identifier

- `companyId` is canonical for tenant scope.
- `organizationId` is an alias only — no second column until ADR-0002.

### Governance sources

- **Operations law:** Notion §03 Software Team + FSM Agent spec §07.
- **Repo law (when merged):** PR #1 @ `99bb96b5` — 26-role roster, tandem WIP, exact-head evidence, approved-batch-only CI.
- `main` @ `12b23226…` still carries pre-reconciliation `AGENTS.md` until governance PR merges via approved batch.

### U4 — `recordVersion` on `CanonicalEntityRefV1` (resolved, pending PO + Security review)

Required on mutating agent control-plane references where identity is `entityType` + `entityId` + `companyId`:

```text
recordVersion = "rv1:" + entityType + ":" + entityId + ":" + row.updatedAt.toISOString()
```

- No v1 `version` column on core entities.
- At execute: reload target row; recompute current `recordVersion`; if mismatch → `ErrorCode.CONFLICT` (409), no side effects (maps to FS37-NT-06).
- Distinct from payload `contractVersion` `1.0.0`.

- **Product Owner:** prior ACK 2026-10-21 superseded by commits after `8de32140`; re-ACK required at new head after Consequences alignment.
- **Security:** pending acknowledgment; maps to FS37-NT-06 and `CONFLICT` with U5 error-code family.

### U5 — `ErrorCode` extension (spec closure; implementation gated)

Security + Dev B own the enum diff in the FS-37 types PR **after FS-3 Ready** (no runtime change on `main` @ `12b23226` in Batch 1 docs-only).

| Code | HTTP | FS37-NT | When emitted (v1) |
| --- | --- | --- | --- |
| `POLICY_DENIED` | 403 | NT-07, NT-11 | Tool not in policy allowlist; AI money/state change without approval |
| `CONSENT_REQUIRED` | 409 | NT-08 | Outbound channel blocked until consent guard (FS-8); FS-12 slice has no provider send |

Existing codes unchanged: cross-tenant → `NOT_FOUND` / `FORBIDDEN`; stale target / idempotency (incl. **NT-03** duplicate `idempotencyKey` replay mismatch) → `CONFLICT`.

**Proposed** until Security acknowledges mapping on FS-8 and FS-37 acceptance record.

## Open items

| ID | Owner | Item |
| --- | --- | --- |
| U5 | Security | Acknowledge U5 table above; execute NT rows on FS-12 head (enum lands in types PR) |
| F1–F4 | Founder | Protected integration branch, PR #1 merge target, master spec location, production promotion |

## Consequences

- **Agent-first wedge (P0–P1):** Add control-plane DDL and contracts first; operators may adopt agents on incumbent systems without replacing their full stack. **Product scope (Notion §01):** Growth, Revenue, Operations, Retention, and Command Center plus **in-scope FSM facilitator modules** are delivered **in stages** — growth loop first, then inventory-led completion/improvement of existing repo capabilities — not excluded or permanently deferred.
- **FSM substrate:** Existing `main` entities (`jobs`, `booking_request`, dispatch, `ai_recommendations`, invoices) remain the workflow/data layer agents read; no `lead` entity in v1 contract (use `job`).
- Pair 1 (FS-37) may incorporate U4/U5 spec into `agent-control-plane@1.0.0` after PO + Security **ACK**; implementation stays blocked until FS-3 Ready.
- Implementation cards FS-10/12/17+ stay gated until FS-3 In Review (dual ACK) and FS-8 negative evidence (see FS-8).

## Reviewers (required before FS-3 → In Review)

1. **Security** — ADR + U5 closure on FS-8 / FS-37 (**pending**)
2. **Product Owner** — agent-first wedge vs in-scope FSM portfolio (**re-ACK pending** at PR head after Consequences fix)
