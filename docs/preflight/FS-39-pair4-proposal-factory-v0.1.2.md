# FS-39 — Pair 4 proposal-factory & service gates (joint locked draft)

**Replaces:** `fsm.pair4.proposal-factory@0.1.1` (superseded by this document)  
**Bundle:** `operator-inbox-ui@0.1.0` + `fsm.service-workflow@1.0.0-draft` + **`fsm.pair4.proposal-factory@0.1.2`**  
**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Implementation:** **Blocked** — FS-3, FS-8, FS-9. FS-14/25/28 **Backlog**.

---

## 1. Hard gate — staff-confirmed completion (normative)

**Rule G-RET-1:** No `customer_message` proposal with `metadata.domain === "retention"` (including review/rebook/thank-you/issue check) may be **created, approved, or executed** unless a **`job_completion_confirm`** proposal for the same `jobId` is in **`approved`** status (or later execution states `executing` | `succeeded` that were reached from that approval).

| Check | Enforced at | Owner |
|-------|-------------|-------|
| G-RET-1a `job_completion_confirm.status === approved` (or derived execute states) | H before enqueue; G on `proposal.create.customer_message` | H + G |
| G-RET-1b `metadata.prerequisiteProposalId` matches that approved row | G factory Zod | G |
| G-RET-1c `jobs.status` ∈ `completed` \| `invoiced` \| `paid` \| `closed` | H + G | H + G |
| G-RET-1d `job.completed` activity event exists for `jobId` | G factory | G |
| G-RET-1e No `job.reopened` after prerequisite approval without invalidation | **OPEN** FS-26 | H emit + G cancel pending |

**Operational completion ≠ staff confirmation:** `job.completed` (tech/system) only enables **`job_completion_confirm`** factory create. **Retention/review/rebook never keys off `job.completed` alone.**

**Brief FS-25 `staffApproval`:** internal field prep only; **does not satisfy G-RET-1.**

---

## 2. Job vs visit vs series (state distinction)

| Layer | Table / concept | Status fields | Role in Pair 4 pipeline |
|-------|-----------------|----------------|-------------------------|
| **Job (work order)** | `jobs` | `job_status` enum (`lead` … `closed`) | **Sole anchor** for `job.completed`, `job_completion_confirm`, retention `jobId` / `customerId` |
| **Visit (plan occurrence)** | `maintenance_visits` | `scheduled_date`, `completed_date`, optional `job_id` | Links plan occurrence → job; **does not replace job gate**. Event `maintenance_visit.completed` exists in enum (**OPEN:** emission today) |
| **Series (plan)** | `maintenance_plans` | `maintenance_plan_status` (`active`, etc.) | Billing/recurrence context only; **not** a completion or retention trigger until future visit-series model (Notion 02 gap) |

**H rule:** Retention `customer_message` metadata MUST include `entityLinks.jobId`. Optional `entityLinks.maintenanceVisitId` / `maintenancePlanId` when `jobs.maintenance_plan_id` or visit row present — for attribution only, not gating.

**OPEN (FS-3):** When visit completes without job, retention is **out of scope** for v1 Pair 4 — no proposal path.

---

## 3. Idempotency (G locked v0.1 — H ACCEPT)

| Operation | Key format | Unique constraint |
|-----------|------------|-------------------|
| **Create** (factory) | `proposal:create:{companyId}:{kind}:{entityId}:{triggerEventId}` | Per company + key |
| **Approve** (HTTP) | Client-supplied UUID | `(companyId, idempotencyKey)` unique |
| **Execute** (worker) | `proposal:execute:{companyId}:{proposalId}:v{contentVersion}` | Replay = no-op |

**H retention enqueue:** `triggerEventId` = approved `job_completion_confirm` proposal id OR `job.completed` `activityEventId` — **use `job.completed` activity event id** as `triggerEventId` for create key; `kind` = `customer_message`; `entityId` = `jobId`.

**Analytics (non-idempotency):** `metadata.attributionKey` = `retention:{companyId}:{jobId}:{touchpoint}` (G amendment — H ACCEPT).

---

## 4. `CustomerMessageProposalMetadata` (G locked — H ACCEPT with touchpoint rename)

```typescript
export const CUSTOMER_MESSAGE_METADATA_VERSION = "0.1.2";

export type ConsentScope = "appointment" | "marketing"; // PO may refine FS-8

export type CustomerMessageTouchpoint =
  | "retention_thank_you"
  | "retention_issue_check"
  | "retention_rebook_offer"
  | "retention_review_request"; // G locked name (not `review_request`)

export interface CustomerMessageEntityLinks {
  jobId: string;
  customerId: string;
  maintenanceVisitId?: string | null;
  maintenancePlanId?: string | null;
}

export interface CustomerMessageProposalMetadata {
  contractVersion: "0.1.2";
  domain: "retention";
  touchpoint: CustomerMessageTouchpoint;
  consentScope: ConsentScope; // engineering default: see §5
  entityLinks: CustomerMessageEntityLinks;
  prerequisiteProposalId: string; // approved job_completion_confirm
  automationRuleId: string | null;
  attributionKey: string;
  policyVersion: string;
}
```

Draft envelope remains `CustomerMessageProposalDraftV1` with `metadata: CustomerMessageProposalMetadata`, `sourceEventIds: string[]`, plus G `OperatorProposalDetail` fields.

---

## 5. Consent scope defaults (engineering — PO/FS-8 OPEN)

| `touchpoint` | Default `consentScope` | Execute checks |
|--------------|------------------------|----------------|
| `retention_thank_you` | `appointment` | `prefersSms`, `doNotContact`, appointment consent |
| `retention_issue_check` | `appointment` | same |
| `retention_rebook_offer` | `marketing` | **OPEN** PO — H proposes `marketing` |
| `retention_review_request` | `marketing` | **OPEN** PO — G noted FS-8 table |

H **DEFER** final table to PO; execute must fail closed if scope not satisfied.

---

## 6. Approval roles (G locked — H ACCEPT)

| Action | Roles |
|--------|-------|
| Approve `job_completion_confirm` | `owner`, `admin` |
| Approve customer-facing `customer_message` | `owner`, `admin` |
| FS-25 brief sign-off (internal) | `owner`, `admin`, `dispatcher` — **not** inbox execute |
| Proposal **create** (factory) | `system` / `ai` worker actors only — never human HTTP create for retention drafts |

---

## 7. Worker ownership (unchanged from 0.1.1)

- **G:** all `operator_proposals` inserts + execute + `proposal.create.from_activity_event` for `job_completion_confirm`.
- **H:** `retention-gates.processor` enqueues `proposal.create.customer_message` only after **G-RET-1** satisfied.

---

## 8. Partner acceptance

| Party | Status | Date |
|-------|--------|------|
| Dev G | **ACK** `proposal-factory@0.1.1` (no objections); `fsm:operator` only; attributionKey locked | 2026-10-20 |
| Dev H | **ACCEPT** `fsm.pair4.proposal-factory@0.1.2` (superset: G-RET-1 + five state domains in event map §9) | 2026-10-20 |
| Dev G | **OPEN O17** — ACK `0.1.2` or confirm 0.1.1 ACK covers 0.1.2 deltas | — |

**PM Ready for implementation:** FS-3 + FS-8 + FS-9 required. **Dual partner ACK ≠ Ready.** FS-14/25/28 stay **Backlog**. No message enqueue.

**Closed companion:** `FS-39-dev-H-service-event-map.md` (SoR §10, idempotency §11, approval §12, enqueue-only §13, open register §15).
