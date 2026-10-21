# FS-39 — Pair 4 joint contract reconciliation (Dev H response)

**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Date:** 2026-10-20 (UTC)  
**Status:** Preflight only — **FS-14 / FS-25 / FS-28 remain Backlog** (FS-3, FS-8, FS-9 unresolved)  
**No push / PR / CI / PASS**

**Inputs:**

- Dev G: `operator-inbox-ui@0.1.0` — artifact `FS-39-dev-g-operator-inbox-preflight-handoff.md`
- Dev H: `fsm.service-workflow@v1.0.0-draft` — `docs/preflight/FS-39-dev-H-service-workflows-handoff.md`

**Joint outcome:** **Conditional ACK** of `operator-inbox-ui@0.1.0` with corrections below; H companion contract remains `fsm.service-workflow@v1.0.0-draft` (service/retention/brief reads only — not a competing inbox API).

---

## Per-item disposition

| # | Topic | G proposal | H disposition | Notes |
|---|--------|------------|---------------|-------|
| 1 | Contract IDs | `operator-inbox-ui@0.1.0` | **ACK** | Normative for inbox UI + operator HTTP + execution receipt |
| 2 | Companion contract | — | **ACK** (retain) | `fsm.service-workflow@v1.0.0-draft` covers brief read model + retention preconditions only |
| 3 | Proposal lifecycle §6.1 | `draft→pending_review→approved\|rejected\|escalated\|expired`; `approved→executing→succeeded\|failed` | **ACK** | H will not add parallel approval enums on job rows |
| 4 | Review vs execution split (R2) | Approve ≠ send; worker executes | **ACK** | Matches Platform Architecture action contract |
| 5 | `OperatorProposalKind` set | incl. `job_completion_confirm` | **ACK** | **Resolved** in `FS-39-pair4-proposal-factory-v0.1.2.md`: FS-28 uses `customer_message` + `CustomerMessageTouchpoint` (no `retention_follow_up` kind) |
| 6 | HTTP `/api/v1/operator/*` | G owns FS-14 API | **ACK** | H will not add operator routes |
| 7 | Auth `owner\|admin` | G §6.2 | **ACK** | Dispatcher read-only **DEFER** FS-9 |
| 8 | §6.3 `job.completed` → `job_completion_confirm` | When checklist/evidence | **ACK with correction** | See §A below |
| 9 | FS-28 blocked until staff-confirmed completion | G §6.3 / N8 | **ACK** | Retention/review SMS only after `job_completion_confirm` **approved** (+ consent at execute) |
| 10 | H maps `sourceEventIds` | From activity events | **ACK with correction** | IDs must be `activity_events.id` UUIDs; H adds `activityEventId` on `job.completed` payload when FS-3 allows additive payload |
| 11 | H workers call approve/send | Forbidden | **ACK** | **Resolved:** G owns `operator-proposals.processor.ts` + all `operator_proposals` inserts; H retention worker only enqueues `proposal.create.customer_message` (see §D) |
| 12 | `ai.recommendation_created` bridge | G creates proposal | **ACK** | H does not own AI inbox adapter (G branch 7) |
| 13 | H `retention.follow_up.proposed` events | — | **CORRECT** | Drop as separate public contract; retention intents surface as **operator proposals** + optional `operator.proposal_*` activity events (G/FS-3) |
| 14 | H `job.service_brief.*` events | — | **ACK** (H retains) | Internal/field prep audit; not a send gate unless escalated to inbox |
| 15 | `JobServiceBriefV1` + GET brief routes | H draft | **ACK** (H owns) | Not part of `operator-inbox-ui@0.1.0`; G UI may **read** brief via job detail API only |
| 16 | Brief `staffApproval` | H draft | **CORRECT** | Internal gate for field use; **not** equivalent to `job_completion_confirm`; does not unlock FS-28 |
| 17 | Execution receipt authority | `executionReceipt` on proposal detail | **ACK** | Authoritative send proof = proposal `succeeded` + `message.sent` / `review_request.sent` activity + `message_logs` |
| 18 | Idempotency on approve | G §6.2 / N4 | **ACK** | H retention hooks must pass stable keys into proposal create (`retention:{companyId}:{jobId}:{touchpoint}`) |
| 19 | Negative tests N1–N10 | G §7 | **ACK** | Inbox/security authority |
| 20 | Negative tests N25-* | H draft | **ACK** (H owns tests) | Brief read tenant/provenance |
| 21 | N8 staff-confirmed completion | G | **ACK** | Aligns with H N28-1..6 |
| 22 | Merge order 1→4 then 5→8 then 6→7 | G §8 | **ACK with correction** | See §B below |
| 23 | Branch suffix `-d307` | G template | **CORRECT** | Use Pair 4 cloud suffix **`-4a44`** on all implementation branches (PM canonical) |
| 24 | FS-10/12 vs `fs-3-operator-schema` | G branch 1 | **DEFER** Pair 1 | H requires **one** schema ADR before migrations; name per FS-37/FS-3 preflight, not invented here |
| 25 | `completeJob` still emits `job.completed` | Base behavior | **ACK** | Operational completion unchanged; staff confirm is **additive** gate for outbound retention |
| 26 | Legacy `createReviewRequest` direct SMS | Base behavior | **CORRECT** (future) | FS-28 implementation must route review through proposal + execute; until then base risk R2 remains |

---

## §A — Event bridge (authoritative split)

1. **`job.completed`** (existing): emitted inside `completeJob` transaction in `job.service.ts`; payload includes `fromStatus`, `toStatus`; optional future fields `activityEventId` (self), `requiredTaskSummary` for proposal eligibility.
2. **Proposal creation** for `job_completion_confirm`: **not** in `completeJob` HTTP handler. **G** `operator-proposals.processor` job `proposal.create.from_activity_event` reads `activityEventId`, evaluates FS-25 rules, inserts row → `pending_review` via `operator-proposal.service` only.
3. **FS-28 retention drafts**: created only after proposal kind `job_completion_confirm` reaches **`approved`** and consent precheck passes at **execute** time; never on raw `job.completed` alone.
4. **H scope for branch 5:** enrich job domain emits + document mapping table; **no** `apps/api/src/routes/operator/*`, **no** `apps/web/components/operator/*`.

---

## §B — Merge order (reconciled)

| Order | Branch | Owner |
|-------|--------|-------|
| 1 | `cursor/fs-3-operator-schema-4a44` (or Pair 1 FS-10/12 name per ADR) | Pair 1 / TL |
| 2 | `cursor/fs-14-types-contract-4a44` | G |
| 3 | `cursor/fs-14-api-operator-proposals-4a44` | G |
| 4 | `cursor/fs-14-worker-execute-approved-4a44` | G |
| 5 | `cursor/fs-25-service-events-bridge-4a44` | H |
| 6 | `cursor/fs-28-retention-gates-4a44` | H |
| 7 | `cursor/fs-14-web-inbox-4a44` | G |
| 8 | `cursor/fs-14-ai-revenue-adapter-4a44` | G |
| 9 | `cursor/fs-39-types-service-workflow-v1-4a44` | H (can merge with 5 if PM prefers) |

**Conflict rule (ACK):** unchanged from G §8.

---

## §C — File ownership (reconciled)

| Path pattern | Owner |
|--------------|-------|
| `packages/types/src/operator-inbox.*` | G |
| `apps/api/src/routes/operator/**`, `operator-proposal.service.ts` | G |
| `apps/worker/**/operator-proposals.processor.ts`, `operator-execution*.ts` | G |
| `apps/web/**/approvals/**`, `components/operator/**` | G |
| `apps/api/src/services/job.service.ts`, `job-tasks.service.ts`, `job-state-machine.ts` | H |
| `apps/api/src/services/job-service-brief.service.ts` (new) | H |
| `apps/api/src/services/review-request.service.ts` (FS-28 gating changes) | H |
| `apps/worker/**/retention-gates.processor.ts` (enqueue factory jobs only) | H |
| `packages/db/schema.ts` migrations | Pair 1 / TL only |

---

## Partner H sign-off

**Disposition:** **Conditional ACK `operator-inbox-ui@0.1.0`** — items marked CORRECT/DEFER must be closed in FS-3 types ADR or FS-9 before FS-14 → Ready.

**Artifacts (local):**

- H: `docs/preflight/FS-39-dev-H-service-workflows-handoff.md`
- G: `FS-39-dev-g-operator-inbox-preflight-handoff.md` (Cursor G run artifacts)
- Joint: `docs/preflight/FS-39-pair4-contract-reconciliation.md` (this file)
- Joint factory: `docs/preflight/FS-39-pair4-proposal-factory-v0.1.2.md` (`fsm.pair4.proposal-factory@0.1.2`)
- Historical: `FS-39-pair4-proposal-worker-and-metadata.md` (superseded 0.1.1)

**Posted to Notion FS-39 comment thread** (durable ack; not chat-only).

---

## §D — Proposal factory `fsm.pair4.proposal-factory@0.1.2` (2026-10-21)

**Normative addendum:** `docs/preflight/FS-39-pair4-proposal-factory-v0.1.2.md` (supersedes 0.1.1 draft in `FS-39-pair4-proposal-worker-and-metadata.md`).

| Topic | Locked in 0.1.2 |
|-------|------------------|
| G-RET-1 | No retention `customer_message` without approved `job_completion_confirm` |
| Worker ownership | G: all `operator_proposals` inserts + `operator-proposals.processor` on **`fsm:operator` only** |
| H retention | `retention-gates.processor` enqueue-only `proposal.create.customer_message` — no approve/send/notifications |
| Metadata | `CustomerMessageProposalMetadata` @ `0.1.2`, `prerequisiteProposalId`, `attributionKey` = `retention:{companyId}:{jobId}:{touchpoint}` |
| Idempotency | `proposal:create:…`, approve client UUID, `proposal:execute:…:v{version}` |
| U5 errors | Preflight mapping in event map §5.1; ADR status per `FS-39-pair4-adr-u5-status.md` |

**Partner acceptance:** Dev H **ACCEPT** `0.1.2` @ PR #17 head (see `FS-39-pair4-countersign.md`). Dev G **re-sign** @ same PR head after reviewer-3 fix (agent `bc-1ad1357f`).
