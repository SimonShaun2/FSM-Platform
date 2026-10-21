# FS-28 — Retention gates (Batch 2, Pair 4 Dev H)

**Card:** [FS-28 Retention Agent: post-service follow-up](https://app.notion.com/p/3ff317b92d1581b08f42dbb2b09a6e4b)  
**CI Batch:** `BATCH-FS2-GROWTH-001`  
**Contract:** `fsm.pair4.proposal-factory@0.1.2` + `fsm.service-workflow@1.0.0-draft`  
**Base:** `dev` @ `92f58e60ffd2705a8057320d39794a6d4b921c55`

## Delivered in this PR

- `@fsm/types` — proposal metadata, operator queue job shapes, retention gate evaluation (G-RET-1, consent, automation, open-issue suppression).
- `retention-gates` service re-exports + feature flags (`@fsm/config/feature-flags`, default **off**).
- `fsm:operator` queue + `retention-gates.processor` — **enqueue-only** `proposal.create.customer_message` with `dryRun: true` by default; **no** Twilio/SendGrid, **no** `operator_proposals` INSERT (G factory).
- Post-service touchpoints: thank-you, issue check, **rebook offer**, review request; optional **win-back** touchpoint behind `retentionWinBackEnqueue`.
- FS-14 kickoff doc merged from PR #22 (supersedes standalone PR #22).

## Not in this PR

- Operator proposal factory / inbox UI (Dev G).
- Wiring from live `job_completion_confirm` approval (G emits `retention-gates.after-completion-confirm`).
- FS-3 DDL for `operator_proposals`.

## Pair review

Dev G: ACK enqueue payload + idempotency keys align with `fsm.pair4.proposal-factory@0.1.2`.
