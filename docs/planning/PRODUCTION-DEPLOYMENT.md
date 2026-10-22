# ServiceRev — Production Deployment

**Version:** v3.1.0 (Render reconciliation — docs only; see [ADR-FS-93](../adr/ADR-FS-93-managed-platform-boundaries.md) when merged)  
**Repo:** SimonShaun2/Renvani (formerly FSM-Platform)  
**Platform decision:** Vercel (web) + Render (API, worker, webhook, Postgres, Key Value) + Cloudflare R2 + in-repo JWT. Key Value **`maxmemoryPolicy: noeviction`** required for BullMQ.

---

## Infrastructure Overview

| Layer | Service | Plan |
|---|---|---|
| Frontend | Vercel | Pro (needed for team + custom domain) |
| API | Render **web service** (`apps/api`) | Starter → scale as needed |
| Worker | Render **background worker** (`apps/worker`) | Same Blueprint / project as API |
| Webhook | Render **web service** (`apps/webhook`) | Stripe + Twilio ingress |
| Database | Render Postgres | Starter → upgrade as needed |
| Queues | Render **Key Value** (Redis-compatible) | Starter+; **`noeviction`** policy |
| File Storage | Cloudflare R2 | Pay as you go |
| Email | SendGrid | Essentials (40K/mo free) |
| SMS | Twilio | Pay as you go |
| Payments | Stripe Connect | Platform account (already set up) |
| Domain | Cloudflare DNS | servicerev.app |

**Total estimated monthly cost at launch:** ~$50–120/mo  
(Render web + worker + webhook + Postgres + Key Value + Vercel Pro + R2 ~$0–5 + Twilio/SendGrid usage)

**Reference runbook (FS-93):** [FS-93 Render runbook](../platform/FS-93-render-runbook.md) and [blueprint draft](../infrastructure/render-blueprint.render.yaml) (not applied until founder authorizes staging).

---

## Step 1: Render Setup

### Create Render workspace / Blueprint (when authorized)

1. Go to [render.com](https://render.com) → Dashboard (founder-owned account).
2. **Option A — Blueprint:** Import repo and use `render.yaml` from a reviewed platform PR (draft reference: `docs/infrastructure/render-blueprint.render.yaml`). Approve resource list; set `sync: false` secrets in the dashboard.
3. **Option B — Manual:** Create services below in one project/region.

### Add Postgres

Render Dashboard → **New** → **PostgreSQL**

- Name: `renvani-postgres` (or per blueprint)
- Note **Internal Database URL** → `DATABASE_URL`
- Run migrations after first API deploy (Step 6)

### Add Key Value (BullMQ)

Render Dashboard → **New** → **Key Value**

- Name: `renvani-bullmq-kv`
- **Maxmemory policy:** `noeviction` (required for job queues — do not use default `allkeys-lru`)
- **Inbound IP rules:** internal only (`ipAllowList: []` in blueprint) unless you have a documented need for public Redis
- Note **Internal Redis URL** → `REDIS_URL`

### Add API web service

Render Dashboard → **New** → **Web Service** → connect GitHub repo `SimonShaun2/Renvani`

| Setting | Value |
|---|---|
| Root directory | Repository root (monorepo) |
| Build command | `corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm build` |
| Start command | `corepack pnpm --filter @fsm/api start` |
| Health check path | `/health` (after Step 7b) |

Render sets `PORT`; ensure the API listens on `process.env.PORT`.

### Add background worker

Render Dashboard → **New** → **Background Worker** (same repo)

| Setting | Value |
|---|---|
| Build command | Same as API |
| Start command | `corepack pnpm --filter @fsm/worker start` |

No HTTP health check. Scale on queue depth.

### Add webhook web service

Render Dashboard → **New** → **Web Service** (same repo)

| Setting | Value |
|---|---|
| Build command | Same as API |
| Start command | `corepack pnpm --filter @fsm/webhook start` |

Routes: `POST /stripe`, `POST /twilio` (see `apps/webhook`). Assign a public URL (e.g. `webhooks.servicerev.app`).

### Environment variables (API + Worker + Webhook)

Set in Render → each service → **Environment**. API and worker share the full app surface; webhook needs DB, Redis, Stripe, and Twilio vars at minimum.

**API and Worker (both):**

```
# Database
DATABASE_URL=postgresql://...  (from Render Postgres — internal URL)

# Redis / BullMQ
REDIS_URL=redis://...  (from Render Key Value — internal URL)

# App
NODE_ENV=production
APP_URL=https://app.servicerev.app
API_URL=https://api.servicerev.app
CORS_ORIGINS=https://servicerev.app,https://app.servicerev.app

# Auth
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=2.9

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# SendGrid
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@servicerev.app
SENDGRID_FROM_NAME=ServiceRev

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=servicerev-production
R2_PUBLIC_URL=https://files.servicerev.app

# OpenAI (AI features)
OPENAI_API_KEY=sk-...

# Web Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@servicerev.app

# Worker only
WORKER_CONCURRENCY=5
```

**Webhook service (add / overlap):**

```
DATABASE_URL=...
REDIS_URL=...
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
TWILIO_AUTH_TOKEN=...
```

### Generate VAPID keys (run once locally)

```bash
npx web-push generate-vapid-keys
# Copy output into Render env vars (API / worker)
```

### Generate JWT secret (run once locally)

```bash
openssl rand -hex 64
# Copy output into JWT_SECRET
```

---

## Step 2: Vercel Setup

### Create Vercel project

1. Go to vercel.com → New Project → Import Git Repository
2. Repo: `SimonShaun2/Renvani`
3. Framework: Next.js
4. Root directory: `apps/web`
5. Build command: `pnpm --filter @fsm/web build`
6. Output directory: `.next`
7. Install command: `pnpm install`

### Environment variables (Vercel)

Set in Vercel → Project → Settings → Environment Variables:

```
# API
NEXT_PUBLIC_API_URL=https://api.servicerev.app
NEXT_PUBLIC_APP_URL=https://app.servicerev.app

# Auth
NEXT_PUBLIC_JWT_STORAGE_KEY=servicerev_token

# Booking
NEXT_PUBLIC_BOOKING_BASE_URL=https://servicerev.app

# Push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as above — PUBLIC key only>

# Stripe (public key only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Analytics (add later)
# NEXT_PUBLIC_POSTHOG_KEY=...
```

### Vercel domains

In Vercel → Project → Domains:

- Add `servicerev.app` → landing page (root `/`)
- Add `app.servicerev.app` → the app (all authenticated routes)

The monorepo has one Next.js app. Use Vercel's domain-based routing
or middleware to handle `servicerev.app` → landing, `app.servicerev.app` → app.

---

## Step 3: Cloudflare R2 Setup

1. Cloudflare Dashboard → R2 → Create Bucket
2. Name: `servicerev-production`
3. Region: Auto
4. Create API token with R2 Read+Write permissions
5. Set up custom domain: `files.servicerev.app` → R2 public bucket
6. CORS settings for the bucket:

```json
[
  {
    "AllowedOrigins": ["https://servicerev.app", "https://app.servicerev.app"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Step 4: Domain Setup (Cloudflare DNS)

All DNS managed in Cloudflare. Set these records:

```
Type    Name                    Value                       Proxy
A       servicerev.app          76.76.21.21 (Vercel)        ✅ Proxied
CNAME   app                     cname.vercel-dns.com        ✅ Proxied
CNAME   api                     [Render API service host]   ✅ Proxied
CNAME   webhooks                [Render webhook service host] ✅ Proxied
CNAME   files                   [R2 public bucket domain]   ✅ Proxied
```

### Email sending (SendGrid)

Add these DNS records for SendGrid domain verification:

```
CNAME   em1234.servicerev.app   u1234.wl.sendgrid.net
CNAME   s1._domainkey           s1.domainkey.u1234.wl.sendgrid.net
CNAME   s2._domainkey           s2.domainkey.u1234.wl.sendgrid.net
TXT     servicerev.app          v=spf1 include:sendgrid.net ~all
```

(SendGrid provides exact values in their dashboard)

---

## Step 5: Stripe Webhook Setup

In Stripe Dashboard → Developers → Webhooks → Add endpoint:

- Endpoint URL: `https://webhooks.servicerev.app/stripe` (dedicated webhook service — `apps/webhook`)
- Events to listen to:

  ```
  payment_intent.succeeded
  payment_intent.payment_failed
  customer.subscription.created
  customer.subscription.updated
  customer.subscription.deleted
  invoice.paid
  invoice.payment_failed
  account.updated  (for Connect)
  ```

- Copy the webhook signing secret → add to `STRIPE_WEBHOOK_SECRET` on the **webhook** Render service (and API if shared handlers require it)

Twilio inbound SMS: configure Twilio webhook URL to `https://webhooks.servicerev.app/twilio`.

---

## Step 6: Database Migration (Production)

After the Render API service deploys for the first time:

```bash
# Option A: Render Shell (one-off) on API service
# Dashboard → renvani-api → Shell
corepack pnpm --filter @fsm/db db:migrate

# Option B: Add to API start script (runs on every deploy)
# In apps/api/package.json start script:
# "start": "node -e \"require('./dist/migrate').default()\" && node dist/server.js"
```

**Recommended:** Add a `migrate` script that runs Drizzle migrations before
the server starts. This ensures migrations run on every deploy automatically.

---

## Step 7: Production Config Changes

These code changes must be made before deploying:

### 7a. API: Trust Render proxy headers

`apps/api/src/app.ts`

```typescript
// Add to Fastify options:
trustProxy: true,
```

### 7b. API: Health check endpoint

`apps/api/src/routes/health/index.ts`

```typescript
fastify.get('/health', async () => ({
  status: 'ok',
  version: process.env.npm_package_version,
  timestamp: new Date().toISOString(),
}));
```

### 7c. Worker: Graceful shutdown

`apps/worker/src/index.ts`

```typescript
process.on('SIGTERM', async () => {
  await worker.close();
  await redisConnection.quit();
  process.exit(0);
});
```

### 7d. Next.js: Add domain config

`apps/web/next.config.ts`

```typescript
const nextConfig = {
  images: {
    domains: ['files.servicerev.app'],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
  },
};
```

### 7e. CORS: Add production origins

`packages/config/src/index.ts` (or wherever CORS is configured)

```typescript
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') ?? [
  'http://localhost:3000',
];
```

### 7f. Run migrations automatically on deploy

`apps/api/src/server.ts`

```typescript
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '@fsm/db';

// Before starting server:
await migrate(db, { migrationsFolder: '../../packages/db/migrations' });
```

---

## Step 8: Deploy Sequence

Run in this order:

```bash
# 1. Make production config changes (Step 7)
git add .
git commit -m "chore: production config for deployment"
git push origin main

# 2. Render auto-deploys API, worker, and webhook from connected branch

# 3. Vercel auto-deploys web from main branch

# 4. Verify health check
curl https://api.servicerev.app/health
# Expected: { "status": "ok", "version": "...", "timestamp": "..." }

# 5. Verify database migration ran
curl https://api.servicerev.app/health/db
# (Add this endpoint to check DB connectivity)

# 6. Test auth flow end to end
# Create test company → login → verify JWT → check dashboard loads

# 7. Test booking flow end to end
# Visit https://servicerev.app/book/test-company
# Submit booking → verify it lands in dispatch queue

# 8. Test Stripe webhook
# Stripe Dashboard → Webhooks → Send test event
# Verify it processes without error in Render webhook service logs
```

---

## Step 9: Go-Live Checklist

Complete every item before sending real traffic:

### Security

- [ ] JWT_SECRET is 64+ random hex chars (not a word or phrase)
- [ ] STRIPE_SECRET_KEY is `sk_live_` (not `sk_test_`)
- [ ] Stripe webhook secret is from the live webhook endpoint
- [ ] CORS_ORIGINS only includes production domains
- [ ] R2 bucket is NOT public by default (only served via CDN domain)
- [ ] No `.env` files committed to git
- [ ] Render Key Value uses **`noeviction`** (BullMQ)

### Infrastructure

- [ ] `GET /health` returns 200 on API
- [ ] Database migration ran — all migrations applied
- [ ] Redis connected — worker processing jobs; Key Value memory monitored
- [ ] Worker service running — Render logs show worker startup
- [ ] Webhook service reachable at `webhooks.servicerev.app`
- [ ] R2 bucket created, CORS configured
- [ ] All DNS records propagated (check with `dig servicerev.app`)

### Email / SMS

- [ ] SendGrid domain verified (green checkmarks in SendGrid)
- [ ] Send test email via API — verify delivery
- [ ] Twilio number active and verified
- [ ] Send test SMS via API — verify delivery
- [ ] OTW notification flow tested end to end

### Payments

- [ ] Stripe Connect platform account live mode enabled
- [ ] Test Stripe Connect onboarding flow with a test company
- [ ] Stripe webhook receiving events (check Stripe dashboard)
- [ ] Payment link generated and loads in browser

### App

- [ ] Landing page loads at `servicerev.app`
- [ ] Authenticated users redirect to `app.servicerev.app/dashboard`
- [ ] Login flow works end to end
- [ ] Role-based routing works (owner → dashboard, tech → mobile/jobs)
- [ ] CSV import works with a real file
- [ ] Online booking flow works end to end
- [ ] Customer portal magic link flow works

### Monitoring (add before going live)

- [ ] Set up Render notifications: deploy failures, instance health
- [ ] Set up Vercel analytics (free tier)
- [ ] Set up UptimeRobot (free): ping `/health` every 5 min

---

## Step 10: Post-Launch

### First customer onboarding flow

1. Owner signs up at `servicerev.app`
2. Redirected to CSV import wizard (`/onboarding/import`)
3. Uploads customer list
4. AI maps columns, detects duplicates
5. AI Revenue Engine scans on first import
6. Owner sees opportunities on dashboard immediately

### Monitoring

- **Render Dashboard** → each service → **Logs** (API, worker, webhook)
- **Metrics:** CPU/memory per service; Key Value memory (critical with `noeviction`)
- **Queue depth:** inspect via Redis CLI from Render Shell on Key Value or app diagnostics (avoid public Redis)

### Scaling triggers

- API memory > 512MB consistently → upgrade Render plan or horizontal scale
- DB connections > 80% → add connection pooling (FS-80 policy)
- Worker queue depth > 1000 consistently → add worker instances
- Key Value memory near limit → upgrade Key Value plan or reduce retained job data

---

## Environment Variables Summary

Quick reference — all values needed before deploy:

```
# Generate locally:
JWT_SECRET          openssl rand -hex 64
VAPID keys          npx web-push generate-vapid-keys

# From Render (auto-generated):
DATABASE_URL        Postgres → Internal Connection String
REDIS_URL           Key Value → Internal Connection String

# From Stripe Dashboard:
STRIPE_SECRET_KEY               Developers → API keys → Secret key
STRIPE_WEBHOOK_SECRET           Developers → Webhooks → Signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE  Developers → API keys → Publishable key

# From Twilio Console:
TWILIO_ACCOUNT_SID      Console Dashboard
TWILIO_AUTH_TOKEN       Console Dashboard
TWILIO_FROM_NUMBER      Phone Numbers → Active Numbers

# From SendGrid:
SENDGRID_API_KEY        Settings → API Keys → Create API Key

# From Cloudflare R2:
R2_ACCOUNT_ID           Workers & Pages → Overview (Account ID)
R2_ACCESS_KEY_ID        R2 → Manage R2 API Tokens
R2_SECRET_ACCESS_KEY    R2 → Manage R2 API Tokens

# From OpenAI:
OPENAI_API_KEY          platform.openai.com → API Keys
```
