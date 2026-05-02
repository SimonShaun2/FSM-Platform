# ServiceRev — Production Deployment

**Version:** v3.0.0
**Repo:** SimonShaun2/FSM-Platform

---

## Infrastructure Overview

| Layer | Service | Plan |
|---|---|---|
| Frontend | Vercel | Pro (needed for team + custom domain) |
| API | Railway | Starter → scale as needed |
| Worker | Railway | Same project as API |
| Database | Railway Postgres | Starter (1GB → upgrade as needed) |
| Redis | Railway Redis | Starter |
| File Storage | Cloudflare R2 | Pay as you go |
| Email | SendGrid | Essentials (40K/mo free) |
| SMS | Twilio | Pay as you go |
| Payments | Stripe Connect | Platform account (already set up) |
| Domain | Cloudflare DNS | servicerev.app |

**Total estimated monthly cost at launch:** ~$40–80/mo
(Railway ~$20 + Vercel Pro ~$20 + R2 ~$0–5 + Twilio/SendGrid usage)

---

## Step 1: Railway Setup

### Create Railway project

1. Go to railway.app → New Project → Empty Project
2. Name: `servicerev-production`

### Add Postgres

Railway Dashboard → Add Service → Database → PostgreSQL
- Note the `DATABASE_URL` — copy it
- Run migrations after deploy (step 7)

### Add Redis

Railway Dashboard → Add Service → Database → Redis
- Note the `REDIS_URL` — copy it

### Add API service

Railway Dashboard → Add Service → GitHub Repo
- Repo: `SimonShaun2/FSM-Platform`
- Root directory: `apps/api`
- Build command: `pnpm --filter @fsm/api build`
- Start command: `node dist/server.js`
- Health check path: `/health`

### Add Worker service

Railway Dashboard → Add Service → GitHub Repo (same repo)
- Root directory: `apps/worker`
- Build command: `pnpm --filter @fsm/worker build`
- Start command: `node dist/index.js`
- No health check needed

### Environment variables (API + Worker — set on both)

Set these in Railway → Service → Variables for BOTH the API and Worker services:

```
# Database
DATABASE_URL=postgresql://...  (from Railway Postgres)

# Redis
REDIS_URL=redis://...  (from Railway Redis)

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

### Generate VAPID keys (run once locally)
```bash
npx web-push generate-vapid-keys
# Copy output into Railway env vars
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
2. Repo: `SimonShaun2/FSM-Platform`
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
CNAME   api                     [Railway domain]            ✅ Proxied
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

- Endpoint URL: `https://api.servicerev.app/api/v1/webhooks/stripe`
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
- Copy the webhook signing secret → add to `STRIPE_WEBHOOK_SECRET` in Railway

---

## Step 6: Database Migration (Production)

After Railway API service deploys for the first time:

```bash
# Option A: Run via Railway CLI
railway run --service api pnpm --filter @fsm/db db:migrate

# Option B: Add to API start script (runs on every deploy)
# In apps/api/package.json start script:
# "start": "node -e \"require('./dist/migrate').default()\" && node dist/server.js"
```

**Recommended:** Add a `migrate` script that runs Drizzle migrations before
the server starts. This ensures migrations run on every deploy automatically.

---

## Step 7: Production Config Changes

These code changes must be made before deploying:

### 7a. API: Trust Railway proxy headers
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

# 2. Railway auto-deploys API and Worker from main branch

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
# Verify it processes without error in Railway logs
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

### Infrastructure
- [ ] `GET /health` returns 200 on API
- [ ] Database migration ran — all 17 migrations applied
- [ ] Redis connected — BullMQ queues visible in Railway dashboard
- [ ] Worker service running — check Railway logs for "Worker started"
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
- [ ] Set up Railway alerts: CPU > 80%, Memory > 80%
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

### Monitoring commands
```bash
# Railway logs (live)
railway logs --service api --tail

# Railway logs (worker)
railway logs --service worker --tail

# Check queue depth (Redis)
railway run redis-cli llen bull:fsm:notifications
```

### Scaling triggers
- API memory > 512MB consistently → upgrade Railway plan
- DB connections > 80% → add connection pooling (PgBouncer)
- Worker queue depth > 1000 consistently → add worker replicas

---

## Environment Variables Summary

Quick reference — all values needed before deploy:

```
# Generate locally:
JWT_SECRET          openssl rand -hex 64
VAPID keys          npx web-push generate-vapid-keys

# From Railway (auto-generated):
DATABASE_URL        Railway Postgres → Connect
REDIS_URL           Railway Redis → Connect

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
