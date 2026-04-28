# AGENTS.md
# FSM Platform — Codex Agent Configuration
# This file governs how all AI agents operate in this repository.
# Read this file in full before making any changes to the codebase.

---

## What This Product Is

An AI-native Field Service Management (FSM) SaaS platform built for HVAC and trade service businesses.
It manages customers, properties, assets, jobs, scheduling, dispatch, estimates, invoices, payments,
service agreements, and an AI Revenue Intelligence layer that surfaces missed revenue opportunities.

This is a **backend-first, production-grade SaaS application** with persistent data, background workers,
AI-driven automation, payment processing, and real-time webhooks.

**This is not a prototype. This is not a demo. Every feature must work in production.**

---

## Monorepo Structure

```
/apps
  /web          → Next.js 14 frontend (App Router)
  /api          → Fastify backend (primary API)
  /worker       → BullMQ background job processor
  /webhook      → Dedicated Fastify server for inbound webhooks

/packages
  /db           → Drizzle ORM schema, migrations, seed scripts
  /types        → Shared TypeScript types and Zod schemas
  /ui           → Shared React component library
  /ai           → OpenAI prompts, AI service functions
  /jobs         → BullMQ queue definitions and job handlers
  /config       → Shared env validation (Zod), constants
```

Every package is a proper TypeScript package with its own `package.json`.
Internal packages are imported as `@fsm/db`, `@fsm/types`, `@fsm/ai`, etc.

---

## Agent Roles

### Codex — Primary Builder
Implements features based on PRDs and tickets.
Owns: API routes, service layer, database queries, worker jobs, frontend pages and components.
Does NOT: make product decisions, change schema without a PRD directing it, skip error handling.

### ChatGPT — Code QA
Reviews Codex output for correctness, edge cases, and consistency with these rules.
Flags violations before merge.

### Claude — Product Owner / Product Manager
Writes PRDs, user stories, and acceptance criteria.
Does NOT write implementation code.
Codex builds to Claude's specs.

---

## Product North Star

> **"We're not building ServiceTitan from scratch. We're building a thinner system with a smarter brain."**

Every scope decision is measured against this. If a feature makes the system thicker without making
the brain smarter, it does not belong in v1. When in doubt, ask: does this help operators find lost
revenue or run their business more easily? If not, it is v2.

---

## Core Principles (Non-Negotiable)

1. **Backend owns all business logic.** No business logic in the frontend. Ever.
2. **Every state change emits an activity event.** No exceptions.
3. **All money flows through Stripe.** No manual payment state management outside of Stripe webhook handlers.
4. **Background workers handle async work.** No long-running operations in API request handlers.
5. **Multi-tenant by default.** Every query is scoped to `companyId`. No cross-tenant data leakage.
6. **TypeScript strict mode everywhere.** No `any`. No `// @ts-ignore`.
7. **Zod validates all inputs.** Request bodies, query params, env vars — all validated at the boundary.
8. **Errors are explicit.** No silent failures. No swallowed exceptions.

## Engineering Principles (Maintainability, Extensibility, Low-Risk Iteration)

The software must be built for maintainability, extensibility, and low-risk iteration. We should be
able to fix bugs, change workflows, add fields, add modules, or extend features without rewriting
large parts of the system.

These engineering principles are repo law. Codex must follow them on every ticket. Agent 4 must
flag violations.

### 1. Modular Domain Services
Each domain — customers, jobs, technicians, invoices, estimates, service agreements, forms,
AI recommendations, dispatch — has its own service boundary.
- One feature must not require editing unrelated domains unless truly necessary.
- Domain services own their data. They do not reach into other services internals.
- Cross-domain needs are handled via explicit service function calls or activity events.

### 2. Thin Route Handlers
API handlers do exactly four things: validate input, read auth/company context, call a service
function, return a response. Nothing else belongs in a handler.
- No database queries in handlers.
- No business logic in handlers.
- No conditional branching on business rules in handlers.

### 3. Event-Driven State Changes
Every meaningful state change emits an activity event. AI, notifications, analytics, and future
automations subscribe to those events instead of being hardcoded into core workflows.
- Adding a new automation must not require editing existing service logic.
- New event consumers are additive — they do not modify the event emitter.

### 4. Background Jobs for Async Work
CSV imports, AI analysis, SMS/email sending, invoice reminders, and all future automations run
through BullMQ workers and queues. Long processes never run inline inside API requests.
- If a task takes more than ~100ms or calls an external API, it belongs in a worker.
- Workers are idempotent — safe to retry on failure.

### 5. Stable Domain Models
Core entities are modeled around the real FSM domain:
company, customer, property, asset, technician, job, estimate, invoice,
service_agreement, form, activity_event, ai_recommendation.
- Schemas are not designed around the current UI — they are designed around the domain.
- Shortcut schemas that only support the current feature are not acceptable.
- When a new UI need arises, extend the model cleanly — do not hack around it.

### 6. Replaceable Integrations
Stripe, Twilio, SendGrid, OpenAI, and Cloudflare R2 are wrapped in service adapters.
- External vendor calls are isolated to adapter files, not scattered across services.
- If a vendor changes, only the adapter file changes — not the rest of the codebase.
- Adapter files live in /apps/api/src/lib/ (e.g. email.ts, sms.ts, storage.ts).

### 7. Typed Contracts
TypeScript strict mode and shared Zod schemas define all API inputs and outputs.
- Frontend calls typed API clients — never duplicates backend logic.
- Shared types live in @fsm/types — not duplicated in frontend and backend separately.
- API response shapes are explicitly defined, not inferred from database row types.

### 8. Small, Testable Units
Each service function is independently testable without standing up the full application.
- Unit tests cover service logic.
- Integration tests cover routes.
- A function that is hard to test is a signal the function is doing too much.

### 9. No Hidden Coupling
- Frontend components do not depend on database row shapes directly.
- One module does not reach into another modules internals.
- Cross-module communication uses explicit service functions and shared types from @fsm/types.
- If two services need the same data, they share a type — they do not share a database query.

### 10. Feature Flags / Staged Rollout Where Useful
New AI actions, automation behavior, payment logic, and dispatch experiments must be easy to
enable, disable, or revise without breaking the system.
- Use a simple featureFlags object in @fsm/config for v1.
- Flag-gated code paths are clearly marked with a comment: // FEATURE FLAG: [flag-name]
- No flag should require a database migration to toggle.

The goal is to avoid a fragile demo app. This must be a production-grade SaaS foundation where
future features can be added cleanly without rebuilding the architecture.

---

## Tech Stack (Locked — Do Not Deviate)

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Frontend         | Next.js 14 (App Router), React    |
| Backend API      | Node.js + Fastify                 |
| Database         | PostgreSQL + Drizzle ORM          |
| Background Jobs  | Redis + BullMQ                    |
| Payments         | Stripe Connect                    |
| SMS              | Twilio                            |
| Email            | SendGrid                          |
| AI               | OpenAI API (GPT-4o)               |
| File Storage     | Cloudflare R2 (S3-compatible)     |
| Auth             | JWT + refresh tokens (custom)     |
| Deployment       | Railway (primary) / Render (alt)  |
| Package Manager  | pnpm workspaces                   |
| Testing          | Vitest (unit) + Playwright (e2e)  |

---

## Database Rules

- Schema lives in `/packages/db/schema.ts` — the single source of truth
- Migrations are generated via `drizzle-kit generate` — never hand-edited
- All tables have: `id` (UUID), `companyId`, `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- All deletes are soft deletes. Never `DELETE FROM` in application code.
- All queries must filter by `companyId` — enforced at the service layer, not the route layer
- Transactions are used for any operation that writes to more than one table
- The `activity_events` table receives an insert for every meaningful state change

### Drizzle Query Pattern
```typescript
// Always scope to company
const customer = await db.query.customers.findFirst({
  where: and(
    eq(customers.id, customerId),
    eq(customers.companyId, companyId),
    isNull(customers.deletedAt)
  ),
});
```

---

## API Architecture (Fastify)

### Route File Structure
```
/apps/api/src/routes/
  customers/
    index.ts        → route registration
    handlers.ts     → request handlers (thin — call service layer)
    schemas.ts      → Zod input/output schemas
  jobs/
    index.ts
    handlers.ts
    schemas.ts
  ...
```

### Service Layer
Business logic lives in `/apps/api/src/services/`.
Handlers call services. Services call the database.
Services emit activity events.
Services enqueue background jobs when needed.

```typescript
// Handler — thin
async function createJobHandler(req, reply) {
  const job = await jobService.createJob(req.company.id, req.body);
  return reply.code(201).send(job);
}

// Service — owns the logic
async function createJob(companyId: string, input: CreateJobInput) {
  const job = await db.insert(jobs).values({ ...input, companyId }).returning();
  await emitEvent('job.created', { companyId, jobId: job.id, actorId: input.createdById });
  await jobQueue.add('evaluate-revenue-opportunities', { companyId, jobId: job.id });
  return job;
}
```

### Error Shape (Consistent Across All Routes)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Human-readable description",
  "requestId": "req_abc123",
  "fields": {
    "phone": "Invalid phone number format"
  }
}
```

Error codes are uppercase snake_case enums:
`NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `CONFLICT`, `INTERNAL_ERROR`

### Auth
Every protected route reads `companyId` and `userId` from the verified JWT.
The `company` object is attached to `req.company` via a Fastify plugin.
Never trust `companyId` from the request body — always use `req.company.id`.

---

## Activity Events

Every meaningful state change writes to `activity_events`. This is the event stream the AI reads.

```typescript
// /packages/db/src/events.ts
export async function emitEvent(
  eventType: ActivityEventType,
  ctx: {
    companyId: string;
    actorId?: string;
    actorType?: 'user' | 'system' | 'ai' | 'customer';
    entityType: string;
    entityId: string;
    customerId?: string;
    jobId?: string;
    estimateId?: string;
    invoiceId?: string;
    payload?: Record<string, unknown>;
    summary: string;
  }
) { ... }
```

Events that must always be emitted (non-exhaustive):
- `job.created`, `job.scheduled`, `job.started`, `job.completed`, `job.cancelled`
- `estimate.sent`, `estimate.viewed`, `estimate.approved`, `estimate.declined`
- `invoice.sent`, `invoice.viewed`, `invoice.overdue`, `payment.received`
- `customer.created`, `asset.created`, `asset.serviced`
- `maintenance_plan.created`, `maintenance_visit.completed`
- `ai.recommendation_created`, `ai.recommendation_actioned`

---

## Background Workers (BullMQ)

Queue definitions live in `/packages/jobs/`.
Worker implementations live in `/apps/worker/src/processors/`.

### Queues
```
fsm:imports       → CSV import processing, AI column mapping, row ingestion
fsm:ai            → Revenue analysis, recommendation generation
fsm:notifications → SMS and email dispatch (Twilio / SendGrid)
fsm:invoices      → Invoice reminder escalation
fsm:agreements    → Service agreement renewal scheduling
fsm:webhooks      → Outbound webhook delivery (future)
```

### Worker Rules
- All jobs are idempotent — safe to retry on failure
- All jobs have a `jobId` or `companyId` in their data payload
- Failed jobs are logged with full context — never silently dropped
- Long-running jobs (CSV imports) report progress via job.updateProgress()
- Workers do not call the Fastify API — they call services and the database directly

---

## Stripe Connect

This platform uses **Stripe Connect** (platform model).
Each company has a Stripe Connected Account.
All customer payments flow through the platform.
The platform takes a transaction fee; the company receives the remainder.

### Rules
- Never hardcode Stripe fee amounts — read from env/config
- All Stripe webhook events are processed in `/apps/webhook/`
- Webhook handlers are idempotent — check if event already processed before acting
- Use Stripe's `metadata` field to store `companyId` and relevant entity IDs
- Subscription events (`customer.subscription.updated`, `invoice.payment_failed`, etc.)
  must update `maintenance_plans.stripeSubscriptionId` and emit activity events

### Stripe Webhook Events to Handle (v1)
```
checkout.session.completed
payment_intent.succeeded
payment_intent.payment_failed
invoice.payment_succeeded       → service agreement renewal payment
invoice.payment_failed          → dunning — notify company
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted   → mark maintenance_plan as cancelled
account.updated                 → Connected Account onboarding status
```

---

## Twilio SMS

Inbound SMS arrives at `/apps/webhook/src/handlers/twilio.ts`.
Outbound SMS is sent via the `fsm:notifications` BullMQ queue — never inline in a request handler.

### Rules
- All outbound SMS is queued, not sent synchronously
- Twilio webhook signatures are verified on every inbound request
- Inbound messages are logged to `message_logs` with `direction: 'inbound'`
- Outbound messages are logged to `message_logs` with `direction: 'outbound'` after send confirmation
- AI-drafted messages must be flagged with a review step before send in v1 (no fully autonomous sending)

---

## AI (OpenAI)

AI logic lives in `/packages/ai/`.
The AI reads `activity_events` and customer/asset data to generate revenue recommendations.

### Rules
- All AI calls are async — always via background worker, never in a request handler
- Prompts are versioned and stored as named exports in `/packages/ai/prompts/`
- AI responses are parsed and validated with Zod before being written to the database
- AI never directly sends messages to customers — it creates recommendations that humans action
- In v1, AI-drafted SMS copy is pre-populated in the UI for human review before send
- Token usage is logged per call for cost monitoring

### Core AI Jobs (v1)
```
evaluate-revenue-opportunities    → runs after job.completed, reads customer/asset history
detect-dormant-customers          → runs nightly, flags customers inactive > threshold
estimate-follow-up                → triggered 24h after estimate.sent with no response
invoice-reminder-escalation       → triggered on invoice.overdue
service-agreement-opportunity     → identifies customers not on a plan, with eligible assets
```

---

## CSV Import / Onboarding

Import flow:
1. User uploads CSV → stored in R2, `import_sessions` row created with status `uploaded`
2. Worker job triggered → AI maps columns to schema fields → status → `mapping`
3. User reviews and confirms column mappings in UI → status → `preview`
4. Worker validates all rows → surfaces errors → status stays `preview` until user confirms
5. User confirms → worker ingests rows → status → `importing` → `completed`
6. All imported records carry `importSessionId` for rollback traceability

### Rules
- CSV parsing happens in the worker, not the API
- Row errors do not abort the import — they are collected and surfaced in bulk
- Duplicate detection: match on email + companyId for customers; address for properties
- AI inference (e.g. asset type from job description) is logged in `aiInferences` column
- Rollback deletes all records with the given `importSessionId` — within a transaction

---

## Frontend Rules (Next.js)

- App Router only — no Pages Router
- All data fetching via server components where possible
- Client components only when interactivity requires it (dispatch board, forms)
- No business logic in the frontend — all operations via API calls
- Auth state managed via httpOnly cookie (set by API on login)
- Environment variables prefixed `NEXT_PUBLIC_` for client-side only
- No direct database calls from the frontend — ever

### Dispatch Board
The dispatch board is the highest-complexity frontend surface.
It uses optimistic updates with server reconciliation.
Drag-and-drop is implemented via `@dnd-kit/core`.
Real-time job status updates use Server-Sent Events (SSE) from the API.
The board must remain usable if SSE disconnects — fall back to polling every 30s.

---

## Testing

- Unit tests for all service layer functions (Vitest)
- Integration tests for all API routes (Vitest + supertest)
- E2E tests for critical user flows: job creation, dispatch, invoice payment, CSV import (Playwright)
- All tests run in CI before merge
- Test database is seeded fresh for each test suite run

---

## Environment Variables

All env vars are validated at startup via Zod in `/packages/config/src/env.ts`.
The app crashes on startup if a required env var is missing — no silent degradation.

Required vars (all services):
```
DATABASE_URL
REDIS_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PLATFORM_FEE_PERCENT
OPENAI_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
SENDGRID_API_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
JWT_SECRET
JWT_REFRESH_SECRET
```

---

## What Codex Must Never Do

1. **Never put business logic in a Next.js route handler or page component**
2. **Never query the database directly from the frontend**
3. **Never skip activity event emission on a state change**
4. **Never process Stripe payments outside of the webhook handler**
5. **Never send SMS synchronously inside a request handler**
6. **Never use `any` in TypeScript**
7. **Never hardcode tenant IDs, API keys, or secrets**
8. **Never perform a hard delete — always soft delete via `deletedAt`**
9. **Never run CSV parsing or AI inference inside an API request — use a worker**
10. **Never trust `companyId` from the request body — always use `req.company.id` from the JWT**
11. **Never mock data in production code paths**
12. **Never skip input validation on a route**
13. **Never make a Stripe API call without storing the result in the database**
14. **Never deploy with `console.log` debug statements — use the structured logger**

---

## Logging

Use `pino` for structured logging in the API and worker.
Log levels: `error`, `warn`, `info`, `debug`.
Every request is logged with `requestId`, `companyId`, `userId`, `method`, `path`, `statusCode`, `durationMs`.
Every background job is logged on start, completion, and failure.
Never log PII (customer name, email, phone) at `info` level or above — only at `debug`.

---

## Pull Request Checklist (Codex self-review before completing a task)

- [ ] All new routes have Zod input validation
- [ ] All new service functions emit activity events on state changes
- [ ] All async work is enqueued to BullMQ — not run inline
- [ ] All database writes are scoped to `companyId`
- [ ] All Stripe interactions are handled in webhook handlers or service layer
- [ ] TypeScript strict — no `any`, no ignored errors
- [ ] Unit tests written for new service functions
- [ ] No business logic in the frontend
- [ ] No hardcoded secrets or IDs
- [ ] Soft delete used — no hard deletes
