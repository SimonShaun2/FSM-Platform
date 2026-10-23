# MVP P0 assignments — winter dispatch + FS-MIGRATE epic

**Authority:** `BATCH-PLAN-5-9.md` §0 · Founder **7:18–7:24 PM CT** · **PO:** Elena  
**Epic:** [`MVP-MIGRATION-EPIC-FS-MIGRATE.md`](./MVP-MIGRATION-EPIC-FS-MIGRATE.md) — generic AI importer, presets, **R2 files**, **price book**, **notes**, **multi-year history** (chunked/idempotent).  
**Platform P0:** [`MVP-PLATFORM-P0-INFRA.md`](./MVP-PLATFORM-P0-INFRA.md) — agents, queues, file pipeline, AI eval, audit, observability (parallel from M1).  
**Tech Lead:** Grace · **Sign-off:** Isaac + Lily + Sam @ head → `batch-ci` → merge.

**Pod shipping policy (Grace relay — Shaun, effective next cycle):** Stay on **Composer 2.5** (**fast mode off**). Drop **“very lean” per-run clipping** — each dev/agent run ships a **fuller, complete PR** for the assigned ticket slice (implementation + **tests** + evidence), not micro-diffs that need immediate follow-up PRs for the same ticket. Still **avoid wasteful reruns** (read epic/ADR first, one branch per slice, don’t re-land the same fix). **Merge discipline unchanged:** triple sign @ head, `batch-ci`, head SHA guard, no rebase on signed PRs.

**CI before merge (Shaun / Grace):** Run full gates on **PR head** (`pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm test`). If `batch-ci` label cannot be applied, post gate results on the PR before requesting sign-off. No account creation or live credentials — env stubs only (Shaun owns vendor accounts).

---

## Cycle dispatch — Backend / Infra / Platform (Shaun directive)

**Every backend, infrastructure, and platform dev has one concrete P0 ticket this cycle.** Full slices + tests; base `dev` @ merge train through [#100](https://github.com/SimonShaun2/Renvani/pull/100) / [#92](https://github.com/SimonShaun2/Renvani/pull/92) / [#98](https://github.com/SimonShaun2/Renvani/pull/98) / [#99](https://github.com/SimonShaun2/Renvani/pull/99).

| Dev | Role | Ticket | Deliverable | Branch | Cloud agent |
| --- | --- | --- | --- | --- | --- |
| **Noah** | Backend Dev 1 | **FS-MIGRATE-0026 + chunk worker** | Drizzle `0026` lineage (`import_bundles`, chunk runs); `@fsm/jobs` `import-chunk-commit`; worker processor + tests per [ADR-FS-MIGRATE](../adr/ADR-FS-MIGRATE-import-lineage.md) | `cursor/fs-migrate-0026-lineage-1f27` (+ worker in same PR or `cursor/fs-migrate-import-chunk-commit-1f27`) | `bc-11e2b174-5aff-4e65-804d-16db858a45f2` |
| **Aria** | Backend Dev 2 | **STACK-13** | Stripe **Billing** MVP (test mode): checkout/status API, **platform subscription webhooks** (idempotent), settings snapshot; Connect unchanged | `cursor/stack-stripe-billing-mvp-1f27` ([#104](https://github.com/SimonShaun2/Renvani/pull/104)) | `bc-ea6c1585-f20f-43e8-96e8-ce2e2082c717` |
| **Kai** | Backend Dev 3 | **STACK-02** | API `runCompanyScopedTransaction` / tenant GUC on writes; Clerk org→`company_id` mapping; feature-flag parallel JWT; tests | `cursor/stack-clerk-auth-1f27` ([#103](https://github.com/SimonShaun2/Renvani/pull/103)) | `bc-b663ca68-21a7-4565-af55-7921998fcf46` |
| **Mila** | Infra Dev 1 | **STACK-12** | Render blueprint: API/worker/webhook + Key Value (`noeviction`); Neon region alignment; no live deploy | `cursor/stack-render-deploy-1f27` ([#101](https://github.com/SimonShaun2/Renvani/pull/101)) | `bc-dfcd70c2-6f59-4ac5-9d3b-12e009639bc4` |
| **Ezra** | Infra Dev 2 | **STACK-10 + Neon CI** | RLS policy migration catalog → SQL migration (staging); Neon **per-PR branch** CI hook in `batch-ci` matrix doc + test | `cursor/stack-rls-neon-ci-1f27` (extends [#102](https://github.com/SimonShaun2/Renvani/pull/102)) | `bc-4951f52f-5c64-4ce2-8ed4-aa3a463d11be` |
| **Iris** | Infra Dev 3 | **FS-MIGRATE R2 + Sentry** | R2 resumable import file pipeline (`migrate-file-batch` job stub); Sentry SDK wiring (API/worker/webhook) env-only | `cursor/fs-migrate-r2-sentry-1f27` | `bc-3bd7afb0-62f8-41dd-a92d-d15383f8f3df` |
| **Ruby** | Platform 1 | **STACK-05** | BullMQ queue depth / DLQ monitoring routes + minimal internal admin read API; tests | `cursor/stack-bullmq-monitoring-1f27` | `bc-b7e4021a-e3f3-411b-a136-f634378a0f37` |
| **Felix** | Platform 2 | **STACK-07 + audit** | Langfuse adapter + agent approval/audit event foundation (align FS-72 policy); tests | `cursor/stack-langfuse-agent-audit-1f27` | `bc-f468b53b-61f3-4882-8b49-6e004d371557` |

*Grid adjustments:* STACK-02 owner **Kai** (was Noah). STACK-12 owner **Mila** (was Iris). STACK-10 + Neon per-PR CI **Ezra** (was Sam). STACK-13 **Aria** (unchanged). Noah takes **0026 + chunk worker** (FS-MIGRATE spine). Iris takes **R2 + Sentry** (file platform). Ruby/Felix own queue monitoring and Langfuse/audit platform slices.

---

## P0 backlog (Elena)

| ID | Item | Status |
| --- | --- | --- |
| **FS-MIGRATE** | Universal import + onboarding (this epic) | Active — see §16-dev grid |
| FS-38 / FS-21 / FS-58 | Discover/Book hardening | [#88](https://github.com/SimonShaun2/Renvani/pull/88)–[#90](https://github.com/SimonShaun2/Renvani/pull/90) |
| FS-72 | Repeat dry-run | [#91](https://github.com/SimonShaun2/Renvani/pull/91) |
| Dispatch SSE | Serve | **#86 merged** → `9313130` on `dev` |
| Planning | Shortest path + epic | **#93 merged** → `c5fb3de` |
| **STACK** | Official operational stack | [#97](https://github.com/SimonShaun2/Renvani/pull/97) |

---

## Official stack — migration tickets (prioritized for **2026-12-05 CT**)

**Canonical:** [`docs/OFFICIAL-OPERATIONAL-STACK.md`](../OFFICIAL-OPERATIONAL-STACK.md) · **Gaps:** [`docs/platform/OFFICIAL-STACK-GAP-ANALYSIS.md`](../platform/OFFICIAL-STACK-GAP-ANALYSIS.md)  
**Accounts:** Shaun creates (gap doc § accounts); agents wire env names only.  
**FS-MIGRATE M1 (#92):** **not blocked** — ship presets on existing `DATABASE_URL`; Neon/Clerk run **in parallel**.  
**Sequencing:** [gap doc § founder notes](../platform/OFFICIAL-STACK-GAP-ANALYSIS.md#founder-sequencing-notes-approved--include-in-tickets).

| Priority | ID | Dev | Deliverable | Branch |
| --- | --- | --- | --- | --- |
| **P0** | **STACK-11** | **Ezra** | Staging matrix; Neon **per-PR branches** + region = Render API region | `cursor/stack-staging-env-1f27` |
| **P0** | **STACK-12** | **Mila** | Render deploy/runbook (API region drives Neon region choice) | `cursor/stack-render-deploy-1f27` |
| **P0** | **STACK-01** | **Ezra** | Neon dev/staging URLs; co-located region; FS-80 pools (**no M1 gate**) | `cursor/stack-neon-env-1f27` |
| **P0** | **STACK-02** | **Kai** | Clerk + **DB session tenant context** (`company_id` per request); JWT flag parallel | `cursor/stack-clerk-auth-1f27` |
| **P0** | **STACK-03** | **Sam** | **Day-one** automated cross-tenant tests (CI); Clerk + app matrix (Sofia implements with Sam spec) | `cursor/stack-cross-tenant-ci-1f27` |
| **P0** | **STACK-10** | **Ezra** | RLS policies using session `company_id`; pairs with STACK-02 | `cursor/stack-rls-design-1f27` / `cursor/stack-rls-neon-ci-1f27` |
| **P0** | **STACK-13** | **Aria** | **Stripe Billing** MVP subscriptions (test mode); Connect explicitly **deferred** | `cursor/stack-stripe-billing-mvp-1f27` |
| **P0** | **STACK-05** | **Ruby** | BullMQ queue monitoring + DLQ | `cursor/stack-bullmq-monitoring-1f27` |
| **P0** | **STACK-08** | **Leo** | Resend adapter; Twilio sandbox only until 10DLC | `cursor/stack-resend-adapter-1f27` |
| **P1** | **STACK-14** | **Aria** | Stripe **Connect** onboarding/payouts (after Billing unless Elena 12-05 escalation) | `cursor/stack-stripe-connect-1f27` |
| **P1** | **STACK-04** | **Ezra** | Sentry + PostHog SDK | `cursor/stack-observability-1f27` |
| **P1** | **STACK-07** | **Felix** | Langfuse + eval hooks + agent audit | `cursor/stack-langfuse-agent-audit-1f27` |
| **P1** | **STACK-06** | **Diego** | R2 per-env buckets | with file batch PR |
| **P1** | **STACK-00** | **Ezra** | Doc sweep post-accept | `cursor/stack-doc-reconcile-1f27` |
| — | **STACK-09** | **Shaun** | Stripe test keys; **Billing** live when approved; **A2P 10DLC** registration **start now**; HubSpot **free** tier | Founder only |
| — | **Elena** | PO | Accept stack PR #97; confirm P0 fits **12-05** | Sign-off |

*Grace:* **#92 M1** merges on its own train; stack **P0** in parallel — no rebase fights with FS-MIGRATE branches.

---

## FS-MIGRATE — 16 dev assignments (parallel)

| # | Dev | Workstream | Deliverable | Branch / PR |
| --- | --- | --- | --- | --- |
| 1 | **Marcus** | Presets | Service Fusion + Jobber preset modules (quirks doc inline) | [#92](https://github.com/SimonShaun2/Renvani/pull/92) → rename `import-source-presets` |
| 2 | **Noah** | Presets | ST + HCP + QB Online/Desktop preset modules | `cursor/fs-migrate-source-presets-1f27` |
| 3 | **Kai** | Fixtures | Golden multi-file bundles per source (M1) | `cursor/fs-migrate-golden-bundles-1f27` |
| 4 | **Iris** | Engine | XLSX parse + **stream/chunk** ingest; `import_sessions` bundle + progress (ADR) | `cursor/fs-migrate-xlsx-bundle-1f27` |
| 5 | **Aria** | Relational | Join keys customer↔location↔job; preview graph service | `cursor/fs-migrate-relational-preview-1f27` |
| 6 | **Hana** | Relational | Invoice + **payments** + open balance commit (preserve `paid_at`) | `cursor/fs-migrate-invoices-balances-1f27` |
| 7 | **Diego** | Dedupe | Merge preview API + operator dedupe actions | `cursor/fs-migrate-dedupe-preview-1f27` |
| 8 | **Ava** | Agreements | Maintenance plans + recurring schedule import slice | `cursor/fs-migrate-maintenance-import-1f27` |
| 9 | **Omar** | Assets | Equipment/asset history import (asset-age moat) | `cursor/fs-migrate-equipment-import-1f27` |
| 10 | **Priya** | Onboarding UX | Guided wizard steps 1–2 (source pick + multi-upload) | `cursor/fs-migrate-onboarding-wizard-1f27` |
| 11 | **Leo** | Onboarding UX | Steps 3–5 preview/commit + **resumable** state | with Priya |
| 12 | **Ben** | Onboarding UX | Progress UI + plain-language AI issue panel | with Priya/Leo |
| 13 | **Mila** | Quality | Contract tests for bundle + normalize; CI in `batch-ci` | `cursor/fs-migrate-import-contracts-1f27` |
| 14 | **Ezra** | Policy | QB OAuth gate doc; Service Fusion export runbook | [#93](https://github.com/SimonShaun2/Renvani/pull/93) |
| 15 | **Sofia** | Security | Tenant isolation tests for bundle endpoints | `cursor/fs-migrate-tenant-tests-1f27` |
| 16 | **Nina** | Normalize | Phone/date/money normalizers (`import-normalize`) | `cursor/fs-migrate-normalize-lib-1f27` |
| — | **Elena** | PO | Epic acceptance §6–§7; vendor + history depth priority | Epic doc |

*Grace:* land [#93](https://github.com/SimonShaun2/Renvani/pull/93) epic; sequence PRs M1→**M8**; no per-vendor importer PRs. **M6–M8**, chunked history, and platform P0 run in parallel with M2–M5 once M1 presets land.

---

## FS-MIGRATE — history, catalog & lineage (7:24 CT)

| Dev | Workstream | Deliverable | Branch / PR |
| --- | --- | --- | --- |
| **Nina** | Lineage | ADR + types: `source_system`, `source_id`, business timestamps on commit | `cursor/fs-migrate-source-lineage-1f27` |
| **Omar** | Price book | Items/services/materials import + link to invoice line seeds | `cursor/fs-migrate-price-book-1f27` |
| **Aria** | History | Estimates + multi-year job history chunk processor | `cursor/fs-migrate-history-chunks-1f27` |
| **Ben** | Notes | Customer/job/internal notes + visibility | `cursor/fs-migrate-notes-1f27` |
| **Priya** | Comms | Communications export → timeline / `message_logs` slice | `cursor/fs-migrate-comms-history-1f27` |
| **Leo** | Reports | Historical report export ingest (AR/revenue snapshots) | `cursor/fs-migrate-report-snapshots-1f27` |
| **Ava** | Repeat moat | Post-import hook: FS-72 reminder + reactivation candidates from migrated history | with [#91](https://github.com/SimonShaun2/Renvani/pull/91) / `fs-migrate-post-import-campaigns-1f27` |
| **Kai** | Fixtures | **100k-row** chunk golden + 2-year history bundle per source | extends `cursor/fs-migrate-golden-bundles-1f27` |

---

## FS-MIGRATE — file migration & platform P0 (7:23 CT, Backend / Infra)

| Dev | Workstream | Deliverable | Branch / PR |
| --- | --- | --- | --- |
| **Diego** | File ingest | Resumable **batch upload** → R2 (`{companyId}/imports/{bundleId}/…`); `migrate-file-batch` on `fsm:imports` | `cursor/fs-migrate-r2-file-batch-1f27` |
| **Mila** | File ingest | MIME sniff, size limits, checkpoint/resume tests; extends FS-85 tenant paths | with Diego |
| **Marcus** | AI file link | `fsm:ai` job: filename/folder → customer/job/asset; operator confirm in preview | `cursor/fs-migrate-ai-file-link-1f27` |
| **Kai** | AI eval | Golden messy-filename fixtures; token usage logging for file match | with Marcus |
| **Hana** | Queues | DLQ visibility, failed-object-only retry, no silent drops for import jobs | `cursor/fs-migrate-queue-hardening-1f27` |
| **Iris** | Queues | Wire `migrate-file-batch` into import session state machine | with Hana |
| **Noah** | Agent runtime | Durable/idempotent import steps aligned with FS-72 agent policy patterns | `cursor/fs-migrate-agent-runtime-1f27` |
| **Ava** | Audit | `import.files_batch.*` + attachment link events on `activity_events` | with file batch PR |
| **Ezra** | Observability | Trace one bundle: `importSessionId` → job ids → R2 keys (structured logs) | `cursor/fs-migrate-observability-1f27` |
| **Sofia** | Security | Sam matrix: attachment paths + rollback cannot cross `companyId` | extends `cursor/fs-migrate-tenant-tests-1f27` |

*Principle (founder):* internal agent/queue/file/AI infrastructure is **MVP P0**, not post-winter — same bar as customer-facing import UX.

---

## Other open PRs

| PR | Notes |
| --- | --- |
| [#88](https://github.com/SimonShaun2/Renvani/pull/88)–[#91](https://github.com/SimonShaun2/Renvani/pull/91) | Triple sign → `batch-ci` |
| [#92](https://github.com/SimonShaun2/Renvani/pull/92) | Preset **catalog** for generic engine @ **`6268e44`** (re-sign after dev merge) |
| [#95](https://github.com/SimonShaun2/Renvani/pull/95)–[#96](https://github.com/SimonShaun2/Renvani/pull/96) | ADR Accepted + 0026 lineage |
| [#97](https://github.com/SimonShaun2/Renvani/pull/97) | Official operational stack + gap analysis |

---

## Workflow

1. **Ship:** one PR per ticket slice — complete enough to review/merge without a chained “part 2” for the same FS row (tests required where repo convention expects them).  
2. Push → request Isaac, Lily, Sam @ full SHA within 1h.  
3. Triple PASS → `batch-ci` → merge with head SHA guard.  
4. CoS report at batch merge + MVP dates (`MVP-SHORTEST-PATH-WINTER-2026.md` §5).
