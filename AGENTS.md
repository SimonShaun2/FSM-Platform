# AGENTS.md
# FSM Platform V2 — Controlling Operating Document

**This file governs how every team member operates in this repository. Read it in full
before changing anything.**

**Version:** 2.0 — supersedes all prior versions of this file.
**Authority:** `MASTER_PRODUCT_SPEC.md` (FSM Platform V2 Master Directive).
Where this file and the master directive conflict, the master directive wins.

---

## 0. What Changed in V2 — Read This First

If you have prior context on this repository, the following is **retired**. Do not act on it.

| Retired | Replaced by |
|---|---|
| "Thinner system, smarter brain" | **"Complete when needed. Simple by default."** |
| Agent 1 / 2 / 3 / 4 model | Fifteen-member permanent team — `TEAM.md` |
| Agent 4 sole-approval gate | Risk-based approval matrix — `TEAM.md` §5 |
| Phase 1A / 1B / 1C / 2 / 3 | Sprint 0–22 — `SPRINT_ROADMAP.md` |
| `TICKET-NNN` | `FSM-NNNN` — `tickets/INDEX.md` |
| "That's v2" as a scope refusal | Assign to a sprint, or gate behind progressive disclosure |
| Founder approval between tickets | Autonomous operating loop — `TEAM.md` §6 |

The engineering principles in §5 below are **retained from V1** and remain repo law.
They were sound. The team structure and product boundary around them were not.

---

## 1. What This Product Is

A complete, modern, AI-enabled Field Service Management platform for service businesses.

Full lifecycle: **Lead → Customer → Estimate → Approval → Job → Schedule → Dispatch →
Technician → Field Work → Invoice → Payment → Follow Up → Review → Membership →
Recurring Service → Marketing → Reporting → Retention.**

It must serve, from one codebase and without an architectural rebuild:

1. A single owner-operator
2. Small field service companies
3. Growing multi-crew organisations
4. Organisations of roughly 50 operating units, technicians, crews or vehicles
5. Multi-location businesses
6. Larger organisations

This is production software. Not a prototype. Not a demo. Every feature must work in
production.

---

## 2. Product North Star

> **Complete when needed. Simple by default.**

The platform may become functionally deep. The interface must not *feel* deep unless the
user needs that depth. A one-person plumbing company must not feel like it is operating
enterprise software. A 50-unit operation must not feel like it has outgrown small-business
software. Both run the same platform.

### Primary differentiator: Complexity On Demand

Advanced capability appears when the company enables it, the user's role requires it, the
workflow requires it, or the organisation reaches additional operational complexity.

Do not solve feature growth by adding permanent navigation items. Use role-based
interfaces, feature modules, contextual actions, command/search, saved workspaces,
configurable dashboards, permission-based navigation, progressive configuration, smart
defaults, and industry templates.

### Scope test

The V1 test — *"does this make the system thicker without making the brain smarter?"* — is
retired. It caused correct features to be rejected.

The V2 test is: **does this add capability without adding default-path complexity?**
If a feature is needed by some customers, it belongs in the platform. The question is never
*whether* to build it — it is which sprint owns it and how progressive disclosure keeps it
out of the way of customers who do not need it.

---

## 3. UX Is an Engineering Requirement

Ease of use is a product requirement, not decoration. Two surfaces receive first-class
attention: the **office experience** (scheduling, dispatch, CRM, estimates, invoicing,
communications, reporting) and the **field worker experience** (today's work, job info,
navigation, history, status, photos, forms, time, materials, estimates, invoices,
signatures, payments, completion).

### Office UX

Dispatchers may touch the system hundreds of times a day. Optimise for speed: fast job
creation and customer lookup, drag-and-drop scheduling, fast rescheduling, keyboard
navigation, bulk operations, context menus, inline editing, persistent filters, saved
views, global search, minimal modal dependency, safe autosave, real-time schedule updates,
clear conflict and availability indicators, clear unscheduled and priority queues, and no
unnecessary page navigation.

### Field UX

Assume the technician is wearing gloves, outdoors, on poor cellular service, moving between
jobs, and not technically sophisticated. They should not need to understand the office
software.

Ideal primary flow:

```
Open App → See Next Job → Navigate → On My Way → Arrive → Start
        → Perform Work → Document → Present Options → Capture Approval
        → Complete → Take Payment → Next Job
```

Avoid deep nesting. Never require the same information twice. Large touch targets for core
status actions. Offline and unstable-network behaviour is designed deliberately, not
discovered in the field.

### Measured UX

Design and engineering actively reduce: task completion time, interaction count, navigation
depth, error frequency, training required, mobile completion time, user backtracking, and
duplicate entry.

---

## 4. Non-Negotiable Core Principles

1. **Backend owns all business logic.** No business logic in the frontend. Ever.
2. **Every state change emits an activity event.** No exceptions.
3. **All money flows through Stripe.** No manual payment state outside Stripe webhook handlers.
4. **Background workers handle async work.** No long-running operations in request handlers.
5. **Multi-tenant by default.** Every query scoped to the tenant. No cross-tenant leakage.
6. **TypeScript strict everywhere.** No `any`. No `@ts-ignore`.
7. **Zod validates all inputs.** Bodies, params, env vars — validated at the boundary.
8. **Errors are explicit.** No silent failures. No swallowed exceptions.
9. **AI recommends; deterministic services decide.** AI never owns financial state, payment
   state, job completion state, or permissions. AI outputs never silently change
   authoritative state.

---

## 5. Engineering Principles (Retained — Repo Law)

The software must be maintainable, extensible, and safe to iterate on. We must be able to
fix bugs, change workflows, add fields, add modules and extend features without rewriting
large parts of the system.

**1. Modular domain services.** Each domain has its own service boundary. One feature must
not require editing unrelated domains. Domain services own their data and do not reach into
another service's internals. Cross-domain needs go through explicit service calls or events.

**2. Thin route handlers.** A handler does exactly four things: validate input, read auth
and tenant context, call a service function, return a response. No database queries, no
business logic, no business-rule branching in handlers.

**3. Event-driven state changes.** Every meaningful state change emits an activity event.
AI, notifications, analytics and automations subscribe to events rather than being hardcoded
into core workflows. New consumers are additive and do not modify the emitter.

**4. Background jobs for async work.** Anything over ~100ms or calling an external API
belongs in a worker. Workers are idempotent and safe to retry.

**5. Stable domain models.** Entities are modelled on the real FSM domain, not on the
current UI. Shortcut schemas that only support today's screen are not acceptable. Extend
the model cleanly rather than hacking around it.

**6. Replaceable integrations.** Stripe, Twilio, SendGrid, OpenAI and R2 are wrapped in
adapters. Vendor calls are isolated to adapter files. A vendor change touches the adapter
only.

**7. Typed contracts.** Strict TypeScript and shared Zod schemas define all API inputs and
outputs. Frontend calls typed clients and never duplicates backend logic. Shared types live
in `@fsm/types`. Response shapes are explicit, not inferred from database rows.

**8. Small, testable units.** Every service function is testable without standing up the
whole application. A function that is hard to test is doing too much.

**9. No hidden coupling.** Frontend components never depend on database row shapes. Modules
do not reach into each other. Two services needing the same data share a type, not a query.

**10. Feature flags for staged rollout.** New AI behaviour, automation, payment logic and
dispatch experiments must be enable-able and disable-able without breaking the system. Flag
toggles never require a migration.

**11. Modular architecture, not microservices.** Strong domain boundaries without
operational complexity for its own sake. Split infrastructure only where independent
scaling, security or failure isolation justifies it.

---

## 6. Technology Baseline

Treat as the starting architecture. This is **not** permission to rewrite the stack.

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + React |
| Backend API | Node.js + Fastify |
| Database | PostgreSQL + Drizzle ORM |
| Background jobs | Redis + BullMQ |
| Payments | Stripe (Connect, Terminal) |
| SMS | Twilio |
| Email | SendGrid |
| AI | OpenAI |
| File storage | Cloudflare R2 |
| Package manager | pnpm workspaces |
| Language | TypeScript (strict) |
| Testing | Vitest (unit/integration) + Playwright (E2E) |
| Deployment | Railway |

Stack changes require an ADR from TL-01 showing: problem, current approach, proposed
approach, benefit, migration cost, operational impact, security impact, alternatives
considered, decision. See `docs/adr/`.

---

## 7. Repository Structure

```
/apps
  /web       → Next.js frontend
  /api       → Fastify backend
  /worker    → BullMQ background processor
  /webhook   → Inbound webhook receiver

/packages
  /db        → Drizzle schema (src/schema.ts), migrations, seeds
  /types     → Shared TypeScript types and Zod schemas
  /ai        → Prompts and AI service functions
  /jobs      → BullMQ queue definitions
  /config    → Env validation, constants, feature flags

/docs
  /adr       → Architecture Decision Records
/tickets     → FSM-NNNN implementation tickets + INDEX.md
```

The authoritative schema is **`packages/db/src/schema.ts`** and nothing else. Any duplicate
schema file elsewhere in the repository is a defect — see `PROJECT_STATE.md` BD-001.

Internal packages import as `@fsm/db`, `@fsm/types`, `@fsm/ai`, `@fsm/jobs`, `@fsm/config`.

---

## 8. Data Rules

- All tables carry `id` (UUID), tenant scope, `createdAt`, `updatedAt`, `deletedAt`.
- All deletes are soft deletes. Never `DELETE FROM` in application code.
- Every query filters by tenant, enforced in the service layer, never the route layer.
- Migrations are generated by `drizzle-kit`. Never hand-edit an applied migration.
- Transactions wrap any operation writing to more than one table.
- `activity_events` receives an insert on every meaningful state change.
- Monetary values are stored and transported as strings. Never parse money to float.

---

## 9. Money Is Never One Number

These are separate, independently auditable concepts. Never collapse them into a single
ambiguous percentage:

1. Stripe processing cost
2. Business card surcharge
3. FSM Platform application fee
4. FSM Platform subscription price
5. Business invoice total
6. Tax
7. Tips
8. Membership charges

**Card surcharging is OFF by default.** Where a business enables it, the engine computes the
*lowest permitted amount* under all applicable constraints — card type, network, payment
method, merchant cost of acceptance, network cap, jurisdiction, provider rules, disclosure
requirements, and debit/credit classification. A business configuring 5% must never produce
an illegal or network-prohibited 5% surcharge. Debit is not credit. Do not invent loopholes
around network rules. Every surcharge decision writes an audit trail: configured
percentage, permitted percentage, applied percentage, dollar amount, card classification,
rule version, jurisdiction, disclosure version, transaction ID.

---

## 10. Security

Tenant isolation · role-based access · least privilege · secure authentication · token
security · MFA readiness · rate limiting · encryption · secrets management · webhook
signature verification · payment security · input validation · audit trails · secure file
uploads · malware considerations · dependency scanning · session management · data export
controls · support impersonation auditing. Sensitive actions require explicit authorisation.

---

## 11. Accessibility

Target WCAG 2.2 AA where practical. Accessibility belongs to the design system: keyboard
support, focus management, contrast, readable typography, accessible forms, clear error
messages, adequate touch targets, screen reader semantics.

---

## 12. Performance

The product must feel fast. Performance budgets are defined and enforced for page
navigation, customer search, dispatch board, schedule interaction, job opening, mobile job
data, payment initiation, critical API endpoints, search and reporting. Added features must
not gradually degrade basic FSM workflows.

---

## 13. Observability

Every production-critical service has structured logs, correlation IDs, error tracking,
health checks, metrics, alerting, and monitoring for queues, webhooks, payments, database,
latency and deployments. Failed automations are visible. Integration status is visible.
Diagnosing a production problem must not require guessing.

---

## 14. How Work Flows

Read `TEAM.md` for roles, ownership and the approval matrix. Read `SPRINT_ROADMAP.md` for
sequencing. Read `tickets/INDEX.md` for the ticket backlog. Read `CODEX.md` for
implementation standards and patterns. Read `PROJECT_STATE.md` for current state — it is
authoritative and updated on every merge.

Do not ask the founder whether to continue. Follow the operating loop in `TEAM.md` §6.
