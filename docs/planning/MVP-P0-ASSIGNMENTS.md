# MVP P0 assignments — winter dispatch + FS-MIGRATE epic

**Authority:** `BATCH-PLAN-5-9.md` §0 · Founder **7:18–7:24 PM CT** · **PO:** Elena  
**Epic:** [`MVP-MIGRATION-EPIC-FS-MIGRATE.md`](./MVP-MIGRATION-EPIC-FS-MIGRATE.md) — generic AI importer, presets, **R2 files**, **price book**, **notes**, **multi-year history** (chunked/idempotent).  
**Platform P0:** [`MVP-PLATFORM-P0-INFRA.md`](./MVP-PLATFORM-P0-INFRA.md) — agents, queues, file pipeline, AI eval, audit, observability (parallel from M1).  
**Tech Lead:** Grace · **Sign-off:** Isaac + Lily + Sam @ head → `batch-ci` → merge.

---

## P0 backlog (Elena)

| ID | Item | Status |
| --- | --- | --- |
| **FS-MIGRATE** | Universal import + onboarding (this epic) | Active — see §16-dev grid |
| FS-38 / FS-21 / FS-58 | Discover/Book hardening | [#88](https://github.com/SimonShaun2/Renvani/pull/88)–[#90](https://github.com/SimonShaun2/Renvani/pull/90) |
| FS-72 | Repeat dry-run | [#91](https://github.com/SimonShaun2/Renvani/pull/91) |
| Dispatch SSE | Serve | **#86 merged** → `9313130` on `dev` |
| Planning | Shortest path + epic | [#93](https://github.com/SimonShaun2/Renvani/pull/93) |

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
| [#93](https://github.com/SimonShaun2/Renvani/pull/93) | Epic + assignments |

---

## Workflow

1. Push → request Isaac, Lily, Sam @ full SHA within 1h.  
2. Triple PASS → `batch-ci` → merge with head SHA guard.  
3. CoS report at batch merge + MVP dates (`MVP-SHORTEST-PATH-WINTER-2026.md` §5).
