# FS-39 addendum — proposal-create worker ownership & `customer_message` metadata

**Supersedes open items:** reconciliation §5 row 5, §A.2, §C (partial)  
**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Contract bundle:** `operator-inbox-ui@0.1.0` + **`fsm.service-workflow@1.0.0-draft`** + **`fsm.pair4.proposal-factory@0.1.2`** (see `FS-39-pair4-proposal-factory-v0.1.2.md`; this file is **superseded** 0.1.1 draft)  
**Date:** 2026-10-20 (UTC)  
**Implementation:** **Blocked** until FS-3, FS-8, FS-9 clear. FS-14/25/28 **Backlog**.

---

## 1. Decision — no separate `retention_follow_up` kind

| Option | Disposition |
|--------|-------------|
| New `OperatorProposalKind = retention_follow_up` | **Rejected** (enum sprawl) |
| `kind = customer_message` + typed metadata | **Accepted** (Pair 4) |

All FS-28 outbound copy (thank-you, issue check, rebook, review) uses **`customer_message`** with `metadata.touchpoint` below.

---

## 2. Proposal-create worker ownership (normative)

### 2.1 Rule

**All `operator_proposals` row inserts** go through **`operatorProposalService.create*(…)`** in the API package. **Only Dev G’s worker processor** may call create paths from async jobs. **Dev H never inserts proposal rows** and never calls approve/execute.

### 2.2 Queue and processor (G-owned)

| Piece | Owner | Path (implementation) |
|-------|-------|------------------------|
| Queue | G + Pair 1 | `fsm:operator` (or split `fsm:operator-factory` — **DEFER** name to FS-3 ADR; single queue preferred for v1) |
| Processor | **G** | `apps/worker/src/processors/operator-proposals.processor.ts` |
| Job types | **G** | See §2.3 |
| Execute-approved send | **G** | Same processor or `operator-execution.processor.ts` (branch `cursor/fs-14-worker-execute-approved-4a44`) |
| Service | **G** | `apps/api/src/services/operator-proposal.service.ts` |

### 2.3 Job types (Zod in `@fsm/jobs`)

```typescript
/** G worker — idempotent proposal INSERT only */
type OperatorProposalFactoryJob =
  | {
      type: "proposal.create.from_activity_event";
      companyId: string;
      activityEventId: string; // activity_events.id
      idempotencyKey: string;
    }
  | {
      type: "proposal.create.customer_message";
      companyId: string;
      draft: CustomerMessageProposalDraftV1;
      idempotencyKey: string;
    };

/** G worker — after human approve */
type OperatorProposalExecuteJob = {
  type: "proposal.execute.approved";
  companyId: string;
  proposalId: string;
  contentVersion: number;
  idempotencyKey: string;
};
```

### 2.4 Event → proposal mapping (G factory handles)

| Trigger | Who enqueues factory job | Factory creates `kind` |
|---------|--------------------------|-------------------------|
| `activity_events.eventType = job.completed` | **G** subscriber (same processor, internal poll or outbox — FS-3) | `job_completion_confirm` when FS-25 checklist/evidence rules pass |
| `ai.recommendation_created` | **G** | `ai_recommendation_action` / `customer_message` per adapter rules |
| FS-28 retention draft | **H** worker **only enqueues** `proposal.create.customer_message` | `customer_message` |

### 2.5 H retention worker scope (branch `cursor/fs-28-retention-gates-4a44`)

**Owns:** `apps/worker/src/processors/retention-gates.processor.ts` (name TBD)

**May:**

- Read `activity_events`, jobs, customers, approved `job_completion_confirm` proposals (read-only queries).
- Evaluate automation rules + preconditions (no send).
- `operatorProposalFactoryQueue.add("proposal.create.customer_message", { draft, idempotencyKey })`.

**Must not:**

- `insert` into `operator_proposals`.
- Call `POST /api/v1/operator/proposals/*/approve`.
- Add jobs to `fsm:notifications` directly.

### 2.6 H service-event bridge (branch `cursor/fs-25-service-events-bridge-4a44`)

**Owns:** enrich `job.completed` payload in `job.service.ts` (e.g. `activityEventId`, `requiredTasksPending`, `checklistComplete`).

**May enqueue:** nothing to operator queue in v1 (G factory subscribes to `job.completed` events). If FS-3 adopts transactional outbox, H only writes events; G consumer reads outbox.

---

## 3. `customer_message` metadata (normative)

Stored on proposal row as JSON `metadata` (FS-3 column) and echoed in `OperatorProposalDetail` for UI.

```typescript
export const CUSTOMER_MESSAGE_METADATA_VERSION = "0.1.1";

export type CustomerMessageTouchpointKind =
  | "thank_you"
  | "issue_check"
  | "rebook_offer"
  | "review_request";

export interface CustomerMessageTouchpointV1 {
  contractVersion: typeof CUSTOMER_MESSAGE_METADATA_VERSION;
  domain: "retention"; // extensible: "revenue" | "scheduling"
  touchpointKind: CustomerMessageTouchpointKind;
  jobId: string;
  customerId: string;
  /** Approved job_completion_confirm proposal id — required for FS-28 touchpoints */
  prerequisiteProposalId: string;
  automationRuleId: string | null;
}

export interface CustomerMessageProposalDraftV1 {
  channel: "sms" | "email";
  proposedPreview: string;
  consequencesSummary: string;
  recipientLabel: string;
  sourceEventIds: string[]; // activity_events.id UUIDs
  touchpoint: CustomerMessageTouchpointV1;
  policyVersion: string;
  expiresAt: string | null;
}
```

### 3.1 Idempotency keys

| Touchpoint | Key pattern |
|------------|-------------|
| thank_you | `retention:{companyId}:{jobId}:thank_you` |
| issue_check | `retention:{companyId}:{jobId}:issue_check` |
| rebook_offer | `retention:{companyId}:{jobId}:rebook_offer` |
| review_request | `retention:{companyId}:{jobId}:review_request` |

Factory job **and** approve execute must reuse the same key family; replay = no duplicate proposal / no duplicate send (G N4, H N28-4).

### 3.2 Consent at execute (not at draft)

- **Draft create (H enqueue):** may run consent **precheck**; if hard-fail, enqueue `proposal.create` with block reason → G factory creates **no row** OR creates `exception_escalation` — **DEFER** to FS-8; default: **no proposal row**, log `retention.follow_up.blocked` activity event (H emit, FS-3 enum).
- **Send:** G execute path re-checks `doNotContact`, `prefersSms`, channel-specific consent (PO rule for review vs marketing **still DEFER**).

### 3.3 UI (G)

Inbox list shows `touchpoint.touchpointKind` + `domain` badge; detail drawer renders `proposedPreview` escaped (G N9).

---

## 4. Acceptance record

| Party | Status | Notes |
|-------|--------|-------|
| **Dev H** | **ACCEPT** `fsm.pair4.proposal-factory@0.1.1` | 2026-10-20 — this document |
| **Dev G** | **PENDING ACK** | Reply on FS-39 thread: `ACK proposal-factory@0.1.1` or numbered objections |

**Full Pair 4 contract acceptance** (for PM): requires G ACK + FS-3 + FS-8 + FS-9 unchanged.

---

## 5. Artifacts (local, no repo push in preflight)

| File |
|------|
| `docs/preflight/FS-39-dev-H-service-workflows-handoff.md` |
| `docs/preflight/FS-39-pair4-contract-reconciliation.md` |
| `docs/preflight/FS-39-pair4-proposal-worker-and-metadata.md` (this file) |
| `docs/preflight/FS-39-dev-H-service-event-map.md` (H event map — attached to H handoff) |
| G: `FS-39-dev-g-operator-inbox-preflight-handoff.md` (G run artifacts) |
