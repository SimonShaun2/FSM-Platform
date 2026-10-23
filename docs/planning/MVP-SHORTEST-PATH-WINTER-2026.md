# Shortest path — demoable, migration-ready MVP (winter 2026)

**Authority:** Founder urgency 2026-10-22 **7:18–7:24 PM CT** (winter buying window) · **PO:** Elena · **Tech Lead:** Grace  
**North star:** **One generic AI importer** migrates **multi-year** customer history (jobs, invoices, payments, estimates, notes, comms), **price book**, **media** to R2, with **chunked worker ingest**, **`source_system` + `source_id`** lineage, and post-import **reminder/reactivation** signals; then **Discover → Book → Serve → Repeat** in one demo. Epic: [`MVP-MIGRATION-EPIC-FS-MIGRATE.md`](./MVP-MIGRATION-EPIC-FS-MIGRATE.md). Platform agents/queues/files/observability: [`MVP-PLATFORM-P0-INFRA.md`](./MVP-PLATFORM-P0-INFRA.md). No live API sync until founder approves OAuth (ADR-FS-41).

---

## 1. Demo script (minimum viable walkthrough)

| Stage | What we show | P0 already on `dev` | P0 still open |
| --- | --- | --- | --- |
| **Discover** | Branded book link + inquiry honesty | Public booking, growth preview | [#88](https://github.com/SimonShaun2/Renvani/pull/88) FS-38 idempotency/consent |
| **Book** | Request → hold → slot pick | Booking flow, hold tokens | [#89](https://github.com/SimonShaun2/Renvani/pull/89) hold inspect/resume |
| **Serve** | Dispatch board + field sync contract | Jobs, dispatch view, FS-87 doc, **#86 SSE merged** | — |
| **Repeat** | Maintenance reminder **candidates** (dry-run) | [#85](https://github.com/SimonShaun2/Renvani/pull/85) API merged | [#91](https://github.com/SimonShaun2/Renvani/pull/91) agent policy + worker stub |
| **Migrate** | Wizard: relational bundle + **chunked history** + price book/notes + file batch → R2; lineage + FS-72 candidates post-import | `import_sessions`, workers, R2 | Epic M1–**M8**; [#92](https://github.com/SimonShaun2/Renvani/pull/92); platform P0 parallel |

**Explicitly ⏸ post-MVP for winter demo:** FS-94 platform billing, FS-6 design partners GTM, **QuickBooks OAuth / Intuit dev app** (founder gate), live Jobber/ST API sync, FS-35 pilot rubric, autonomous customer SMS sends.

---

## 2. Migration / import (MVP-critical)

**Position:** **One engine** (`FS-MIGRATE`); vendors = **presets** only. See epic §2–§4.

| Requirement | Lead devs |
| --- | --- |
| Generic AI column match + XLSX | Iris, Marcus |
| Source presets (6 vendors) | Marcus, Noah ([#92](https://github.com/SimonShaun2/Renvani/pull/92) + `fs-migrate-source-presets`) |
| Multi-file relational bundle | Aria, Hana |
| Dedupe / merge preview | Diego |
| Normalize phone/date/money | Nina |
| Equipment + maintenance agreements | Omar, Ava |
| Open balances + **payments** history | Hana |
| **Price book** (items/services/materials) | Omar |
| **Notes** + **communications** history | Ben, Priya |
| **Estimates** + chunked multi-year jobs/invoices | Aria, Iris |
| `source_system` + `source_id` + original dates | Nina |
| Historical **report** exports | Leo |
| Post-import **reminder / reactivation** from history | Ava |
| Onboarding wizard (guided, resumable, per-chunk progress) | Priya, Leo, Ben |
| **File batch → R2** + attachment rows | Diego, Mila |
| **AI file-to-record** match (messy names/folders) | Marcus, Kai |
| Queue reliability + import observability | Hana, Iris, Ezra |
| Agent runtime parity for import jobs | Noah, Ava |
| Audit + tenant tests (tabular + attachments) | Aria, Sofia, Mila |
| QB OAuth | Ezra — founder gate only |

---

## 3. Ruthless P0 cut-line (Elena sign-off)

**In winter MVP:** dispatch SSE, public hardening, hold resume, loyalty **dry-run** candidates, import presets, tenant-safe public surfaces.  
**Out:** new paid vendors, ServiceTitan connector, points/loyalty marketplace, operator billing SKUs, env builds beyond `batch-ci`.

---

## 4. Parallel pod (16 devs — no idle pairs)

See `MVP-P0-ASSIGNMENTS.md` (updated tracker). Rule: when a PR merges, that row **immediately** picks the next open branch in §4 of assignments — no waiting for batch ceremony.

**Review discipline:** Request **Isaac + Lily + Sam** in GitHub **within 1h of push** @ full head SHA. `batch-ci` label only after triple PASS.

---

## 5. MVP-complete estimate (engineering, for merge reports)

Assuming **parallel P0 PRs** (#86–#91 + import presets) merge over the next **2–3 batch cycles** and no new scope:

| Milestone | Target (CT) | Definition |
| --- | --- | --- |
| **Demo-ready smoke** | **2026-11-07** | Script in §1 runnable on staging with one imported tenant |
| **Migration-ready MVP** | **2026-12-05** | M1–M3 + **M5 price book** + chunked history smoke: 2 sources, preview/commit/rollback, **≥50 files** to R2 (epic §6; +1 week vs 7:24 scope) |
| **Winter field-ready** | **2026-12-12** | M6–M8 (files, comms/reports, reminder/reactivation hook, large-tenant soak); hardening only otherwise |

*Slip risk:* Lily/Isaac queue on concurrent PRs, or FS-11 test repair > 2d — adds ~1 week.

---

## 6. Next merge train (suggested order)

1. **#86** — **merged** (`9313130`).  
2. **#88 → #89 → #90 → #91** — triple sign, `batch-ci`.  
3. **#93** epic — PO sign-off.  
4. **#92** + FS-MIGRATE implementation branches (M1 first).
