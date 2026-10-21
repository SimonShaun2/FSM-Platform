# FS-14 — Dev H kickoff (operator inbox read boundaries)

**Ticket:** [FS-14 Operator approval and exception inbox](https://app.notion.com/p/3ff317b92d15814fb4f5d50f8811a64a)  
**Pair:** 4 — Dev **G** owns inbox UI + operator API/worker; Dev **H** owns service events + retention enqueue-only (see FS-39).  
**Branch:** `cursor/fs-14-pair4-kickoff-4a44` → draft PR to **`dev`** (Renvani)  
**Base:** `origin/dev` @ integration head when opened  
**Status:** **Kickoff preflight** — no inbox UI, no proposal DDL, no message enqueue.

---

## 1. Objective (from board)

Operator queue for drafts, edits, approvals, escalations, and action history with provenance, risk, recipient, consequences, expiry. Execution uses **approved version only** + audit trail.

---

## 2. H scope for FS-14 (does not overlap G files)

| H delivers | G consumes |
|------------|------------|
| Rich `job.completed` payload + stable `activityEventId` (FS-25 bridge, **OPEN** O1) | `proposal.create.from_activity_event` |
| `retention-gates` enqueue-only contract (FS-28 precursor) | `proposal.create.customer_message` factory |
| Read-only helpers: job timeline slices for provenance panel (**no** proposal mutations) | Inbox `sourceEventIds` resolution |
| Service-workflow Zod in `@fsm/types` (`fsm.service-workflow@1.0.0-draft`) | Operator inbox types (`operator-inbox-ui@0.1.0`) |

**G owns:** `apps/api/src/routes/operator/**`, `operator-proposal.service.ts`, `operator-proposals.processor.ts`, `apps/web/.../operator/**`, `packages/types/src/operator-inbox.*`.

---

## 3. Dependencies (sprint order)

| Gate | Blocks H FS-14 code |
|------|---------------------|
| FS-39 preflight | **Done** @ PR #17 + countersign |
| FS-3 ADR @ `095aef90` | Schema/types for `operator_proposals` — Pair 1 / FS-37 |
| FS-12 action state machine | Execute + audit receipt shape |
| FS-8 | U5 negative tests (`CONSENT_REQUIRED`, `POLICY_DENIED`) |
| FS-9 | Inbox UX, dispatcher read-only (**OPEN** O15) |

---

## 4. ADR-FS-3 U5 (inbox execute path)

Approve/execute routes **must** return ADR U5 codes (see `FS-39-dev-H-service-event-map.md` §5.1). H does not implement execute; H blocked-path events should use compatible `reasonCode` values (**OPEN** O20).

---

## 5. Acceptance (H slice — first implementation PR after gates)

1. `getJobTimelineForProvenance(companyId, jobId, eventIds[])` — tenant-scoped read service (no writes).
2. Unit tests: cross-tenant `sourceEventIds` resolution returns empty / forbidden.
3. No new queues beyond FS-39 contract until FS-3 merges `fsm:operator` registration.

---

## 6. Merge order (Pair 4, from FS-39 reconciliation)

1. FS-3 / FS-37 types + DDL  
2. G operator types → API → worker  
3. **FS-14** G inbox + H read helpers (this card)  
4. H FS-25 brief bridge → FS-28 retention-gates  

**TrayLoop:** paused — do not touch.

---

## 7. Evidence placeholder

| Field | Value |
|-------|--------|
| Dev H agent | `bc-117b56ac-a5a6-49c1-a39a-380f2dc74a44` |
| Dev G agent | `bc-1ad1357f-5b9d-4163-9c3b-67c8d9d6d307` |
| Head SHA | _(set on PR open)_ |
| E.. CoS approval | Pending FS-8/9 + exact-head review |
