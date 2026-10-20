# FS-39 — Dev H (Pair 4) Service Workflows Preflight Handoff

**Ticket:** [FS-39 P0 operator approval and service workflow preflight](https://app.notion.com/p/3ff317b92d1581f09098d296a0933134)  
**Role:** Permanent FSM Senior Dev H — Service Workflows (backend/events/retention hooks)  
**Partner:** Dev G — operator UX / FS-14 inbox boundaries  
**Status:** Preflight complete — **no implementation, no push, no PR, no CI claim**  
**Prepared:** 2026-10-20 (UTC)

**FS-39 artifact bundle (Dev H):**

| Document | Purpose |
|----------|---------|
| This file | Base audit, risks, `fsm.service-workflow@v1.0.0-draft` |
| `FS-39-pair4-contract-reconciliation.md` | G/H disposition vs `operator-inbox-ui@0.1.0` |
| `FS-39-pair4-proposal-factory-v0.1.2.md` | **`fsm.pair4.proposal-factory@0.1.2`** (joint locked; supersedes 0.1.1) |
| `FS-39-pair4-proposal-worker-and-metadata.md` | Historical 0.1.1 draft |
| **`FS-39-dev-H-service-event-map.md`** | **Completion → `customer_message` / review / rebook event map (attached)** |

---

## 1. Exact base SHA and scope

| Field | Value |
|--------|--------|
| **Repository** | FSM-Platform (workspace `/workspace`) |
| **Branch** | `main` (tracking `origin/main`) |
| **Base SHA** | `12b23226c0e0c199626940117fc7f0fa89f87375` |
| **Base commit message** | `12b2322 docs: add all tickets, planning files, schema, and deployment guide` |
| **Downstream tickets in scope** | FS-14 (approval inbox), FS-25 (job preparation), FS-28 (retention follow-up) |
| **Governance read** | `AGENTS.md`, `CODEX.md`, `WORKFLOW.md`, [03 Operating Rules](https://app.notion.com/p/3ff317b92d15817b9f64dda55cddb97e), [02 Platform Architecture](https://app.notion.com/p/3ff317b92d158102883eda000b1b2d25) |

**FS-39 card dependencies (board):** FS-9 design; FS-3 contracts; FS-8 policy — treat as **hard blockers** before moving FS-14/25/28 from Backlog → Ready for implementation.

---

## 2. Local commands and results (evidence)

```bash
git rev-parse HEAD
# 12b23226c0e0c199626940117fc7f0fa89f87375

corepack pnpm install   # OK
corepack pnpm build     # OK (api, worker, webhook, web)
corepack pnpm --filter @fsm/api test
# 32 files: 29 passed, 3 failed | 281 tests: 274 passed, 7 failed
```

**Failing tests at this head (not fixed in this preflight):**

- `src/services/ai-revenue.service.test.ts` (1)
- `src/services/estimate.service.test.ts` (3)
- `src/routes/estimates/estimates.test.ts` (3)

**Implication:** FS-2 test baseline must be green (or failures explicitly waived with owner sign-off) before any FS-25/28 implementation PR enters batch CI. Job/completion paths used below **do** have passing coverage (`job.service.test.ts`, `jobs.test.ts`).

---

## 3. Current behavior (read-only audit)

### 3.1 Job lifecycle and completion (FS-25 / FS-28 anchor)

| Concern | Location | Current behavior |
|---------|----------|------------------|
| Status machine | `apps/api/src/lib/job-state-machine.ts` | `in_progress` → `completed` allowed; `completed` via dedicated flow only |
| Complete job | `apps/api/src/services/job.service.ts` (`completeJob` ~L1229–1354) | Transaction: job → `completed`, customer/tech/asset rollups, `job.completed` event, then **async** `aiQueue.add("evaluate-revenue-opportunities")` |
| Block direct status complete | `job.service.ts` (`transitionStatus`) | `toStatus === "completed"` → `CONFLICT` — must use `POST …/complete` |
| HTTP surface | `apps/api/src/routes/jobs/index.ts`, `handlers.ts` | `POST /api/v1/jobs/:id/complete`, tasks, notes, photos, schedule, transition |
| Field prep artifacts | `job_tasks`, `job_notes`, `job_photos` (`packages/db/src/schema.ts`); services `job-tasks.service.ts`, `addNote`/`addPhoto` in `job.service.ts` | Tasks/notes/photos exist; **no** “job brief”, provenance (`customer_fact` / `policy` / `agent_inference`), or staff-approval gate |
| Activity events | `packages/db/src/schema.ts` (`activity_event_type` enum ~L233–247); `packages/db/src/events.ts` | `job.completed`, `job.task_completed`, `job.updated` (notes), etc. |
| Timeline read | `getJobTimeline` in `job.service.ts` | Reads `activity_events` scoped by job |

### 3.2 Retention / post-service (FS-28 anchor)

| Concern | Location | Current behavior |
|---------|----------|------------------|
| Review request create | `apps/api/src/services/review-request.service.ts` (`createReviewRequest` ~L228+) | Requires job exists; **does not require** `job.status === completed`; queues `send-review-request` on `notificationsQueue` |
| Review SMS worker | `apps/worker/src/processors/notifications.processor.ts` | Builds public `/review/{referenceId}` SMS body |
| Automation default | `apps/api/src/services/automation-rule.service.ts` | Default rule `review_request` delay 4h — **not wired** from `completeJob` today |
| Consent fields | `customers.prefers_sms`; `booking_requests.sms_consent_*` | Review path does **not** re-check consent before queueing SMS |
| AI after complete | `completeJob` → `evaluate-revenue-opportunities` | Worker-side revenue analysis; human action via AI Revenue Center (separate from retention drafts) |

### 3.3 Operator approval (FS-14 anchor — G’s UX, H’s contract)

| Concern | Location | Current behavior |
|---------|----------|------------------|
| Agent action proposals | **Not in schema** | No `agent_action_proposals` / control-plane tables in `packages/db` |
| Human approval patterns | `ai-revenue.service.ts` (action/dismiss); `campaigns` send-after-approval; estimate public approve | Partial precedents; **not unified** inbox contract |
| Architecture target | Notion 02 — Action contract | Proposals cannot mutate state; execution re-checks tenant, consent, version, idempotency |

---

## 4. Risks

| ID | Risk class | Description | Mitigation in downstream work |
|----|------------|-------------|-------------------------------|
| R1 | Architecture | No shared **agent action proposal** model; FS-14/25/28 will fork ad-hoc drafts | Block implementation on FS-10/12 (or agreed slice) + versioned `AgentActionProposal` contract |
| R2 | Tenant/Consent | `createReviewRequest` can run for non-completed jobs; SMS queued without consent re-check | FS-28 hooks: gate on `job.completed` + channel consent + suppression |
| R3 | Tenant/Consent | Job notes default `isInternal: true` but no PII minimization or provenance on agent-generated briefs | FS-25: typed brief sections + `sourceKind` enum; customer-visible vs internal split |
| R4 | Release | API suite **7 failing** at base SHA | FS-2 baseline before merge |
| R5 | Architecture | `completeJob` enqueues AI inline in API (allowed by AGENTS.md for queue add); retention must **not** send customer messages inline | All retention outreach via proposal → approval → `fsm:notifications` |
| R6 | Product | WORKFLOW.md post-job automations “opt-in via Automation Rules” — not connected to completion | Explicit worker subscriber on `job.completed` with rule + consent checks |
| R7 | Dependency | FS-39 depends FS-3, FS-9, FS-8 | Keep FS-25/28/14 implementation **Backlog** until PM marks Ready |

---

## 5. Proposed versioned contract (draft for partner sign-off)

**Contract ID:** `fsm.service-workflow@v1.0.0-draft`  
**Authors:** Dev H (service/retention/events); Dev G (operator states/UI) — **ack via FS-39 Notion Evidence or linked contract PR, not chat alone**

### 5.1 Shared types (target: `@fsm/types`)

```typescript
// Provenance for FS-25 brief content
export type BriefSectionSourceKind =
  | "customer_supplied"
  | "business_policy"
  | "agent_inference"
  | "staff_entered";

export interface JobServiceBriefSectionV1 {
  id: string;
  title: string;
  body: string;
  sourceKind: BriefSectionSourceKind;
  confidence?: number; // required when sourceKind === "agent_inference"
  policyRef?: string;
}

export interface JobServiceBriefV1 {
  contractVersion: "1.0.0";
  jobId: string;
  companyId: string;
  resourceVersion: string; // jobs.updatedAt ISO — optimistic concurrency
  sections: JobServiceBriefSectionV1[];
  checklistSummary: { total: number; requiredPending: number };
  staffApproval?: {
    status: "draft" | "approved" | "rejected";
    approvedById?: string;
    approvedAt?: string;
  };
}

// FS-28: retention intent (proposal only until FS-14 executes)
export type RetentionTouchpointKind =
  | "thank_you"
  | "issue_check"
  | "rebook_offer"
  | "review_request";

export interface RetentionFollowUpProposalV1 {
  contractVersion: "1.0.0";
  idempotencyKey: string; // e.g. `retention:{companyId}:{jobId}:{kind}`
  jobId: string;
  customerId: string;
  kind: RetentionTouchpointKind;
  channel: "sms" | "email";
  draftBody: string;
  policyVersion: string;
  consentSnapshot: {
    prefersSms: boolean;
    smsConsentAppointments: boolean | null;
    smsConsentMarketing: boolean | null;
  };
  preconditions: {
    jobStatus: "completed";
    openIssueFlag: boolean;
    suppressionActive: boolean;
  };
  expiresAt: string;
}
```

### 5.2 Events (extensions — require migration + enum update when implementing)

| Event | Emitter | When | Consumers |
|-------|---------|------|-----------|
| `job.service_brief.updated` | Service layer (FS-25) | Brief section CRUD or staff approval | Owner inbox (FS-14), activity timeline, audit |
| `job.service_brief.approved` | Service layer | Staff approves brief for field use | Mobile/tech UI, notifications (internal only) |
| `retention.follow_up.proposed` | Worker or service | After `job.completed` + rules | FS-14 inbox (G) |
| `retention.follow_up.blocked` | Service | Consent/suppression/issue gate failed | FS-14 exceptions queue, metrics |

Existing **`job.completed`** payload (keep; extend in v1.1 if needed):

```json
{
  "fromStatus": "in_progress",
  "toStatus": "completed"
}
```

Proposed **additive** payload fields (v1.1, optional):

```json
{
  "completionOutcome": "verified" | "disputed" | "pending_issue",
  "retentionEligible": boolean
}
```

### 5.3 Read APIs (FS-25 — H owns; no UI)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/v1/jobs/:id/service-brief` | JWT + `companyId` | `JobServiceBriefV1` |
| GET | `/api/v1/jobs/:id/preparation-status` | JWT | `{ readyForField: boolean, blockers: string[] }` |

Writes that change customer-visible content or send messages **must** go through FS-14 `AgentActionProposal` execute path, not these read endpoints.

### 5.4 Retention hooks (FS-28 — H owns backend)

1. **Subscribe** to `job.completed` (activity event or domain hook in `completeJob` transaction boundary — prefer **worker** `fsm:agreements` or new `fsm:retention` queue job enqueued inside same transaction as event).
2. **Evaluate** automation rules + consent + open issue flags.
3. **Emit** `retention.follow_up.proposed` or `retention.follow_up.blocked` — never call Twilio/SendGrid directly.
4. **Execute** send only after FS-14 approval record + idempotency key match.

### 5.5 Partner G ↔ H boundary (no overlapping edits)

| Artifact | Owner | Paths (implementation phase) |
|----------|-------|------------------------------|
| Operator inbox UI, action states, preview | **G** | `apps/web/...` (TBD in FS-14 ticket) |
| Proposal list API, execute/reject | **Shared** — likely Pair 1 control plane first | `apps/api/src/routes/agent-actions/` (new) |
| Service brief read model + events | **H** | `apps/api/src/services/job-service-brief.service.ts`, `packages/types` |
| Retention evaluator + blocked/proposed events | **H** | `apps/worker/src/processors/retention.processor.ts`, `packages/jobs` |
| Zod schemas / OpenAPI | **H** types first, **G** consumes | `@fsm/types`, route `schemas.ts` |

**G acknowledgment block (paste into FS-39 Evidence when agreed):**

```text
Partner G — FS-39 contract ack
Contract: fsm.service-workflow@v1.0.0-draft
UI states: draft | pending_approval | approved | rejected | expired | blocked_consent
Reads: GET service-brief, GET preparation-status (H)
Writes: inbox actions only via AgentActionProposal execute (FS-14)
Date / agent session: ___
```

---

## 6. Consumer list

| Consumer | Uses | Phase |
|----------|------|-------|
| FS-14 Operator inbox (G) | `RetentionFollowUpProposalV1`, proposal states, execute receipt | P1 |
| Mobile tech / job detail (future) | `JobServiceBriefV1` after staff approval | P3 |
| `fsm:notifications` worker | Approved `review_request` / retention sends | P4 |
| `fsm:ai` worker | Existing `evaluate-revenue-opportunities` on complete | Now |
| Activity timeline / reporting | `job.completed`, new brief/retention events | P1+ |
| Security / QA negative suites | Consent, tenant isolation, idempotency | P0 gates |
| Pair 1 control plane | `AgentActionProposal` storage + policy version | Blocker |

---

## 7. Negative test matrix (FS-25 / FS-28 — specify before implementation)

| ID | Scenario | Expected |
|----|----------|----------|
| N25-1 | Cross-tenant `GET /jobs/:id/service-brief` | `403` / `NOT_FOUND` |
| N25-2 | Brief lists `agent_inference` without `confidence` | `VALIDATION_ERROR` |
| N25-3 | Tech-facing brief before `staffApproval.status === approved` | Customer-safe fields only or `FORBIDDEN` |
| N25-4 | Unsupported job claim in inference section without source | Reject at proposal create |
| N28-1 | Retention proposal when `job.status !== completed` | No proposal; `retention.follow_up.blocked` |
| N28-2 | SMS retention when `prefersSms === false` | Blocked; no queue job |
| N28-3 | Review touchpoint when `smsConsentMarketing === false` | Blocked (channel-specific policy TBD with PO) |
| N28-4 | Duplicate idempotency key on execute | Second execute no-op; no double send |
| N28-5 | Open issue / dispute flag on job | No thank-you/review; issue_check only or block |
| N28-6 | Customer opted out / suppression list | Blocked |
| N28-7 | Expired proposal execute | `CONFLICT` |
| N28-8 | Cross-tenant execute approval | `FORBIDDEN` |
| N28-9 | Worker retry on notifications | Single `message_logs` outbound row (idempotent) |
| N14-1 | Execute without approval record | `FORBIDDEN` |
| N14-2 | Approve edited body but execute stale draft hash | `CONFLICT` |

**Test placement (implementation):**

- Service unit: `job-service-brief.service.test.ts`, `retention-follow-up.service.test.ts`
- Integration: `routes/jobs/service-brief.test.ts`, `routes/retention/*.test.ts`
- Worker: `retention.processor.test.ts`
- Security batch: adversarial tenant + consent file referenced by FS-8

---

## 8. Implementation split — branches and merge order

**Do not start until:** FS-3 schema decision, FS-9 design, FS-8 policy, FS-10/12 control-plane contract Ready, FS-2 tests green.

| Order | Branch | Owner | Contents |
|-------|--------|-------|----------|
| 1 | `cursor/fs-10-12-agent-action-contract-4a44` | Pair 1 | Proposal table, execute service, policy version (blocker) |
| 2 | `cursor/fs-39-types-service-workflow-v1-4a44` | H | `@fsm/types` + Zod only; contract `1.0.0` |
| 3 | `cursor/fs-25-service-brief-read-4a44` | H | Read services, events `job.service_brief.*`, tests N25-* |
| 4 | `cursor/fs-28-retention-hooks-4a44` | H | Worker evaluator, proposed/blocked events, tests N28-* |
| 5 | `cursor/fs-14-operator-inbox-4a44` | G | UI + inbox routes consuming proposal API |
| 6 | `cursor/fs-39-integration-negative-4a44` | H + QA | End-to-end negative suite, FS-39 Evidence update |

**Merge sequence:** 1 → 2 → 3 → 4 → (5 in parallel with 4 if API stable) → 6.  
**Rebase rule:** Any new commit invalidates Gayle/QA evidence at prior head (per Operating Rules).

---

## 9. Decision / dependency blockers

| Blocker | Owner | Unblocks |
|---------|-------|----------|
| FS-3 canonical schema / governance | Tech Lead | Enum migrations for new events |
| FS-9 design | Design | G inbox UX, brief presentation |
| FS-8 threat model + negative test catalog | Security | N28/N14 adversarial cases |
| FS-10/12 control plane | Pair 1 | FS-14 execute path |
| FS-2 test baseline | Platform | Batch CI for any implementation PR |
| PO: marketing vs appointment SMS for review requests | Product Owner | N28-3 policy |

---

## 10. Stop statement

This packet satisfies FS-39 acceptance for **Dev H**: base SHA recorded, files/behavior/risks documented, versioned contract + consumers + negative matrix + branch/merge order proposed. **Service workflow event map is CLOSED** (`FS-39-dev-H-service-event-map.md` §9–§15). **No product code, CI PASS, deploy, customer messaging, or FS-14/25/28 implementation** — blocked until **FS-3 + FS-8 + FS-9** (dual Pair 4 ACK alone does not unblock).

**Next:** G formal **ACK `fsm.pair4.proposal-factory@0.1.2`** (open **O17**); PM clears FS-3/8/9; then implementation per §8 and Pair 4 merge order in `FS-39-pair4-contract-reconciliation.md`.

---

## 11. Appendix — service event map

Full H-side map (**preflight CLOSED**): **`FS-39-dev-H-service-event-map.md`** — five state domains (job, visit-occurrence, completion, issue, series), SoR §10, idempotency/retry §11, approval §12, retention enqueue-only §13, G reconciliation §14, open register **O1–O18** (O9 closed). Implementation **blocked** until FS-3/8/9.
