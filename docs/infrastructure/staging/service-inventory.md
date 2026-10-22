# Staging service and resource inventory (provider-neutral)

**FS-75** · Baseline repo: `SimonShaun2/Renvani` monorepo · **Status:** design inventory — physical host names are **TBD until FS-93 ADR**.

## Logical runtime services

| Service ID | Repo path | Process role | Stateless | Ingress (logical) | Notes |
|------------|-----------|--------------|-----------|-------------------|--------|
| `web` | `apps/web` | Next.js App Router UI + public branded routes | Yes (sessions via auth tokens/cookies) | Public HTTPS (office + marketing/branded) | `NEXT_PUBLIC_API_URL` points at API origin |
| `api` | `apps/api` | Fastify HTTP API, auth, domain routes | Yes | Private or public HTTPS behind edge | Default port `3001` (`API_PORT`) |
| `webhook` | `apps/webhook` | Stripe/Twilio inbound verification + handlers | Yes | Public HTTPS (provider callbacks only) | Default port `3002` (`WEBHOOK_PORT`); separate from API by design |
| `worker` | `apps/worker` | BullMQ consumers + scheduled jobs | Yes | None (outbound only) | Queues: `imports`, `ai`, `notifications`, `invoices`, `agreements`, `operator` (`packages/jobs`) |

Shared build packages: `@fsm/config`, `@fsm/types`, `@fsm/db`, `@fsm/jobs`, `@fsm/ai`.

## Managed data and platform resources

| Resource ID | Technology (app contract) | Staging isolation requirement | Production contrast |
|-------------|---------------------------|-------------------------------|---------------------|
| `postgres` | PostgreSQL via `DATABASE_URL`, Drizzle migrations in `packages/db/migrations` | **Dedicated** database instance or database name; no shared URL with prod | Separate backup/restore target |
| `redis` | Redis via `REDIS_URL`, BullMQ prefix `fsm` | **Dedicated** instance; no prod queue keys | Same |
| `object_storage` | S3-compatible (R2 adapter: `R2_*` env) | **Dedicated** bucket per environment | Never reuse bucket name |
| `edge_dns` | DNS + TLS termination (provider TBD, FS-93) | Staging hostnames only | Production hostnames only |

## Integration adapters (non-runtime)

| Integration | Config keys (today) | Staging mode |
|-------------|---------------------|--------------|
| Stripe Connect + platform | `STRIPE_*` | Test mode keys only (`sk_test_`, test webhook secrets) |
| Twilio SMS | `TWILIO_*` | Test/sandbox project or send suppression |
| SendGrid email | `SENDGRID_*` | Sandbox or mail capture; no customer inboxes |
| OpenAI | `OPENAI_API_KEY` | Separate project/key; rate limits |
| Auth (JWT) | `JWT_*`, token TTLs | **Unique** signing secrets per environment |

## Connection and scale assumptions (pre-FS-93)

- Each Node process uses `postgres` client `max: 1` (`packages/db/src/client.ts`). Staging replica count must fit within Postgres `max_connections` once FS-93 quantifies pool strategy.
- `webhooks` queue is defined in `@fsm/jobs` but not consumed in `apps/worker` today; webhook HTTP service handles providers synchronously. Document for staging smoke; worker expansion is a separate backend ticket.

## Unknown until FS-93

- Concrete provider projects, regions, and service names
- Whether web and API share a platform project or split
- Private networking / connection pooler placement
- Observability vendor and log sinks

Do not infer live account state from this document.
