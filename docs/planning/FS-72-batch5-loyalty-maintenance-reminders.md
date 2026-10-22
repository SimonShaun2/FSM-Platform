# FS-72 — Renvani loyalty: maintenance plans and service-history reminders (Batch 5)

**Batch:** `BATCH-FS5-RETENTION-004` (proposed)  
**Ticket:** FS-72  
**Status:** Draft — **docs / product spec only** until PM marks Ready for implementation  
**Authority:** Founder direction (Shaun, 2026-10-21) — recorded by Product Owner  
**Agent:** `bc-0da9c117-da01-40c1-9d2a-29957eaa548f`

---

## 1. Product decision (what “loyalty” means in Renvani)

**Renvani loyalty** is **operational retention**, not a consumer loyalty program:

- **Maintenance plans** (recurring service agreements) as the primary subscription anchor.
- **Service-history-driven reminders** that nudge the right next visit at the right time.
- **Closed-loop attribution** from a reminder touchpoint through to a **paid invoice** in Renvani SoR.

### Explicit non-goals (v1 / Batch 5 scope boundary)

| Out of scope | Notes |
| --- | --- |
| Points, tiers, punch cards, or rewards marketplace | Not a “loyalty program” SKU |
| Branded consumer mobile app | Web + operator Command Center only; no App Store loyalty app |
| Live SMS/email to customers | **Blocked** until founder approves real sends (see §7) |
| External FSM sync | Import-only SoR per [ADR-FS-41](../adr/ADR-FS-41-renvani-sor-integrations-addendum.md) |

---

## 2. Objective

Design and (in a later implementation slice) deliver a **retention loyalty layer** that:

1. Uses **`maintenance_plans`**, **`maintenance_visits`**, **`assets`**, **`jobs`**, and **`activity_events`** as inputs.
2. Produces **draft reminder proposals** (operator-approved) for eligible customers.
3. Records **reminder → job/visit → invoice → payment** attribution for reporting (extends **FS-22** job-source / outcome instrumentation).
4. Respects **consent and policy** via **FS-13** (implementation track: Renvani PR **#51**).

---

## 3. Scope

### 3.1 Reminder rule families (in scope)

| Rule family | Signal (SoR) | Example use (residential cleaning) |
| --- | --- | --- |
| **Plan cadence** | Active `maintenance_plans` + `nextServiceDate` / visit schedule | “Your quarterly clean is due” |
| **Asset age** | `assets` install/manufacture or inferred age + last service | “System / carpet care interval” |
| **Last-service interval** | Last completed `job` per customer/property/asset | “It’s been N days since your last visit” |
| **Seasonal / weather triggers** | Configurable season windows + optional external **read-only** weather hint (worker) | “Pre-summer deep clean” — **no auto-send**; rule fires candidate only |
| **Lapsed reactivation** | No completed job / no plan renewal within threshold | Win-back draft (align with **FS-28** touchpoints) |

Rules produce **candidates** only; nothing is customer-visible until operator approval and send gates clear.

### 3.2 Touchpoints (retention outcome area)

- Reuse and extend existing retention modules where gap map rates **Works** (campaigns, review requests, maintenance plan tables).
- New loyalty-specific entities (if needed) are **additive** and scoped to `companyId`; prefer metadata on existing `activity_events` + proposal factory patterns (**FS-14**, **FS-28**) before new tables.
- Command Center surfaces: proposed reminder, reason codes, evidence (last job id, plan id, asset id), and **projected revenue** (estimate optional — not required for Batch 5 docs).

### 3.3 Attribution contract (required)

Every accepted reminder proposal that converts must support:

| Stage | Stored reference |
| --- | --- |
| Reminder proposed | `activity_event` + proposal id / agent action id |
| Reminder approved/sent (when enabled) | message log id (queued only until founder gate) |
| Booking / job created | `jobId`, optional `maintenanceVisitId` |
| Invoice paid | `invoiceId`, `payment` / Stripe webhook id |

**Attribution key:** `loyaltyReminderId` (or equivalent) carried from proposal metadata through job and invoice `metadata` / job-source fields consumable by **FS-22** reporting.

---

## 4. Dependencies

| Dependency | Why | Gate |
| --- | --- | --- |
| **Maintenance plans** (`maintenance_plans`, visits, Stripe subscription hooks) | Plan cadence and renewal reminders | Schema on `dev`; no live Stripe required for dry-run |
| **FS-28** retention gates | Post-service + win-back enqueue patterns, dry-run defaults | Merged or in-flight Batch 2/3 retention work |
| **FS-14** operator approval inbox | Human approve/edit/reject before any outbound | Batch 4 **FS-14** |
| **FS-13** consent / policy engine | Per-channel consent, suppression, policy version on decision | Batch 4 **FS-13** · track **PR #51** |
| **FS-12** agent actions | Typed tools for `reminder.propose` / execute path | Batch 4 **FS-12** |
| **FS-8** threat model + negatives | Outbound abuse, cross-tenant, stale consent | Security PASS on send enablement |
| **FS-22** job source / outcomes | Report reminder-attributed revenue | Batch 2 **FS-64** / reporting slice |

**Soft:** **FS-9** design for Command Center copy; **FS-35** pilot rubric for measuring repeat revenue lift (diagnostic only).

---

## 5. Acceptance criteria

### 5.1 Documentation slice (this ticket — Batch 5 entry)

| AC | Evidence |
| --- | --- |
| D-1 | This spec published on `dev` via approved docs PR |
| D-2 | Non-goals (no points app, no mobile app) explicit in §1 |
| D-3 | Rule families + attribution contract in §3 |
| D-4 | Dependency table maps to FS-13 (#51), FS-14, FS-28, maintenance schema |
| D-5 | Founder send gate documented in §7 |
| D-6 | PO ACK on spec; Security ACK before implementation batch |

### 5.2 Implementation slice (future — not claimed by docs-only PR)

| AC | Evidence |
| --- | --- |
| I-1 | Worker evaluates rules tenant-scoped; idempotent per `(companyId, customerId, ruleId, window)` |
| I-2 | Candidates create **FS-14** inbox items with provenance; no Twilio/SendGrid until §7 lifted |
| I-3 | **FS-13** policy check on every propose path; revoked consent blocks queue |
| I-4 | Unit tests: tenant isolation, consent block, lapsed vs active plan, interval math |
| I-5 | Integration test: proposal metadata → job → invoice marks attribution fields |
| I-6 | Feature flag `loyaltyRemindersEnabled` default **false**; `loyaltyRemindersDryRun` default **true** until founder approval |
| I-7 | Activity events for `loyalty.reminder_proposed`, `loyalty.reminder_approved`, `loyalty.reminder_converted` (names subject to FS-3 enum ADR) |

---

## 6. Engineering notes (implementation batch — preview)

- **No business logic in Next.js pages** — rules in service layer; async evaluation in **BullMQ** (`fsm:agreements` or dedicated `fsm:retention` queue per Tech Lead).
- **Weather / seasonal:** v1 may use static season calendars per company; external weather API is optional read-only adapter behind feature flag — not required for first merge.
- **Stripe:** plan renewal reminders may reference subscription state; do not call Stripe except via existing webhook paths.

---

## 7. Founder gate — real customer sends

Until **Shaun explicitly approves** real outbound loyalty reminders:

- All customer-facing copy remains **draft / preview** in Command Center.
- Workers and execute paths stay **`dryRun: true`** or proposal-only (same class of gate as **FS-28** and pre–FS-8 SMS).
- Enabling live send requires: **FS-13** merged, **FS-14** live, Security negative tests at exact head, founder sign-off recorded on this card and in `@fsm/config` feature flags.

---

## 8. Batch 5 staging (PM/CoS)

| Field | Value |
| --- | --- |
| Batch ID | `BATCH-FS5-RETENTION-004` |
| Lane | Retention Agent |
| Area | Retention |
| Phase | P4 Retention & Owner |
| Suggested pairing | Pair 4 (Dev G inbox + Dev H retention services) — assign at dispatch |
| Docs-only entry | This file + Notion board card **FS-72** |

---

## 9. Reviewers

1. **Product Owner** — loyalty definition vs non-goals; attribution for repeat revenue story  
2. **Security** — consent, suppression, send gate, tenant isolation on rule evaluation  
3. **Tech Lead** — schema/event additions vs FS-3 AF-V1E additive rule  
4. **E.. CoS** — Batch 5 roster slot when Batch 4 merge gate clears
