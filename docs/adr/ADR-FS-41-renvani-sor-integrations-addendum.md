# ADR-FS-41: Renvani system of record and integration boundaries (addendum)

**Status:** Proposed (FS-41 — PO + Security ACK required)  
**Owner:** Tech Lead (architecture); Product Owner (scope); Security (risk register)  
**Date:** 2026-10-21  
**Base SHA:** `7f1e6328e1a5ba54c7477b0cce0496502235f1e0`  
**Supersedes:** None (extends ADR-0004, ADR-FS-3)  
**Superseded by:** None

---

## Problem

Growth Batch 4 needs a durable decision: what Renvani owns as **system of record (SoR)**, how external FSM/competitor data may enter the platform, and which **live integrations are explicitly out of scope** until founder-approved ADRs and Security sign-off.

## Decision

### 1. Renvani standalone system of record

- **Renvani is the authoritative SoR** for tenant-scoped operational data once ingested or created in-product: companies, users, customers, properties, assets, jobs, estimates, invoices, booking requests, agent actions, activity events, and related workflow state at the committed schema (`packages/db/src/schema.ts`).
- **Agent products** (revenue, scheduling, service, retention, owner / Command Center) read and propose actions against this SoR; they do not treat an external FSM as SoR after migration/import cutover for a given object class.
- **Dual-write or bidirectional sync** with external FSMs is **not** a v1/v2 default — any exception requires a new ADR + founder approval (see risk register).

### 2. External data ingress (allowed)

| Channel | Status | Notes |
| --- | --- | --- |
| **CSV import** (`import_sessions`, worker pipeline) | **In scope** | Primary bulk onboarding; provenance via `importSessionId` |
| **Manual / UI entry** | **In scope** | Standard API |
| **Public booking / branded site** | **In scope** | Tenant-scoped slugs; no third-party SoR |
| **TrayLoop / other repo patterns** | **Adapt via ADR** | Port only through versioned contracts — no blind copy |

### 3. Explicit non-goals (live sync)

The following are **out of scope** unless a future ADR is **Accepted** and **founder approves** connector work:

| System | Non-goal |
| --- | --- |
| **Jobber** | No live API sync, scheduled pull/push, or OAuth-connected SoR |
| **Housecall Pro (HCP)** | Same |
| **ZenMaid** | Same |
| **Launch27** | Same |
| **ServiceTitan** | Same |

**Permitted without those ADRs:** one-time **CSV/export file import** mapped through the import worker; read-only research or inventory cards in Notion — **not** production connectors.

### 4. Integration risk register

| ID | Item | Risk | Mitigation / gate |
| --- | --- | --- | --- |
| **IR-01** | [FS-40](https://app.notion.com/) (threat / adapter scope — board card) | Wrong adapter scope → tenant leak or shadow SoR | Security review before any adapter code; tenant-scoped payloads only |
| **IR-02** | [FS-55](https://app.notion.com/) (growth / external channel — board card) | Unapproved outbound or third-party SoR | PO acceptance; consent + FS-8 negatives before live send |
| **IR-03** | **Future FSM connector** (any live sync named above or similar) | Data drift, conflict resolution, credential storage | **Founder approval** + new ADR + Security sign-off + batch CI at exact head |
| **IR-04** | CSV import | Poisoned rows, PII mishandling | Worker-only parse; row errors collected; no inline API parse |
| **IR-05** | Agent execute path | Cross-tenant entity refs | `companyId` on JWT; FS-37 NT matrix |

*(Link FS-40 / FS-55 to current Notion URLs on the build board when publishing evidence.)*

### 5. Consequences

- Engineering does **not** scaffold OAuth apps, webhooks, or polling jobs for Jobber/HCP/ZenMaid/Launch27/ServiceTitan under FS-41.
- Product may stage **full FSM suite** completion inside Renvani SoR per §01 Product; that is not the same as external live sync.
- Local developer contract: [FS-41 package boundaries doc](../planning/FS-41-package-boundaries-and-local-dev-contract.md).

## Security impact

- Production vendor keys remain out of FS-41 local contract; adapters stay behind env validation and webhook-only money paths per existing ADRs.
- New connectors must pass tenant isolation review and update FS-8 evidence.

## Alternatives considered

- **External SoR with Renvani as cache:** rejected for v1 — conflicts with agent control plane and audit model.
- **Immediate ServiceTitan parity connector:** rejected — cost and risk; CSV/import-first.

## Acceptance gates

| Party | Status |
| --- | --- |
| Product Owner | **ACK pending** |
| Security | **ACK pending** |
| E.. CoS merge to `dev` | After dual ACK + approved batch |
