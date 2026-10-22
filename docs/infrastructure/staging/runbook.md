# Staging runbook (provider-neutral)

**FS-75** · **Owner:** Platform 1 (Infrastructure Dev 1) · **Blocked steps** require FS-93 ADR approval.

## 1. Preconditions

- [ ] FS-93 ADR approved (hosting, secrets store, DNS, observability owner)
- [ ] Staging env template reviewed: `config/env/staging.env.example`
- [ ] Boundary validator passes locally (see below)
- [ ] Backend health endpoints available for smoke (coordinate Pair 1 / API — separate PR if not on `dev`)

## 2. Provision (do not execute until FS-93)

> **Stop:** Provider account creation, credential issuance, and deploy hooks are **out of scope** for FS-75 and forbidden until FS-93 is approved and founder/Platform authorizes spend.

Checklist to complete **after** FS-93 names the provider:

1. Create isolated `postgres`, `redis`, and object storage resources (staging names).
2. Deploy four services: `web`, `api`, `webhook`, `worker` (see [service-inventory.md](./service-inventory.md)).
3. Inject secrets per service scope; set `RENVANI_DEPLOYMENT_TIER=staging`.
4. Run migrations once per deploy: `pnpm --filter @fsm/db db:migrate` (exact job owner TBD in FS-93 ADR).
5. Register Stripe **test** webhooks to staging `webhook` URL.

Record provision evidence (project IDs, URLs, SHA) on FS-75 board Evidence field.

## 3. Local boundary validation (allowed now)

```bash
cp config/env/staging.env.example /tmp/renvani-staging.env
# Edit /tmp/renvani-staging.env with non-secret placeholders or test keys — never commit.

node scripts/staging/validate-env-boundaries.mjs --tier staging /tmp/renvani-staging.env
```

## 4. Smoke checks (template)

Dry-run (documents steps only):

```bash
bash scripts/staging/smoke-check.template.sh --dry-run
```

Live smoke (after staging URLs exist and health routes ship):

```bash
export STAGING_API_URL=https://api.staging.example
export STAGING_WEB_URL=https://app.staging.example
export STAGING_WEBHOOK_URL=https://webhooks.staging.example
bash scripts/staging/smoke-check.template.sh
```

Expected checks (FS-75 acceptance targets):

| Check | Endpoint / action |
|-------|-------------------|
| API liveness | `GET $STAGING_API_URL/health` → 200 |
| API data plane | `GET $STAGING_API_URL/health/db` → 200 or documented 503 |
| Web | `GET $STAGING_WEB_URL` → 200 |
| Webhook | `GET $STAGING_WEBHOOK_URL/health` → 200 |
| Worker | Queue consumer heartbeat / job processed (observability TBD) |
| Object storage | Signed upload smoke via API attachment route (QA script TBD) |

## 5. Synthetic seed and reset

**Seed (post-provision):** document seed entrypoint when available (`packages/db` seed scripts or dedicated staging seed ticket). Until then: manual creation of one company + owner via signup flow on staging.

**Reset (staging only):**

1. Scale worker to 0 (stop job processing).
2. Drop and recreate database; re-run migrations.
3. Flush Redis staging instance.
4. Remove objects under staging bucket prefix.
5. Scale worker up; re-seed synthetic data.

Never run reset against production identifiers.

## 6. Teardown

1. Delete staging DNS records (FS-93 owner).
2. Destroy staging data plane resources after backup if required for audit.
3. Revoke staging API keys in Stripe/Twilio/SendGrid/OpenAI dashboards.
4. Archive Evidence on FS-75.

## 7. CI integration (future)

Staging smoke in **approved batch** or post-merge workflow requires E.. CoS authorization per `GITHUB_WORKFLOW.md`. FS-75 does not add GitHub Actions workflows.

## Handoff

| Next ticket | Responsibility |
|-------------|----------------|
| **FS-93** | Provider ADR, account layout, IaC/deploy binding |
| **FS-76** (env controls) | Optional integration fields in `env.ts` |
| API pair | `/health` routes if not present |
| Platform 2 | Observability + backup drill on staging |
