# Shortest path — demoable, migration-ready MVP (winter 2026)

**Authority:** Founder urgency 2026-10-22 **7:18 PM CT** (winter buying window) · **PO:** Elena · **Tech Lead:** Grace  
**North star:** A prospect can **AI-guided import** from Jobber / Housecall Pro / ServiceTitan / **QuickBooks** (CSV exports first), run **Discover → Book → Serve → Repeat** in one tenant, and see dispatch + retention signals in a single demo — **no live FSM API sync** until founder approves OAuth (ADR-FS-41). Detail: `MVP-MIGRATION-AI-IMPORT.md`.

---

## 1. Demo script (minimum viable walkthrough)

| Stage | What we show | P0 already on `dev` | P0 still open |
| --- | --- | --- | --- |
| **Discover** | Branded book link + inquiry honesty | Public booking, growth preview | [#88](https://github.com/SimonShaun2/Renvani/pull/88) FS-38 idempotency/consent |
| **Book** | Request → hold → slot pick | Booking flow, hold tokens | [#89](https://github.com/SimonShaun2/Renvani/pull/89) hold inspect/resume |
| **Serve** | Dispatch board + field sync contract | Jobs, dispatch view, FS-87 doc merged | [#86](https://github.com/SimonShaun2/Renvani/pull/86) SSE + poll fallback |
| **Repeat** | Maintenance reminder **candidates** (dry-run) | [#85](https://github.com/SimonShaun2/Renvani/pull/85) API merged | [#91](https://github.com/SimonShaun2/Renvani/pull/91) agent policy + worker stub |
| **Migrate** | AI-guided import wizard (upload → map → preview → commit → rollback) | `import_sessions` + worker + UI | [#92](https://github.com/SimonShaun2/Renvani/pull/92) presets; **QB customers/items/invoices** phases P0a–c |

**Explicitly ⏸ post-MVP for winter demo:** FS-94 platform billing, FS-6 design partners GTM, **QuickBooks OAuth / Intuit dev app** (founder gate), live Jobber/ST API sync, FS-35 pilot rubric, autonomous customer SMS sends.

---

## 2. Migration / import (MVP-critical)

**Position:** Generic CSV import **ships**; winter deals require **credible migration** from **four** incumbent stacks (FSM + QuickBooks).

| Requirement | Approach | Owner pod |
| --- | --- | --- |
| **AI-guided workflow** | Upload → AI/heuristic map → preview → commit → audit events → rollback | Elena narrative; Grace coordinates |
| Export-only (no API sync) | ADR-FS-41 + `fsm.data-import.v1` | Foundation |
| Jobber / HCP / ST / **QB** **header presets** | Presets per entity (customers, items, invoices) before AI mapping | Marcus + Noah ([#92](https://github.com/SimonShaun2/Renvani/pull/92)) |
| **QB items + invoice/payment history** | P0b/P0c worker + `entityType` paths | Aria + Kai + Hana |
| Import UI vendor + entity steps | On-brand copy + source picker | Priya + Leo (after [#88](https://github.com/SimonShaun2/Renvani/pull/88)) |
| Demo dataset | Golden CSV per vendor × entity | Kai |
| Rollback story | `importSessionId` + sales script | Aria |
| FS-11 `/errors` contract tests | 3 failing tests | Iris |
| QB OAuth connect | **Founder gate** — no dev account without OK | Ezra documents; **no build** until approved |

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
| **Migration-ready MVP** | **2026-11-21** | FSM + **QB customer** presets; QB items/invoices P0b/c in preview; rollback proven; FS-11 tests green |
| **Winter field-ready** | **2026-12-05** | Hardening only; no new modules without Elena + founder |

*Slip risk:* Lily/Isaac queue on concurrent PRs, or FS-11 test repair > 2d — adds ~1 week.

---

## 6. Next merge train (suggested order)

1. **#86** @ `6ca557f` — after **Lily PASS** (Isaac PASS + Sam ACCEPT recorded).  
2. **#88 → #89 → #90 → #91** — triple sign @ heads, `batch-ci`, head SHA guard.  
3. **Import presets PR** — same flow, then FS-11 test fix PR.
