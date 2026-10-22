# FS-76 — Secret & credential owner map

**Ticket:** [FS-76](https://app.notion.com/p/401317b92d1581c49195d4cff55672fe) (Pair 5 — Infrastructure)  
**Status:** Draft — documentation only; no credential values.  
**Base branch:** `dev`  
**Companion:** `FS-76-secrets-env-inventory.md` (Diego — env inventory), `FS-76-secret-rotation-runbook.md` (Hana — rotation)

## Ownership model (normative for v1)

| Role | Responsibility |
| --- | --- |
| **Shaun** | **Sole owner** of all **production** integration credentials and platform admin access (Stripe, Twilio, SendGrid, OpenAI, Cloudflare R2, Railway/hosting, database superuser, Redis, JWT signing secrets in prod). Creates, stores, rotates, and revokes prod secrets. |
| **Pair 5 (Diego + Hana)** | Maintain **inventory**, injection paths, and **runbooks**; coordinate **non-production** rotation drills; never create or rotate **production** secrets without Shaun + FS-93 + Security approval. |
| **Security** | Review least-privilege, exposure response, and sign-off on rotation evidence in staging. |
| **E.. CoS (PM)** | Merge approval to `dev`; no secret custody. |

Engineering agents and CI **must not** hold long-lived production secrets in chat, artifacts, or git.

## Credential classes by integration

Names match `@fsm/config` (`packages/config/src/env.ts`) and `.env.example`. **Values are never documented here.**

| Class | Env var names (secret or signing) | Primary consumer(s) | Prod owner | Notes |
| --- | --- | --- | --- | --- |
| **Database** | `DATABASE_URL` | `apps/api`, `apps/worker`, `apps/webhook`, `packages/db` | Shaun | Connection string; least-privilege DB user per environment. |
| **Cache / queues** | `REDIS_URL` | `apps/api`, `apps/worker`, BullMQ | Shaun | |
| **Payments** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID` | `apps/api`, `apps/webhook`, Stripe adapters | Shaun | Webhook secret is per-endpoint; Connect client ID is not as sensitive as secret key but prod-owned. |
| **Payments (config)** | `STRIPE_PLATFORM_FEE_PERCENT` | API / billing | Shaun (policy) | Non-secret numeric; still environment-specific. |
| **AI** | `OPENAI_API_KEY` | `packages/ai`, worker AI jobs | Shaun | |
| **SMS** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | `apps/webhook`, notifications worker | Shaun | Auth token is secret; SID/number are identifiers. |
| **Email** | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | Notifications worker | Shaun | |
| **Object storage** | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Import/uploads adapters | Shaun | Access key pair is secret. |
| **Auth / session** | `JWT_SECRET`, `JWT_REFRESH_SECRET` | `apps/api` auth | Shaun | Rotation invalidates active sessions — planned window required. |
| **Auth / public holds** | `BOOKING_HOLD_TOKEN_SECRET` | `apps/api` booking holds | Shaun | Distinct from session JWT; rotate on API only. |
| **Auth (TTL)** | `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `RESET_TOKEN_TTL_SECONDS` | API auth | Engineering (config) | Not secrets; document per environment. |
| **App URLs** | `APP_URL`, `NEXT_PUBLIC_API_URL`, `API_URL` (web only) | `apps/web`, API links, webhooks | Engineering (config) | Public or server-origin; not signing secrets. |
| **Runtime** | `NODE_ENV`, `API_PORT`, `WEBHOOK_PORT` | All Node services | Engineering (config) | |
| **Product defaults** | `ESTIMATE_EXPIRY_DAYS`, `INVOICE_DUE_DAYS` | API services | Engineering (config) | |

## FS-93 Option A — approved injection model (documentation only)

**Selected:** Vercel (web) + Railway (API, worker, webhook, Postgres, Redis) + Cloudflare R2. Operational detail: [PRODUCTION-DEPLOYMENT.md](../planning/PRODUCTION-DEPLOYMENT.md). This PR does **not** wire secrets in host dashboards or CI.

| Surface | Injection host | Env vars (names only) |
| --- | --- | --- |
| `apps/web` | **Vercel** project environment | `NEXT_PUBLIC_API_URL`, server `API_URL`, `NODE_ENV` |
| `apps/api` | **Railway** service variables | Full `@fsm/config` schema — see `docs/env/templates/api.env.example` |
| `apps/worker` | **Railway** service variables | Full schema today — see `docs/env/templates/worker.env.example` |
| `apps/webhook` | **Railway** service variables | Webhook-focused subset + full schema at startup — see `webhook.env.example` |
| PostgreSQL | **Railway** managed Postgres | `DATABASE_URL` (reference into API/worker/webhook services) |
| Redis | **Railway** managed Redis | `REDIS_URL` |
| Object storage | **Cloudflare R2** | `R2_*`; keys rotated in Cloudflare console, values injected into Railway consumers |

Staging and production each get **separate** Vercel projects / Railway environments (or equivalent) with disjoint secret values.

## Environment boundaries

| Environment | Who may hold secrets | Injection (FS-93 Option A) |
| --- | --- | --- |
| **Local / preview** | Individual developer | `.env` from `.env.example` (gitignored); no prod values |
| **Staging** | Platform + Pair 5 for drills | Vercel + Railway staging env vars; R2 staging bucket keys |
| **Production** | **Shaun only** | Vercel + Railway production env vars; no copies in Notion/Slack/CI logs |

## Escalation

1. Suspected leak → follow `FS-76-secret-rotation-runbook.md` § Incident (Shaun executes prod revocation).
2. New integration → add row to inventory + this map before merge to `dev`.
3. Automated secret sync / scanner CI → out of scope for FS-76; production rotation by agents remains **out of scope** without Shaun approval.
