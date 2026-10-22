# FS-52 — Code-to-area gap map (Renvani)

**Notion:** [FS-52 — Code-to-area gap map of Renvani main (12b2322)](https://app.notion.com/p/400317b92d1581cc9bd4c84cb83c830f)  
**CI batch:** `BATCH-FS3-GROWTH-002`  
**Historical baseline (card):** `12b23226c0e0c199626940117fc7f0fa89f87375` + `docs/tickets/TICKET-001`..`TICKET-033`  
**Inventory head (this doc):** `dev` @ `7f1e6328e1a5ba54c7477b0cce0496502235f1e0` (post Batch 2 merge PR #36)  
**Growth-first lens:** prioritize Growth → Revenue → Retention surfaces that win direct demand; Operations/FSM depth is supporting SoR on the same repo.

## Area legend

| Area | Meaning |
|------|---------|
| **Growth** | Discovery, branded acquisition, local demand, website preview, job-source reporting |
| **Revenue** | Inquiry → estimate → invoice → payment; campaigns; public booking/approve/pay |
| **Operations** | Jobs, dispatch, field execution, catalog, time, assets |
| **Retention** | Reviews, agreements, follow-up automation, win-back hooks |
| **Command Center** | Owner visibility, AI recommendations, agent actions, reporting, tenant context |
| **Foundation** | Auth, imports, Stripe plumbing, attachments, shared config/types |

**Status:** `Works` = exercised in repo tests or documented green path; `Needs finishing` = partial UI/API or known defects; `Missing` = not present for v1 growth loop.

**Disposition:** `Keep` / `Refactor` / `Replace` / `Remove` per module.

---

## Cross-cutting (linked, not re-diagnosed)

| Issue | FS card | Link in this repo |
|-------|---------|-------------------|
| Next.js `/estimates/:id` vs public token collision | **FS-36** | `docs/planning/FS-38-pair2-web-ui-checklist.md`, `docs/contracts/revenue-agent-pair2-v0.1.md` |
| Seven stale-date API failures on baseline `12b2322` | **FS-2** (repair on PR #16) | Notion FS-2 QA notes; fixed on `dev` via Batch 1 **PR #27** |
| Import `/errors` contract tests (3 failures @ `7f1e632`) | **FS-11** (Batch 3 follow-up) | `apps/api/src/routes/imports/fs-11-import.contract.test.ts`, `imports.test.ts` — local run 2026-10-21: 330 passed / 3 failed |

---

## 1. API route modules (`apps/api/src/routes/*`)

| Module | Primary area | Status | Evidence | Disposition | FS / ticket |
|--------|--------------|--------|----------|-------------|-------------|
| `revenue-inquiries` | Revenue | Needs finishing | `revenue-inquiries` route tests on `dev`; FS-10 Batch 2 PR #31 | Refactor | **FS-10**, **FS-18** |
| `reporting` | Growth / Command Center | Needs finishing | `reporting` routes; job-source reporting spec **FS-22** | Refactor | **FS-22** |
| `booking` | Growth / Revenue | Works | `booking.test.ts` | Keep | **FS-21**, TICKET-025 |
| `public` (estimates, pay, reviews, booking) | Revenue | Needs finishing | Public pay/review tests; estimate path tied to **FS-36** | Refactor | **FS-36**, **FS-19** |
| `campaigns` | Retention / Growth | Works | `campaign.service.test.ts` | Keep | TICKET-030 |
| `estimates` | Revenue | Works | `estimate.service.test.ts`, `estimates.test.ts` (green @ `7f1e632`) | Keep | TICKET-019 |
| `invoices` | Revenue | Works | `invoice.service.test.ts` | Keep | TICKET-019 |
| `review-requests` | Retention | Works | `phase2-operations.service.test.ts` | Keep | TICKET-027 |
| `imports` | Foundation | Needs finishing | 3 failing tests on error payload shape | Refactor | **FS-11**, TICKET-032 |
| `agent-actions` | Command Center | Needs finishing | Agent control plane types; execute path gated **FS-12** | Refactor | **FS-12**, **FS-37** |
| `tenant-context` | Foundation | Works | `tenant-context` contract tests (Batch 2) | Keep | **FS-37** |
| `ai` | Command Center | Works | AI route + worker integration | Keep | TICKET-033 |
| `dispatch` | Operations | Works | Dispatch tests / board UI | Keep | TICKET-016 |
| `jobs` | Operations | Works | `job.service.test.ts` | Keep | TICKET-018 |
| `customers` | Operations | Works | `customer-graph.service.test.ts` | Keep | TICKET-017 |
| `properties` | Operations | Works | Covered via customer graph tests | Keep | TICKET-017 |
| `assets` | Operations | Works | Asset routes in API suite | Keep | TICKET-017 |
| `products` | Operations | Works | `product-catalog.service.test.ts` | Keep | TICKET-014a |
| `technicians` | Operations | Works | `technician.service.test.ts` | Keep | TICKET-014 |
| `technician-extensions` | Operations | Works | Extension routes in API suite | Keep | TICKET-014 |
| `time` | Operations | Works | Time entry routes | Keep | TICKET-020 |
| `job-engagement` | Operations | Works | Engagement routes | Keep | unverified |
| `message-logs` | Revenue / Retention | Works | Messaging audit | Keep | TICKET-028 |
| `service-agreements` | Retention | Works | `service-agreement.service.test.ts` | Keep | TICKET-026 |
| `automation-rules` | Command Center | Works | `automation-rules.test.ts` | Keep | TICKET-029 |
| `activity-events` | Foundation | Works | Event stream writes in services | Keep | AGENTS.md law |
| `attachments` | Foundation | Works | Attachment routes | Keep | TICKET-031 |
| `auth` | Foundation | Works | `auth.service.test.ts` | Keep | TICKET-001 |
| `company` | Foundation | Works | Company settings routes | Keep | TICKET-001 |
| `stripe` | Foundation | Needs finishing | Connect service tests; live money gated | Keep | TICKET-019 |
| `shared` | Foundation | Works | Shared route helpers | Keep | — |

---

## 2. Web routes (`apps/web/app/**/page.tsx`)

Grouped by URL intent (71 `page.tsx` files @ `7f1e632`).

| Route group | Example paths | Area | Status | Evidence | Disposition | FS / ticket |
|-------------|---------------|------|--------|----------|-------------|-------------|
| Growth preview | `(app)/growth/website-preview/[slug]` | Growth | Works | Batch 2 **FS-58** / PR #29 on `dev` | Keep | **FS-58**, **FS-31** |
| Public branded site | `(public)/site/[slug]` | Growth | Works | Public site page present | Keep | **FS-31** |
| Public booking | `(public)/book/[slug]/*` | Growth → Revenue | Works | Booking flow pages | Keep | **FS-21** |
| Public approve / pay / review | `(public)/approve`, `pay`, `review` | Revenue | Needs finishing | **FS-36** collision on staff `/estimates/[id]` vs legacy public estimate path | Refactor | **FS-36**, **FS-19** |
| Revenue ops UI | `(app)/estimates`, `invoices`, `review-requests` | Revenue | Works | Page files + API tests | Keep | TICKET-019 |
| Command Center | `(app)/dashboard`, `reporting`, `ai-revenue-center` | Command Center | Needs finishing | Dashboard TICKET-015; reporting ↔ **FS-22** incomplete | Refactor | **FS-22**, TICKET-015 |
| Operations | `(app)/jobs`, `customers`, `dispatch`, `products` | Operations | Works | TICKET-016–018 UI | Keep | TICKET-016–018 |
| Onboarding / import UI | `(app)/onboarding/import`, `settings/import` | Foundation | Works | Import wizard TICKET-032 | Keep | TICKET-032, **FS-11** |
| Settings / automation | `(app)/settings/*` | Command Center | Works | Settings pages | Keep | TICKET-025 |
| Mobile field | `(mobile)/mobile/*` | Operations | Works | Technician mobile shell | Keep | TICKET-020 |
| Auth | `(auth)/login`, `signup` | Foundation | Works | Auth pages | Keep | TICKET-001 |

---

## 3. Worker processors (`apps/worker/src/processors/*`)

| Processor | Area | Status | Evidence | Disposition | FS / ticket |
|-----------|------|--------|----------|-------------|-------------|
| `ai-revenue.processor` | Growth / Command Center | Works | `ai-revenue.processor.test.ts` | Keep | TICKET-033 |
| `csv-import.processor` | Foundation | Works | `csv-import.processor.test.ts` | Keep | TICKET-032 |
| `notifications.processor` | Revenue / Retention | Works | `notifications.processor.test.ts`; URLs must track **FS-36** | Refactor | **FS-36** |
| `invoice-reminder.processor` | Revenue | Works | `invoice-reminder.processor.test.ts` | Keep | TICKET-019 |
| `agreements.processor` | Retention | Works | `agreements.processor.test.ts` | Keep | TICKET-026 |
| `retention-gates.processor` | Retention | Needs finishing | Enqueue-only; feature flags off; factory not wired (**FS-28** Batch 2) | Refactor | **FS-28**, **FS-14** |
| *(missing)* `operator-proposals.processor` | Command Center | Missing | No G-owned factory worker on `dev` | Replace (add) | **FS-14**, **FS-3** |

---

## 4. Schema tables (`packages/db/src/schema.ts`)

| Table | Area | Status | Evidence | Disposition | FS / ticket |
|-------|------|--------|----------|-------------|-------------|
| `companies`, `users`, `refresh_tokens` | Foundation | Works | Migrations apply @ `7f1e632` | Keep | TICKET-001 |
| `customers`, `properties`, `assets` | Operations | Works | Customer graph tests | Keep | TICKET-017 |
| `jobs`, `job_notes`, `job_photos`, `job_tasks`, `job_products` | Operations | Works | Job service tests | Keep | TICKET-018 |
| `technicians`, `schedule_slots`, `time_entries` | Operations | Works | Dispatch / time tests | Keep | TICKET-016, 020 |
| `estimates`, `estimate_items` | Revenue | Works | Estimate tests | Keep | TICKET-019 |
| `invoices`, `invoice_items`, `payments` | Revenue | Works | Invoice tests | Keep | TICKET-019 |
| `booking_requests`, `booking_settings` | Growth / Revenue | Works | `booking.test.ts` | Keep | **FS-21** |
| `campaigns`, `campaign_recipients` | Retention | Works | Campaign tests | Keep | TICKET-030 |
| `review_requests` | Retention | Works | Phase2 operations tests | Keep | TICKET-027 |
| `maintenance_plans`, `maintenance_visits`, `service_agreement_templates` | Retention | Works | Service agreement tests | Keep | TICKET-026 |
| `automation_rules` | Command Center | Works | Automation route tests | Keep | TICKET-029 |
| `ai_recommendations` | Command Center | Works | AI revenue tests | Keep | TICKET-033 |
| `activity_events` | Foundation | Works | Emitted across services | Keep | AGENTS.md |
| `import_sessions` | Foundation | Works | Import processor tests | Keep | TICKET-032 |
| `message_logs` | Revenue | Works | Notification processor | Keep | TICKET-028 |
| `form_templates`, `form_submissions` | Operations | **Missing** | Drizzle tables + migrations @ `7f1e632`; no `apps/api` routes or web pages reference them (repo grep 2026-10-21). Out of growth-first v1 — optional field/checklist module deferred to Sprint 6 | Keep | **FS-50** (P5 Optional Suite audit) |
| `product_catalog` | Operations | Works | Product catalog tests | Keep | TICKET-014a |
| `file_attachments`, `on_the_way_notifications` | Operations | Works | Attachment / OTW flows | Keep | TICKET-031 |
| `agent_actions` | Command Center | Needs finishing | FS-12 state machine incomplete | Refactor | **FS-12** |
| `operator_proposals` | Command Center | **Missing** | Preflight only (**FS-3** ADR) | Replace (add) | **FS-3**, **FS-14** |
| `growth_check_sessions` (Growth Check SoR) | Growth | **Missing** | [Growth Check internal spec](https://app.notion.com/p/400317b92d158135a8cbe09f0ce50e24); no `growth_check_*` tables in `schema.ts` @ `7f1e632` | Replace (add) | **FS-53** (epic **FS-45**) |

---

## 5. Package-level disposition (TICKET-001..033 alignment)

| Package / app | Primary areas | Disposition | One-line rationale |
|---------------|---------------|-------------|-------------------|
| `apps/web` (growth + public) | Growth, Revenue | **Refactor** | Growth preview shipped; finish **FS-36** public paths and **FS-22** reporting UX |
| `apps/api` (inquiry + reporting) | Growth, Revenue | **Refactor** | Batch 2 revenue inquiry slice; tighten contracts (**FS-10**, **FS-11**) |
| `apps/api` (core FSM) | Operations | **Keep** | Mature TICKET-014–020 coverage |
| `apps/worker` | All | **Refactor** | Add operator factory worker; wire retention gates to approvals |
| `packages/db` | Foundation | **Refactor** | Add control-plane + growth SoR tables when **FS-3** / Growth Check Ready |
| `packages/ai` | Command Center | **Keep** | Supports revenue intelligence, not a separate product |
| `packages/types` | Foundation | **Keep** | Extend for agent-control-plane + pair4 contracts |
| `apps/webhook` | Foundation | **Keep** | Stripe/Twilio ingress; no new external integrations in Batch 3 |

---

## 6. Growth-first gaps (no duplicate FS cards)

| Gap | Area | Proposed card |
|-----|------|----------------|
| Growth Check grader SoR + staff workflow | Growth | **FS-53** implements DDL/queue/intake under epic **FS-45** ([Growth Check spec](https://app.notion.com/p/400317b92d158135a8cbe09f0ce50e24)) — do not open duplicate |
| Job-source / funnel date-range caps | Growth | **FS-22** (Batch 3 slot) |
| Operator approval inbox + proposals DDL | Command Center | **FS-14** + **FS-3** |
| Public estimate URL contract | Revenue | **FS-36** |
| Import error API contract | Foundation | **FS-11** |

---

## 7. Verification performed for this document

| Command | Result @ `7f1e632` worktree |
|---------|------------------------------|
| `cd apps/api && pnpm test` | 330 passed, **3 failed** (import `/errors` — see **FS-11**) |
| Route inventory | `apps/api/src/routes/*` (31 modules), 71 web `page.tsx` files |
| Schema inventory | `packages/db/src/schema.ts` application tables (see §4) |

---

## 8. Review sign-off (pending)

| Role | Action |
|------|--------|
| Reviewer | ACK map at PR head SHA |
| QA | ACK test evidence citations (no new diagnosis of **FS-36** / **FS-2**) |
