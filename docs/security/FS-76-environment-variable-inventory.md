# FS-76 — Environment variable inventory

**Schema authority:** `packages/config/src/env.ts`  
**Generated:** Manual inventory from repository grep @ FS-76 branch (re-run `pnpm check:env-docs` after schema changes).

## Classification legend

| Class | Description |
| --- | --- |
| **secret** | Credential or signing key; never log at info+; rotate on exposure |
| **config** | Non-secret tunable (ports, TTLs, fee percent) |
| **public** | Safe for browser bundles (`NEXT_PUBLIC_*`) |
| **web-server** | Next.js server-only; not in Zod schema today |

## Shared schema (`@fsm/config`)

| Variable | Class | Default | Primary consumers |
| --- | --- | --- | --- |
| `NODE_ENV` | config | `development` | `apps/api`, `apps/webhook` (log level) |
| `API_PORT` | config | `3001` | `apps/api/src/server.ts` |
| `WEBHOOK_PORT` | config | `3002` | `apps/webhook/src/server.ts` |
| `DATABASE_URL` | secret | — | `packages/db/src/client.ts`, all services using `@fsm/db` |
| `REDIS_URL` | secret | — | `packages/jobs/src/connection.ts`, workers/API enqueue |
| `STRIPE_SECRET_KEY` | secret | — | `apps/api/src/lib/stripe.ts`, `apps/webhook` Stripe verify middleware |
| `STRIPE_WEBHOOK_SECRET` | secret | — | `apps/webhook/src/middleware/stripe-verify.ts` |
| `STRIPE_CONNECT_CLIENT_ID` | secret | — | **Schema only** (required at startup; no production read site in `apps/` yet — connect onboarding TBD) |
| `STRIPE_PLATFORM_FEE_PERCENT` | config | — | `apps/api/src/lib/stripe.ts`, `stripe-connect.service.ts` |
| `OPENAI_API_KEY` | secret | — | `packages/ai/src/prompts/*.ts`; worker via `@fsm/ai` (`csv-import`, `ai-revenue` processors) |
| `TWILIO_ACCOUNT_SID` | secret | — | `apps/api/src/lib/sms.ts`; worker notifications via dynamic `email.js`/`sms.js` import |
| `TWILIO_AUTH_TOKEN` | secret | — | `apps/api/src/lib/sms.ts`, `apps/webhook/src/middleware/twilio-verify.ts` |
| `TWILIO_FROM_NUMBER` | config | — | API SMS, webhook inbound routing check, worker `messageLogs` from-address |
| `SENDGRID_API_KEY` | secret | — | `apps/api/src/lib/email.ts`; worker notifications |
| `SENDGRID_FROM_EMAIL` | config | — | API email, worker `messageLogs` from-address |
| `R2_ACCOUNT_ID` | config | — | `packages/config/src/storage.ts` |
| `R2_ACCESS_KEY_ID` | secret | — | `packages/config/src/storage.ts` |
| `R2_SECRET_ACCESS_KEY` | secret | — | `packages/config/src/storage.ts` |
| `R2_BUCKET_NAME` | config | — | `packages/config/src/storage.ts` |
| `APP_URL` | config | — | Auth reset links, Stripe checkout URLs, worker notification deep links |
| `JWT_SECRET` | secret | — | `apps/api/src/lib/tokens.ts`, `booking-hold-token.ts` |
| `JWT_REFRESH_SECRET` | secret | — | `apps/api/src/lib/tokens.ts` |
| `BOOKING_HOLD_TOKEN_SECRET` | secret | — | `apps/api/src/lib/booking-hold-token.ts` (public slot holds; distinct from `JWT_SECRET`) |
| `ACCESS_TOKEN_TTL_SECONDS` | config | — | `auth.service.ts`, `tokens.ts` |
| `REFRESH_TOKEN_TTL_SECONDS` | config | — | `auth.service.ts`, `tokens.ts` |
| `RESET_TOKEN_TTL_SECONDS` | config | — | `tokens.ts` |
| `ESTIMATE_EXPIRY_DAYS` | config | `30` | `estimate.service.ts` |
| `INVOICE_DUE_DAYS` | config | `30` | `invoice.service.ts` |
| `NEXT_PUBLIC_API_URL` | public | `http://localhost:3001` | `apps/web` client + server fetch helpers via `publicEnv` |

## Web-only (not in `env.ts`)

| Variable | Class | Consumers |
| --- | --- | --- |
| `API_URL` | web-server | `apps/web/next.config.ts`, `public-api.ts` — server-side rewrite/fetch origin; falls back to `NEXT_PUBLIC_API_URL` |

Documented in `docs/env/templates/web.env.example`. Consider promoting to `@fsm/config` in a future contract PR if server-only URL must diverge from public URL in all environments.

## Indirect consumers (import graph)

| Package / app | Env access path |
| --- | --- |
| `apps/worker` | Full schema on boot; `csv-import` → `@fsm/config/storage` (R2); `@fsm/ai` → OpenAI; `notifications` → API dist email/SMS modules |
| `packages/db` | `DATABASE_URL` via `client.ts`; `drizzle.config.ts` imports full `env` |
| `packages/jobs` | `REDIS_URL` |
| `packages/ai` | `OPENAI_API_KEY` in prompt HTTP clients |
| `packages/config/storage` | R2 quad |

## Stale references in deployment docs (not in schema)

These appear in `docs/planning/PRODUCTION-DEPLOYMENT.md` but are **not** validated by `env.ts` at the time of FS-76:

- `CORS_ORIGINS`
- `JWT_EXPIRES_IN` (superseded by `ACCESS_TOKEN_TTL_SECONDS` / `REFRESH_TOKEN_TTL_SECONDS` in code)
- `SENDGRID_FROM_NAME`
- `API_URL` on worker/API blocks in deployment doc (web-only today)

Reconcile when FS-93 updates the deployment runbook.

## Client bundle rule

Only `NEXT_PUBLIC_API_URL` is defined in the shared public schema. Verify production builds with:

```bash
# After build, grep dist for known secret prefixes (manual spot-check)
rg 'sk_live_|sk_test_|whsec_|SG\.|AC[a-f0-9]{32}' apps/web/.next -g '!*.map' || true
```

Automated bundle scanning is a Platform CI follow-up.
