# FS-83 — Recovery objectives and continuity drill (handoff)

| Field | Value |
|---|---|
| **Ticket** | [FS-83 — Define backup recovery objectives and continuity drill](https://app.notion.com/p/401317b92d1581119795c8090b557278) |
| **Branch** | `cursor/fs-83-recovery-continuity` (from `dev`) |
| **Agent** | Infrastructure Dev 3 |
| **Status** | Provider-neutral prep **complete**; **isolated restore drill not executed** |
| **Last updated** | 2026-10-22 |

## Deliverables in this branch

| Document | Purpose |
|---|---|
| [FS-83-critical-services-inventory.md](./FS-83-critical-services-inventory.md) | Critical runtimes, data stores, object storage, external deps, recovery order |
| [FS-83-rpo-rto-proposal.md](./FS-83-rpo-rto-proposal.md) | **Proposal** for business-owner review — **not approved targets** |
| [FS-83-recovery-runbook.md](./FS-83-recovery-runbook.md) | Provider-neutral restoration sequence, roles, verification, escalation |
| [FS-83-drill-reconciliation-checklist.md](./FS-83-drill-reconciliation-checklist.md) | Post-restore checks: tenant separation, schema, queues, payments |
| [../../scripts/recovery/drill-reconciliation.sql](../../scripts/recovery/drill-reconciliation.sql) | Read-only SQL helpers for the checklist (run only in isolated drill DB) |

## Related tickets (read for boundaries)

| FS ID | Title | Relevance to FS-83 |
|---|---|---|
| **FS-75** | Provision isolated staging environment | Target **isolated** environment for drill; topology and credential boundaries |
| **FS-76** | Environment configuration and secrets controls | Secret **rehydration** path and rotation runbook inputs |
| **FS-80** | Harden database operations, transactions, migrations, and recovery | **Backup/restore foundation** for PostgreSQL; migration safety |
| **FS-93** | Choose managed-platform boundaries | **Provider** responsibility for backups, object storage, runtime — blocks provider-specific steps |
| **FS-85** | Tenant-safe media and document storage | Object-store recovery surface and signed-access validation |

## What is explicitly not claimed

- No **approved** RPO/RTO or recovery SLA (see proposal doc; business owner must record acceptance).
- No **completed** continuity drill, measured RTO, or gap closure log.
- No verification of **production** or **staging** account backup settings (requires FS-93 ADR + account evidence).
- No restore exercise was run in this agent session.

## Blocked drill prerequisites

1. **FS-93 ADR** — Assigns who configures relational backups, object-storage versioning/replication, Redis durability, and edge/DNS.
2. **Backup/restore foundation (FS-80)** — Encrypted backups, retention, and at least one documented restore into an isolated DB with evidence.
3. **Topology inventory (FS-75)** — Reproducible isolated environment (distinct credentials, synthetic data only).
4. **Secret recovery (FS-76)** — Approved injection path and non-production rotation/revocation demo for drill credentials.
5. **Object storage (FS-85 / FS-93)** — Separate recovery surface for `file_attachments` / `job_photos` blobs in R2 (or successor); DB restore alone is insufficient per FS-83 acceptance notes.

## Next handoff

| Owner | Action |
|---|---|
| **Product Owner / founder** | Review [FS-83-rpo-rto-proposal.md](./FS-83-rpo-rto-proposal.md); record approved RPO/RTO and escalation contacts in Notion FS-83 evidence |
| **Tech Lead** | Complete **FS-93** ADR; update runbook provider-specific appendices without changing recovery order |
| **Pair 2 (FS-80)** | Implement backup retention + first isolated PG restore; attach evidence to FS-80 |
| **Pair 4 (FS-75)** | Stand up isolated drill environment contract (no production data) |
| **Pair 5 (FS-76)** | Document drill secret bundle and rehydration checklist |
| **Platform 2 / Infrastructure Dev 3** | After prerequisites green: execute [FS-83-recovery-runbook.md](./FS-83-recovery-runbook.md) drill phase; fill timing/gap log on FS-83 board |
| **QA 2** | Run tenant/payment negatives from [FS-83-drill-reconciliation-checklist.md](./FS-83-drill-reconciliation-checklist.md) at drill head |
| **Security** | Review cross-tenant and payment reconciliation queries before drill uses production-derived backups |

## Local checks (this branch)

Documented in PR description after commit: markdown-only change set; optional `pnpm -r lint` when workspace deps are installed.
