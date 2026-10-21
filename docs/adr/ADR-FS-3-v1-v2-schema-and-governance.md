# ADR-FS-3: V1/V2 schema and governance baseline

**Status:** Proposed (FS-3 In Progress — not Done; no merge to `main` without founder batch policy)

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
recordVersion = row.updatedAt.toISOString()
```

- No v1 `version` column on core entities.
- At execute: reload target row; if `recordVersion` ≠ current `updatedAt.toISOString()` → `ErrorCode.CONFLICT` (409), no side effects (maps to FS37-NT-06).
- Distinct from payload `contractVersion` `1.0.0`.

- **Product Owner:** acknowledged 2026-10-21 (PR #19 comment); sub-second concurrent writes: accepted v1 limitation — reload at execute.
- **Security:** pending acknowledgment; maps to FS37-NT-06 and `CONFLICT` with U5 error-code family.

## Open items

| ID | Owner | Item |
| --- | --- | --- |
| U5 | Security | `CONSENT_REQUIRED` / `POLICY_DENIED` for FS37-NT-08 (types + mapping) |
| F1–F4 | Founder | Protected integration branch, PR #1 merge target, master spec location, production promotion |

## Consequences

- Pair 1 (FS-37) may incorporate U4 into `agent-control-plane@1.0.0` after PO + Security review; U5 remains Security-owned.
- Implementation cards FS-10/12/17+ stay gated until FS-3 Ready and FS-8 negative evidence (see FS-8).

## Reviewers (required before FS-3 → In Review)

1. **Security** — ADR + U5 closure on FS-8 / FS-37 (**pending**)
2. **Product Owner** — agent-first wedge vs in-scope FSM portfolio (**ACK 2026-10-21**, PR #19)
