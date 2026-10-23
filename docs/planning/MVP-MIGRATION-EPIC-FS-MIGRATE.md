# MVP P0 Epic — FS-MIGRATE: Universal AI import & onboarding

**Epic ID:** `FS-MIGRATE` (extends FS-11)  
**Authority:** Founder **7:21–7:24 PM CT** · **PO:** Elena · **Tech Lead:** Grace  
**Principles:** (1) **One generic importer** — vendors = **source presets** only. (2) **Files migrate too** — photos, PDFs, signed forms, linked to customer/job/equipment in R2. (3) **Platform P0** — agents, queues, file processing, AI eval, audit, observability parity with customer UX ([`MVP-PLATFORM-P0-INFRA.md`](./MVP-PLATFORM-P0-INFRA.md)). (4) **History is the product** — multi-year jobs, invoices, payments, estimates, communications, notes, price book, and reportable aggregates land with **original dates** and **`source_system` + `source_id`** lineage so reporting, service-history reminders, and reactivation campaigns are accurate on day one.

---

## 1. What we build (single engine)

| Layer | Responsibility | Reuse on `dev` |
| --- | --- | --- |
| **Ingest** | CSV + **XLSX** upload, multi-file sessions, resumable wizard state | `import_sessions`, R2, wizard UI shell |
| **AI column match** | OpenAI maps columns → canonical fields; presets **seed** AI, never fork logic | `mapCsvColumns` worker job |
| **Relational stitch** | Link files: customers ↔ locations ↔ jobs ↔ invoices ↔ equipment | **Build** — `import_bundle` metadata on session |
| **Normalize** | Dates, phones, money (Decimal), enums | **Build** — `@fsm/types` + shared `import-normalize` |
| **Dedupe / merge** | Company-scoped keys; operator preview of collisions | Partial (`update_existing`); **extend** |
| **Domain commit** | Customers, properties, assets, jobs, invoices, **payments**, **estimates**, maintenance plans + visit schedules | Schema supports; processors **extend** |
| **Price book** | Items, services, materials, list pricing → catalog / line-item seeds | **Build** — preset maps + `ImportEntityType` |
| **Notes** | Customer, job, and internal notes (visibility flags) | **Build** — notes processor + join to lineage keys |
| **Communications history** | SMS/email/log exports where vendor provides them | **Build** — `message_logs` or activity-backed timeline |
| **Historical reports data** | Aggregates + export rows needed for Command Center / AR aging post-migrate | **Build** — derived tables or materialized snapshots (ADR) |
| **Source lineage** | Every imported row: `source_system`, `source_id`, preserved **business timestamps** | **Build** — ADR + unique `(companyId, source_system, source_id, entityType)` |
| **Chunked / streamed ingest** | Large multi-year files: stream parse, **worker chunks**, checkpoint cursor, idempotent re-run | **Build** — `fsm:imports` child jobs per chunk |
| **Progress & partial failure** | Per-chunk status, resume from last good offset, failed-row bucket (no whole-file abort) | **Extend** `import_sessions` progress JSON |
| **Preview** | Row + relationship errors; plain-language AI summaries | `preview` status + `/errors` |
| **Reversible commit** | `importSessionId` tagging + rollback transaction | **Shipped** |
| **Audit** | `activity_events` + session log | **Shipped** pattern |
| **File / media ingest** | Photos, attachments, PDFs, signed forms → **R2** + `file_attachments` rows linked to customer/job/asset | **Build** — `attachment.service`, R2 adapter |
| **File ↔ record match** | AI + heuristics on messy filenames/folder paths; operator confirm in preview | **Build** — `fsm:ai` job |
| **Resumable file batch** | Chunked/batch upload; worker checkpoint; retry failed objects only | **Build** — `fsm:imports` job `migrate-file-batch` |

**Non-goals (founder gate):** QuickBooks OAuth / Intuit dev app, live API sync (ADR-FS-41), paid partner programs, new R2 **paid tier** provisioning without founder OK.

---

## 2. Source presets (not separate importers)

Presets are **data + quirks**, consumed by the generic engine:

| Source | Export formats | Preset contents |
| --- | --- | --- |
| **Service Fusion** | CSV/XLSX multi-export | Header aliases, file order, ID columns for joins |
| **Jobber** | CSV | Customer/job/invoice export quirks |
| **ServiceTitan** | CSV | Location vs customer split, job tags |
| **Housecall Pro** | CSV | Customer vs job exports |
| **QuickBooks Online** | CSV/XLSX | Customers, **items/price list**, invoices, payments |
| **QuickBooks Desktop** | CSV (IIF/standard exports) | Column variants, desktop naming, item list |

Implementation home: `packages/config/src/import-source-presets/` (rename from `import-vendor-presets` in [#92](https://github.com/SimonShaun2/Renvani/pull/92) follow-up).  
Adding a vendor = **new preset JSON/TS module**, not a new worker.

---

## 3. Relational multi-file model (MVP)

```text
import_bundle (per onboarding)
  ├── file: customers.csv      → entity customers
  ├── file: locations.csv      → properties (join: customer_external_id)
  ├── file: jobs.csv           → jobs
  ├── file: price_book.csv     → items / services / materials + unit pricing
  ├── file: invoices.csv       → invoices + open balances (historical + open)
  ├── file: payments.csv       → payment applications (preserve paid_at)
  ├── file: estimates.csv      → estimates + status history
  ├── file: equipment.csv      → assets + service history pointers
  ├── file: agreements.csv     → maintenance_plans + recurring schedule seeds
  ├── file: notes.csv          → customer / job / internal notes
  ├── file: communications.csv → SMS/email/call logs (when exported)
  ├── file: reports_*.csv      → vendor report exports (AR, revenue, job history summaries)
  └── media/                   → zip or folder upload (job photos, forms, PDFs)
        ├── resumable batch → R2 keys under `{companyId}/imports/{bundleId}/...`
        └── AI match → entityType + entityId (preview before link)
```

Worker phases: **map each tabular file** (or **stream chunks** for large history files) → **validate joins** → **preview graph** → **commit tabular** in dependency order (price book → customers → … → payments) → **file batch upload** → **AI/heuristic file link** → **preview unlinked** → **commit attachments** → **post-commit hooks** enqueue FS-72 / reactivation eval on imported history (same `importSessionId` for rollback).

**Rollback:** soft-delete session-tagged rows (including notes, payments, catalog lines) + `file_attachments` + R2 objects (orphan cleanup job — idempotent).

---

## 3b. Large multi-year datasets (design)

| Concern | MVP approach |
| --- | --- |
| **Volume** | Assume **100k+** job/invoice rows per tenant; no full-file load in API memory |
| **Chunking** | Worker splits by row window or byte offset; one BullMQ job per chunk with `chunkIndex`, `cursor`, `importSessionId` |
| **Idempotency** | Upsert on `(companyId, source_system, source_id, entityType)`; chunk re-run safe |
| **Progress** | `import_sessions.progress`: `{ entity, chunksTotal, chunksDone, rowsOk, rowsFailed, lastCursor }` surfaced in wizard |
| **Partial failure** | Failed rows → `import_row_errors`; successful chunks **not** rolled back on retry |
| **Timestamps** | Map vendor `created_at` / `completed_at` / `paid_at` to domain columns — **not** `now()` on commit |
| **Downstream** | Imported job/asset dates feed **service-history reminders**; dormant customer signals feed **reactivation** candidates (FS-72 worker reads activity + job history) |

Queue jobs (illustrative): `import-chunk-commit`, `migrate-file-batch`, `import-post-commit-campaigns` (async, idempotent).

---

## 4. Onboarding UX (seamless, resumable)

| Step | UX | AI role |
| --- | --- | --- |
| 1. Choose source | Service Fusion / Jobber / ST / HCP / QB Online / QB Desktop | Explain which exports to download |
| 2. Upload bundle | Tabular + **media** (zip/folder); **resumable** batch progress | Flag missing exports; estimate link confidence |
| 3. Review mappings | Per-file column review | Plain-language: “We mapped Phone → mobile” |
| 4. Preview issues | Row errors, dedupe, **unlinked/orphan files** | Plain-language issue list |
| 5. Commit | **Per-chunk** progress bar; partial success OK; resume after worker restart | Post-commit summary + history depth stats |
| 6. Done / rollback | One-click undo | Explain what rollback removes |

**Resumable:** persist wizard step + `import_bundle` id in session (httpOnly / DB) — operator can leave and return.

---

## 5. Moat hooks (founder)

- **Equipment / asset history** → feeds asset-age campaigns & FS-72 reminders  
- **Open balances** → honest AR picture in Command Center  
- **Maintenance agreements + recurring schedules** → Repeat lifecycle demo  
- **Job photos & signed PDFs** in R2 on the right job/customer — migration credibility  
- **Years of job + invoice + payment history** with real dates → credible Command Center and AR  
- **Price book** on day one → estimates/invoices don’t start from empty catalog  
- **Notes + communications** → context for dispatch and support  
- **Post-import** → service-history reminder candidates + reactivation segments without re-entering legacy data

---

## 6. Acceptance (Elena sign-off)

- [ ] One tenant: **Service Fusion OR Jobber** bundle imported end-to-end with preview, commit, rollback (**includes price book + ≥2 years job/invoice history** in golden fixture).  
- [ ] Second source: **QuickBooks Online** (customers + **items** + invoices + payments + open balance) via same wizard.  
- [ ] Dedupe preview shows merge decision before commit.  
- [ ] **Chunked re-run:** kill worker mid-chunk → resume completes without duplicate rows (`source_system` + `source_id`).  
- [ ] Historical **job completed_at** and **invoice paid_at** match source export (spot-check 20 rows).  
- [ ] Notes (customer + job) visible on records; internal notes not exposed on customer portal.  
- [ ] After import, FS-72 **dry-run** surfaces ≥1 service-history reminder candidate from migrated jobs (no manual re-entry).  
- [ ] **≥50 files** (mixed names) batch-uploaded; **≥90%** auto-linked or flagged in preview for one-click confirm.  
- [ ] Attachments visible on job/customer in UI; stored tenant-scoped in R2.  
- [ ] Audit: `import.started` / `import.completed` / `import.rolled_back` + `import.files_batch.*` events on bundle.  
- [ ] No cross-tenant leakage (FS-92 matrix + FS-85 attachments).

---

## 7. Engineering phases (parallel)

| Phase | Target | Scope |
| --- | --- | --- |
| **M1** | Week 1 | Preset catalog + XLSX parse; generic map job uses presets only |
| **M2** | Week 2 | `import_bundle` + 2-file join (customer + location) preview |
| **M3** | Week 3 | Jobs + invoices + payments + open balances; **chunked commit** + progress UI |
| **M4** | Week 4 | Equipment + maintenance agreements; **estimates** + notes; AI plain-language preview |
| **M5** | Week 5 | **Price book** + QB Desktop quirks; `source_system` / `source_id` ADR landed |
| **M6** | Week 6 | **File batch**: R2 ingest, AI file-to-record match, attachment rollback |
| **M7** | Week 7 | Communications + historical report slices; platform hardening (queue replay, observability) |
| **M8** | Week 8 | Post-import **reminder/reactivation** hook from migrated history; large-tenant soak test |

*Calendar weeks are planning buckets; ship slices as PRs merge. Platform P0 runs **in parallel** from M1 ([`MVP-PLATFORM-P0-INFRA.md`](./MVP-PLATFORM-P0-INFRA.md)).*

---

## 8. Contract alignment

- `fsm.data-import.v1` remains SoR contract; FS-MIGRATE adds **bundle**, **entity**, **chunk**, and **lineage** extensions via ADR addendum (Elena + Isaac).  
- Types: extend `ImportEntityType` in `@fsm/types` (`price_book_item`, `payment`, `estimate`, `note`, `communication`, `report_snapshot`, …) — no per-vendor types.  
- Lineage columns (or shared `imported_entity_refs` table): `source_system` (preset id), `source_id` (vendor primary key string), `importSessionId`, original timestamps on domain rows.
