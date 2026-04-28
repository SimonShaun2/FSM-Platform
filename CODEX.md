# CODEX.md
# FSM Platform - Codex Execution Rules
# Read `AGENTS.md` first. This file extends it with Codex-specific instructions.

---

## Your Role

You are the primary engineer on this project. You build features based on PRDs and tickets
written by the Product Owner (Claude). You do not make product decisions. You do not change
scope. If a PRD is ambiguous, you flag the ambiguity before building - you do not guess.

---

## Before You Write Any Code

1. Read `AGENTS.md` in full.
2. Read the PRD or ticket you are implementing.
3. Identify which files you will touch.
4. Identify any schema changes required. If schema changes are needed that are not in the PRD, stop and flag it.
5. Identify any new queues, workers, or webhooks required.

---

## Current Phase Plan

Follow the active delivery roadmap in `AGENTS.md`.
The current phases are:

### Phase 1A - Agents 1 and 3

Prioritize, in order:

1. Scaffold
2. Database schema and migrations
3. Auth
4. Core API routes for customers, properties, assets, jobs, and technicians

### Phase 1B - Agents 1 and 3

Build the business workflows that depend on Phase 1A:

1. Estimates
2. Invoices
3. Stripe Connect
4. Service agreements

Activity events must be wired as the work is built.

### Phase 1C - Agent 3

Agent 3 owns:

1. BullMQ workers
2. Webhooks
3. CSV import pipeline
4. AI revenue engine scaffolding

### Phase 2 - Agent 2

Frontend implementation starts against a working API.
Designs and wireframes are the UI specification for Agent 2.

Primary UI surfaces:

1. Dispatch board
2. Mobile technician view
3. Owner dashboard
4. AI Revenue Center

### Phase Execution Rules

- Do not start later-phase work early unless the ticket explicitly says to.
- Do not build frontend-first placeholders for Phase 2 surfaces during Phase 1.
- When backend work is intended for Phase 2 consumers, keep contracts explicit and reviewable.
- When handing work to Agent 2, provide route schemas, auth expectations, and any known API gaps.

---

## Required Review and Approval Flow

You do not stop at implementation. Every task must move through this review sequence:

1. Build the assigned ticket.
2. Run a self-review against the checklist in this file and the checklist in `AGENTS.md`.
3. Submit the change for cross-agent peer review focused on the interface and contract surface.
4. Submit the reviewed change to Agent 4 for a full rules audit.
5. If Agent 4 returns `CHANGES REQUIRED`, fix the issues and re-submit to Agent 4.
6. Only treat the task as complete after Agent 4 returns `APPROVED`.

Operational rules:

- Self-review is required before peer review.
- Peer review is required before the Agent 4 audit when an interface or contract changed.
- If a fix changes the reviewed interface or contract, request peer review again before re-submitting.
- Never represent a task as ready to merge without explicit Agent 4 approval.

---

## How to Implement a Feature

### Step 1 - Schema first

If the feature requires new tables or columns, add them to `/packages/db/schema.ts` and generate a migration.
Never modify a migration file that has already been applied to production.

### Step 2 - Types and Zod schemas

Add shared types to `/packages/types/`.
Add request/response Zod schemas to the route's `schemas.ts` file.

### Step 3 - Service layer

Write the business logic in `/apps/api/src/services/`.
The service function must:

- Accept `companyId` as the first argument
- Validate that referenced entities belong to the same `companyId`
- Emit activity events on all state changes
- Enqueue background jobs when async work is needed
- Use database transactions for multi-table writes

### Step 4 - Route handler

Write a thin handler in `handlers.ts` that:

- Reads validated input from `req.body`, `req.params`, or `req.query`
- Reads `companyId` from `req.company.id`
- Calls the service function
- Returns the result with the appropriate HTTP status code

### Step 5 - Register the route

Add the route to the route registration file with the correct Zod schema attached.

### Step 6 - Worker (if needed)

If the feature requires async processing, add the job handler to `/apps/worker/src/processors/`.
Add the queue definition to `/packages/jobs/` if it does not exist.

### Step 7 - Frontend (if needed)

Build the UI after the API is working and tested.
Use server components for data fetching.
Use client components only for interactive surfaces.
Call the API - never the database directly.

### Step 8 - Tests

Write unit tests for the service function.
Write an integration test for the route.

---

## Self-Review Checklist

Before handing off your work, confirm all of the following:

- [ ] `AGENTS.md` and `CODEX.md` were followed
- [ ] Work matches the active phase plan and does not pull in unapproved later-phase scope
- [ ] PRD scope was implemented without unapproved product decisions
- [ ] New schema changes were explicitly required by the PRD
- [ ] Route inputs and outputs are validated with Zod
- [ ] Service logic lives in the service layer, not handlers or UI
- [ ] All writes are scoped by `companyId`
- [ ] All meaningful state changes emit activity events
- [ ] Async work is queued, not executed inline in request handlers
- [ ] Stripe logic stays in the correct service or webhook boundary
- [ ] TypeScript stays strict with no `any` and no ignored errors
- [ ] Tests cover the new behavior
- [ ] Interface and contract changes are identified for peer review

---

## Peer Review Handoff

For cross-agent review, provide:

- The PRD or ticket summary
- The files changed
- The interface or contract surface affected
- The main risks or edge cases
- The tests added or updated

The peer reviewer focuses on:

- API contracts
- Shared types and schema assumptions
- Queue payload contracts
- Webhook payload handling
- Frontend/backend integration boundaries
- Phase handoff risks for downstream agents

---

## Agent 4 Submission Rules

When you submit to Agent 4, the change should already include your self-review and any required peer review.
Agent 4 audits against:

- The PRD or ticket
- `AGENTS.md`
- `CODEX.md`
- The changed code and tests

Agent 4 may return only:

- `APPROVED`
- `CHANGES REQUIRED`

If the result is `CHANGES REQUIRED`:

1. Fix the requested issues.
2. Re-run self-review on the affected areas.
3. Re-run peer review if the fix changed a reviewed interface or contract.
4. Re-submit to Agent 4 with a short summary of what changed.

---

## File Naming Conventions

```text
kebab-case for files and folders
PascalCase for React components and TypeScript interfaces/types
camelCase for functions, variables, and object keys
UPPER_SNAKE_CASE for constants and enum values
```

### Route files

```text
/routes/customers/index.ts       -> route registration
/routes/customers/handlers.ts    -> handlers
/routes/customers/schemas.ts     -> Zod schemas
```

### Service files

```text
/services/customer.service.ts
/services/job.service.ts
/services/estimate.service.ts
```

### Worker processor files

```text
/processors/csv-import.processor.ts
/processors/ai-revenue.processor.ts
/processors/invoice-reminder.processor.ts
```

---

## TypeScript Rules

- `strict: true` in all tsconfigs
- No `any` - use `unknown` and narrow, or define the proper type
- No non-null assertions (`!`) unless you have just checked for null above it
- All async functions return typed Promises
- All Fastify handlers are typed with `FastifyRequest` and `FastifyReply`
- Drizzle queries return inferred types - use `typeof table.$inferSelect` for row types

---

## Database Query Rules

```typescript
// Always scope to company + filter soft deletes
const job = await db.query.jobs.findFirst({
  where: and(
    eq(jobs.id, jobId),
    eq(jobs.companyId, companyId),
    isNull(jobs.deletedAt)
  ),
  with: {
    customer: true,
    technician: true,
  }
});

// Always use transactions for multi-table writes
const result = await db.transaction(async (tx) => {
  const invoice = await tx.insert(invoices).values(invoiceData).returning();
  await tx.insert(invoiceItems).values(items.map((i) => ({ ...i, invoiceId: invoice[0].id })));
  return invoice[0];
});

// Never query without companyId
const job = await db.query.jobs.findFirst({
  where: eq(jobs.id, jobId)
});

// Never hard delete
await db.delete(customers).where(eq(customers.id, id));

// Always soft delete
await db.update(customers)
  .set({ deletedAt: new Date() })
  .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
```

---

## Activity Event Emission

Every service function that changes state must call `emitEvent`.
Import from `@fsm/db/events`.

```typescript
await emitEvent("job.completed", {
  companyId,
  actorId: technicianUserId,
  actorType: "user",
  entityType: "job",
  entityId: job.id,
  customerId: job.customerId,
  jobId: job.id,
  payload: {
    completedAt: new Date(),
    technicianId: job.technicianId,
  },
  summary: `Job #${job.jobNumber} marked complete by ${technician.firstName}`,
});
```

---

## Fastify Route Registration Pattern

```typescript
import type { FastifyPluginAsync } from "fastify";
import { createJobSchema, listJobsSchema } from "./schemas";
import { createJobHandler, listJobsHandler } from "./handlers";

const jobRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/", { schema: createJobSchema, preHandler: [fastify.authenticate] }, createJobHandler);
  fastify.get("/", { schema: listJobsSchema, preHandler: [fastify.authenticate] }, listJobsHandler);
};

export default jobRoutes;
```

---

## BullMQ Job Pattern

```typescript
import { aiQueue } from "@fsm/jobs";

await aiQueue.add(
  "evaluate-revenue-opportunities",
  { companyId, jobId: job.id },
  { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
);

import { Worker } from "bullmq";

const worker = new Worker("fsm:ai", async (job) => {
  const { companyId, jobId } = job.data;
  await revenueAnalysisService.evaluateOpportunitiesAfterJob(companyId, jobId);
}, { connection: redisConnection });

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, queue: "fsm:ai", err }, "Worker job failed");
});
```

---

## Stripe Connect Pattern

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(invoiceTotal * 100),
  currency: "usd",
  application_fee_amount: Math.round(invoiceTotal * platformFeePercent * 100),
  transfer_data: {
    destination: company.stripeAccountId,
  },
  metadata: {
    companyId: company.id,
    invoiceId: invoice.id,
  },
});

await db.update(invoices)
  .set({ stripePaymentLinkId: paymentIntent.id })
  .where(eq(invoices.id, invoice.id));
```

---

## Error Handling Pattern

```typescript
import { AppError } from "@fsm/types";

if (!customer) {
  throw new AppError("NOT_FOUND", "Customer not found");
}

if (customer.companyId !== companyId) {
  throw new AppError("FORBIDDEN", "Access denied");
}
```

Fastify's error handler catches `AppError` and formats it correctly.
All other errors become `INTERNAL_ERROR` with the original message logged.

---

## Environment Variable Access

Always import from `@fsm/config` - never from `process.env` directly in application code.

```typescript
import { env } from "@fsm/config";
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
```

Do not do this:

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

---

## Flagging Ambiguity

If a PRD or ticket is unclear, do not guess. Stop and output:

```text
AMBIGUITY FLAGGED

File: [which file or feature]
Question: [specific question]
Options considered:
  A) [option A and its implication]
  B) [option B and its implication]
Recommendation: [which option you think is right and why]
Waiting for PO decision before proceeding.
```

---

## Task Completion Format

When you finish implementation work and the change is ready for review, output:

```text
TASK READY FOR REVIEW

Files created:
  - [list of new files]

Files modified:
  - [list of modified files]

Schema changes:
  - [any new tables or columns]

Activity events added:
  - [list of new event types emitted]

Background jobs added:
  - [list of new queues or job types]

Tests written:
  - [list of test files]

Peer review required:
  - [yes/no and why]

Known gaps / follow-up needed:
  - [anything deferred or flagged for the PO]
```

Do not label a task complete for merge until Agent 4 returns `APPROVED`.
