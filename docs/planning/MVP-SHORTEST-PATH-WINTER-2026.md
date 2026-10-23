# Shortest path — demoable, migration-ready MVP (winter 2026)

**Authority:** Founder urgency 2026-10-22 **7:18 PM CT** (winter buying window) · **PO:** Elena · **Tech Lead:** Grace  
**North star:** **One generic AI importer** (CSV/XLSX) with **source presets** (Service Fusion, Jobber, ST, HCP, QB Online/Desktop) migrates a tenant; then **Discover → Book → Serve → Repeat** in one demo. Epic: `MVP-MIGRATION-EPIC-FS-MIGRATE.md`. No live API sync until founder approves OAuth (ADR-FS-41).

---

## 1. Demo script (minimum viable walkthrough)

| Stage | What we show | P0 already on `dev` | P0 still open |
| --- | --- | --- | --- |
| **Discover** | Branded book link + inquiry honesty | Public booking, growth preview | [#88](https://github.com/SimonShaun2/Renvani/pull/88) FS-38 idempotency/consent |
| **Book** | Request → hold → slot pick | Booking flow, hold tokens | [#89](https://github.com/SimonShaun2/Renvani/pull/89) hold inspect/resume |
| **Serve** | Dispatch board + field sync contract | Jobs, dispatch view, FS-87 doc, **#86 SSE merged** | — |
| **Repeat** | Maintenance reminder **candidates** (dry-run) | [#85](https://github.com/SimonShaun2/Renvani/pull/85) API merged | [#91](https://github.com/SimonShaun2/Renvani/pull/91) agent policy + worker stub |
| **Migrate** | **FS-MIGRATE** wizard: multi-file bundle, AI map, dedupe, normalize, preview, rollback | `import_sessions` + worker shell | Epic M1–M5; [#92](https://github.com/SimonShaun2/Renvani/pull/92) preset catalog |

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
| Open balances | Hana |
| Onboarding wizard (guided, resumable, AI copy) | Priya, Leo, Ben |
| Audit + tenant tests | Sofia, Mila |
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
| **Migration-ready MVP** | **2026-11-28** | FS-MIGRATE M1–M3: 2 sources + multi-file preview/commit/rollback (slip +1 week for epic scope) |
| **Winter field-ready** | **2026-12-05** | Hardening only; no new modules without Elena + founder |

*Slip risk:* Lily/Isaac queue on concurrent PRs, or FS-11 test repair > 2d — adds ~1 week.

---

## 6. Next merge train (suggested order)

1. **#86** — **merged** (`9313130`).  
2. **#88 → #89 → #90 → #91** — triple sign, `batch-ci`.  
3. **#93** epic — PO sign-off.  
4. **#92** + FS-MIGRATE implementation branches (M1 first).
