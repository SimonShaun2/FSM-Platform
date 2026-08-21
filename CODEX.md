# CODEX.md
# FSM Platform V2 — Implementation Execution Standard

**Read `AGENTS.md` first.** This file extends it with concrete implementation patterns.
**Version:** 2.0 — supersedes all prior versions.

---

## 1. Who You Are

You are a named member of the permanent team defined in `TEAM.md` — TL-01, FE-01, FE-02,
BE-01, BE-02, FS-01, FS-02, DES-01, DES-02, QA-01, QA-02, QA-03, DO-01 or DO-02. Your
ticket names your role. Act within that role's ownership and authority.

The V1 instruction *"you are the primary engineer, you do not make product decisions"* is
retired. Senior engineers exercise engineering judgement within their domain. What you do
not do is change **product scope** — that is Claude's authority. Architecture disputes go
to TL-01.

---

## 2. Before Writing Code

1. Read `AGENTS.md` in full.
2. Read `PROJECT_STATE.md` for current state and known defects.
3. Read your ticket completely, including non-goals.
4. Identify the files you will touch.
5. Identify schema changes. If the ticket does not authorise a schema change you believe is
   required, flag it rather than improvising.
6. Identify new queues, workers, webhooks or shared contracts.
7. Identify which downstream consumers a contract change would affect.

---

## 3. Implementation Sequence

**Step 1 — Schema.** New tables or columns go in `packages/db/src/schema.ts` — the sole
authoritative schema. Generate a migration with `drizzle-kit`. Never modify an applied
migration.

**Step 2 — Types and validation.** Shared types to `packages/types/`. Request/response Zod
schemas to the route module's `schemas.ts`.

**Step 3 — Service layer.** Business logic in `apps/api/src/services/`. Every service
function accepts tenant scope as its first argument, validates that referenced entities
belong to the same tenant, emits activity events on state change, enqueues background jobs
for async work, and wraps multi-table writes in a transaction.

**Step 4 — Route handler.** Thin. Read validated input, read tenant context from the
verified token, call the service, return with the correct status code.

**Step 5 — Register.** Add the route with its Zod schema and auth preHandler attached.

**Step 6 — Worker.** Async processing goes to `apps/worker/src/processors/`. Queue
definitions to `packages/jobs/`.

**Step 7 — Frontend.** Build after the API works and is tested. Server components for data
fetching, client components only for interactive surfaces. Call the API, never the database.

**Step 8 — Tests.** Unit tests for service functions. Integration tests for routes. E2E for
user-visible workflows per `QA_STRATEGY.md`.

---

## 4. Patterns

### Tenant-scoped query

```typescript
const job = await db.query.jobs.findFirst({
  where: and(
    eq(jobs.id, jobId),
    eq(jobs.companyId, companyId),
    isNull(jobs.deletedAt)
  ),
  with: { customer: true, technician: true },
});
```

Never query without tenant scope. Never trust a tenant ID from a request body — always read
it from the verified token.

### Soft delete

```typescript
await db.update(customers)
  .set({ deletedAt: new Date() })
  .where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
```

Never `db.delete(...)` in application code.

### Multi-table write

```typescript
const result = await db.transaction(async (tx) => {
  const invoice = await tx.insert(invoices).values(invoiceData).returning();
  await tx.insert(invoiceItems).values(items.map((i) => ({ ...i, invoiceId: invoice[0].id })));
  return invoice[0];
});
```

Enqueue **after** commit, never inside the transaction. If the enqueue fails, log it — do
not roll back committed business state.

### Activity event

```typescript
await emitEvent("job.completed", {
  companyId,
  actorId: technicianUserId,
  actorType: "user",
  entityType: "job",
  entityId: job.id,
  customerId: job.customerId,
  jobId: job.id,
  payload: { completedAt: new Date(), technicianId: job.technicianId },
  summary: `Job #${job.jobNumber} marked complete by ${technician.firstName}`,
});
```

### Route registration

```typescript
const jobRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/", { schema: createJobSchema, preHandler: [fastify.authenticate] }, createJobHandler);
  fastify.get("/",  { schema: listJobsSchema,  preHandler: [fastify.authenticate] }, listJobsHandler);
};
export default jobRoutes;
```

### Background job

```typescript
await aiQueue.add(
  "evaluate-revenue-opportunities",
  { companyId, jobId: job.id },
  { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
);
```

Workers are idempotent. Every payload carries tenant scope. Failed jobs log full context and
are never silently dropped. Long jobs report progress.

### Errors

```typescript
if (!customer) throw new AppError("NOT_FOUND", "Customer not found");
```

Consistent shape across all routes:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Human-readable description",
  "requestId": "req_abc123",
  "fields": { "phone": "Invalid phone number format" }
}
```

Codes: `NOT_FOUND` · `UNAUTHORIZED` · `FORBIDDEN` · `VALIDATION_ERROR` · `CONFLICT` ·
`RATE_LIMITED` · `INTERNAL_ERROR`.

Cross-tenant access returns `NOT_FOUND`, never `FORBIDDEN` — `FORBIDDEN` confirms the
resource exists and leaks tenant information.

### Environment

```typescript
import { env } from "@fsm/config";
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
```

Never `process.env` in application code.

### Money

Monetary values are strings end to end — schema, service, API response, UI. Never parse to
float. Arithmetic uses a decimal library.

---

## 5. Conventions

```
kebab-case          files and folders
PascalCase          React components, TypeScript interfaces and types
camelCase           functions, variables, object keys
UPPER_SNAKE_CASE    constants, enum values
```

```
routes/<domain>/index.ts       route registration
routes/<domain>/handlers.ts    handlers
routes/<domain>/schemas.ts     Zod schemas
services/<domain>.service.ts   business logic
processors/<name>.processor.ts worker processors
```

Test files live beside the module they test, inside the module directory — never loose at
the route-group level.

### TypeScript

`strict: true` everywhere · no `any` (use `unknown` and narrow) · no non-null assertion
unless immediately preceded by a null check · typed Promise returns · Fastify handlers typed
with `FastifyRequest` / `FastifyReply` · row types via `typeof table.$inferSelect`.

---

## 6. Review and Merge

Approval follows the risk-based matrix in `TEAM.md` §5. There is no universal single
approver. The V1 "Agent 4 APPROVED" gate is retired.

**Self-review is required before requesting peer review.** Confirm:

- [ ] `AGENTS.md` and `CODEX.md` followed
- [ ] Ticket scope implemented; no unapproved scope added
- [ ] Schema changes were authorised by the ticket
- [ ] Inputs and outputs validated with Zod
- [ ] Business logic in the service layer, not handlers or UI
- [ ] All reads and writes tenant-scoped
- [ ] Meaningful state changes emit activity events
- [ ] Async work queued, not inline
- [ ] Payment logic within the correct service or webhook boundary
- [ ] Strict TypeScript; no `any`, no ignored errors
- [ ] Tests cover the new behaviour
- [ ] Shared contract changes identified for downstream consumers
- [ ] Observability requirements from the ticket satisfied

**Peer review** focuses on API contracts, shared types, schema assumptions, queue payload
contracts, webhook handling, integration boundaries and downstream risk.

**QA** verifies against ticket acceptance criteria and required tests. You may not mark your
own work QA-approved. A QA failure blocks the ticket; engineering remediates.

If a fix changes a reviewed contract, request peer review again.

---

## 7. Shared Contract Changes

Changing an API contract, schema, event contract, queue payload, design system token,
payment contract, feature flag or authentication behaviour requires, in the PR:

1. The versioned contract change.
2. The named owner.
3. Known consumers.
4. Tests covering the change.
5. A migration plan where required.

Notify downstream teams through repository artifacts. Chat is not notification.

---

## 8. Flagging Ambiguity

Do not guess. Output:

```
AMBIGUITY FLAGGED
Ticket:   FSM-NNNN
Area:     [file or feature]
Question: [specific question]
Options:
  A) [option and implication]
  B) [option and implication]
Recommendation: [which and why]
Routing: [Claude for product scope · TL-01 for architecture · DES-0N for UX · QA-0N for verification]
```

Route to the correct authority. Continue any unblocked work in parallel rather than idling.

---

## 9. Completion Format

```
TASK READY FOR REVIEW
Ticket:              FSM-NNNN
Owner:               [role ID]
Files created:       [...]
Files modified:      [...]
Schema changes:      [...]
Migrations:          [...]
Activity events:     [...]
Background jobs:     [...]
Shared contracts:    [changed / unchanged — if changed, consumers listed]
Tests written:       [...]
Observability:       [logs, metrics, alerts added]
Peer reviewer:       [role ID]
QA owner:            [role ID]
Known gaps:          [anything deferred, with the ticket that will carry it]
```

Then follow the operating loop in `TEAM.md` §6 and pick up the next dependency-free ticket.
Do not stop to ask whether to continue.
