# MVP P0 assignments — Batches 7–9 (active dispatch)

**Authority:** Founder MVP-first policy (`BATCH-PLAN-5-9.md` §0) · **PO:** Elena  
**Tech Lead:** Grace · **Rule:** Each PR needs **Isaac + Lily + Sam PASS @ exact head** before `batch-ci` merge. Standing pre-approval = CI mechanics only.

**Integration base:** `dev` (refresh before branch). **Post-merge review:** [#81](https://github.com/SimonShaun2/Renvani/pull/81) @ `5163a8e` — all three reviewers must comment PASS/FAIL (see PR thread).

---

## MVP P0 backlog (Elena cut-line)

| Priority | Ticket | Lifecycle | Batch slot | Status |
| --- | --- | --- | --- | --- |
| P0 | **FS-72** | Repeat | 9 | Implementation PR(s) — reminder candidates + inbox proposals |
| P0 | **FS-38** | Discover | 7 | Public acquisition hardening (checklist gaps) |
| P0 | **FS-21** | Book | 7 | Hold token / slot follow-up |
| P0 | **FS-58** | Discover/Book | 7 | Public proxy / branded path hardening |
| P0 | **FS-87** | Serve | 8 | Mobile client contract (extends field-work-sync v1) |
| P0 | **Dispatch SSE** | Serve | 8 | SSE + 30s poll fallback per `AGENTS.md` |

---

## Developer assignments (16 + Elena)

| # | Dev | Pair / pod | Ticket | Deliverable | Branch (open PR) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Ava** | Pair 1 | FS-72 | Agent action type + policy allow-list for `loyalty.reminder.propose` | `cursor/fs-72-agent-policy-ava-1f27` |
| 2 | **Marcus** | Pair 1 | FS-72 | Route registration + Zod schemas (`/loyalty/reminder-candidates`) | `cursor/fs-72-reminder-candidates-1f27` |
| 3 | **Priya** | Pair 2 | FS-87 | Mobile field-work contract doc + shared types review | `cursor/fs-87-mobile-contract-1f27` |
| 4 | **Leo** | Pair 2 | FS-38 | Public book/inquire error + idempotency UX (checklist §2) | `cursor/fs-38-public-hardening-leo-1f27` |
| 5 | **Sofia** | Pair 3 | FS-58 | API public route rate-limit / abuse negatives | `cursor/fs-58-proxy-hardening-sofia-1f27` |
| 6 | **Omar** | Pair 3 | Dispatch SSE | `GET /dispatch/stream` SSE handler + tenant scope | `cursor/dispatch-sse-fallback-1f27` |
| 7 | **Ben** | Pair 4 | Dispatch SSE | Web `EventSource` + invalidate dispatch queries | `cursor/dispatch-sse-fallback-1f27` |
| 8 | **Nina** | Pair 4 | FS-21 | Hold expiry / resume follow-up API + tests | `cursor/fs-21-hold-followup-nina-1f27` |
| 9 | **Diego** | Pair 5 | FS-72 | BullMQ job stub `evaluate-loyalty-reminder-candidates` (dry-run) | `cursor/fs-72-worker-diego-1f27` |
| 10 | **Hana** | Pair 5 | FS-72 | Queue definition in `@fsm/jobs` + replay registry | `cursor/fs-72-worker-diego-1f27` |
| 11 | **Noah** | Backend 1 | FS-72 | FS-12 tool payload schema for reminder propose | `cursor/fs-72-agent-policy-ava-1f27` |
| 12 | **Aria** | Backend 2 | FS-72 | `loyalty-reminder-candidates.service` tenant-scoped queries | `cursor/fs-72-reminder-candidates-1f27` |
| 13 | **Kai** | Backend 3 | FS-72 | Unit + route tests (isolation, plan cadence math) | `cursor/fs-72-reminder-candidates-1f27` |
| 14 | **Mila** | Infra 1 | FS-87 | Contract test gate in CI for mobile doc version | `cursor/fs-87-mobile-contract-1f27` |
| 15 | **Ezra** | Infra 2 | FS-58 | Runbook note in `docs/security` for public surface | `cursor/fs-58-proxy-hardening-sofia-1f27` |
| 16 | **Iris** | Infra 3 | Platform | Migration registry sync post-#81 (`0024`/`0025`) | `cursor/post-81-registry-fix-1f27` |
| — | **Elena** | PO | All P0 | MVP cut-line: approve P0 row order; reject ⏸ scope creep | Notion `CI Batch` + card tags |

---

## PR workflow (mandatory)

1. Branch from latest `dev`; one logical PR per row (shared branches OK when co-owned).
2. PR description lists **owners**, **ticket**, **MVP lifecycle stage**, and `pnpm build && pnpm lint && pnpm test` output.
3. Request **Isaac, Lily, Sam** @ **full head SHA** in GitHub comments (PASS/FAIL).
4. **Do not merge** until all three PASS at that SHA.
5. Add `batch-ci` label only after triple PASS; merge to `dev`; report E.. CoS at batch merge.

---

## Open PR tracker (Tech Lead maintains)

| PR | Branch | Owners | Ticket | Sign-offs @ head |
| --- | --- | --- | --- | --- |
| TBD | `cursor/post-81-registry-fix-1f27` | Iris | Registry | ☐ Isaac ☐ Lily ☐ Sam |
| TBD | `cursor/mvp-p0-assignments-1f27` | Grace + Elena | Planning | ☐ ☐ ☐ |
| TBD | `cursor/fs-72-reminder-candidates-1f27` | Aria, Marcus, Kai | FS-72 | ☐ ☐ ☐ |
| TBD | `cursor/fs-87-mobile-contract-1f27` | Priya, Mila | FS-87 | ☐ ☐ ☐ |
| TBD | `cursor/dispatch-sse-fallback-1f27` | Omar, Ben | Dispatch | ☐ ☐ ☐ |

_Update this table when PRs open._
