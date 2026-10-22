# FS-76 — Secret rotation and revocation runbook

**Scope:** Procedures only. **Do not** rotate production credentials from this ticket. Staging drills require Platform authorization and FS-93-approved secret store access.

## Principles

1. **Rotate in staging first** — prove the runbook, then schedule production in a change window (founder authorization for live money vendors).
2. **One secret class at a time** — reduces blast radius and simplifies rollback.
3. **Dual-write window** where the vendor supports it (e.g. two Stripe webhook secrets during cutover).
4. **Invalidate sessions** when rotating `JWT_SECRET` or `JWT_REFRESH_SECRET` (all users re-login).
5. **Record** ticket ID, actor, timestamp, and affected services in the activity/outbox audit trail (operational log until FS-42 audit automation).

## Environment separation

| Action | Staging | Production |
| --- | --- | --- |
| Secret material | Test/sandbox keys only | Live keys; founder approval for Stripe/Twilio |
| `APP_URL` / `NEXT_PUBLIC_API_URL` | Staging hostnames | Production hostnames |
| Database | Staging cluster | Production cluster — **no copy of prod data with live secrets into staging** without sanitization |
| Webhook endpoints | Staging URLs registered in vendor dashboards | Production URLs |

## Rotation procedures (provider-neutral)

### A. `JWT_SECRET` / `JWT_REFRESH_SECRET` / `BOOKING_HOLD_TOKEN_SECRET`

Rotate `BOOKING_HOLD_TOKEN_SECRET` on **API only**; invalidates in-flight public slot-hold tokens without logging out staff sessions.

### A2. Session JWT (`JWT_SECRET` / `JWT_REFRESH_SECRET` only)

| Step | Staging | Production |
| --- | --- | --- |
| 1 | Generate new random values (`openssl rand -hex 64`) | Same |
| 2 | Update secret store; deploy **API only** first | Maintenance window — expect forced logout |
| 3 | Smoke: login, refresh, password reset | Monitor auth error rate |
| 4 | Revoke old value from store | Same |
| Rollback | Restore previous secret; redeploy API | Same |

### B. `DATABASE_URL` (password rotation)

| Step | Staging | Production |
| --- | --- | --- |
| 1 | Create new DB user/password with same grants | Use provider rotation feature if available |
| 2 | Update secret; rolling restart API → Worker → Webhook | Failover-aware restart per FS-93 DB ADR |
| 3 | Run migrations smoke (`pnpm --filter @fsm/db`) | Batch CI evidence |
| 4 | Drop old DB credential | After 24h soak |

### C. `REDIS_URL`

Rotate password in Redis provider; restart all consumers (API, Worker, Webhook) within minutes to avoid auth errors.

### D. Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)

| Step | Staging | Production |
| --- | --- | --- |
| 1 | Roll keys in Stripe Dashboard (test mode) | Live mode — founder only |
| 2 | Update API + Webhook env | Webhook secret must match new signing secret |
| 3 | Send test `payment_intent.succeeded` via Stripe CLI | Verify idempotent webhook handler |
| 4 | Revoke old API key in Dashboard | Same |

**Never** rotate live Stripe without webhook handler verification on staging test mode first.

### E. Twilio / SendGrid

1. Create new API key / auth token in vendor console.  
2. Update API (and Worker if notifications enabled).  
3. Update Webhook `TWILIO_AUTH_TOKEN` if inbound SMS is enabled.  
4. Send test SMS/email from staging.  
5. Revoke old key.

### F. R2 (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`)

1. Issue new scoped key with same bucket permissions.  
2. Deploy API + Worker.  
3. Upload/download smoke test.  
4. Delete old key in Cloudflare dashboard.

### G. `OPENAI_API_KEY`

1. Create new project key.  
2. Deploy Worker (AI jobs).  
3. Run CSV import mapping smoke or unit tests.  
4. Revoke old key.

## Incident: suspected secret exposure

| Priority | Action |
| --- | --- |
| P0 | Revoke exposed credential at vendor immediately |
| P0 | Rotate dependent secrets (e.g. DB if `DATABASE_URL` leaked) |
| P1 | Search git history / logs for exfiltration (`gitleaks`, log review) |
| P1 | Notify Security + E.. CoS; link FS-8 threat model |
| P2 | Post-incident: update this runbook if steps failed |

## Staging drill checklist (acceptance criterion 3 — execution gated)

- [ ] FS-93 ADR **Accepted** — secret injection path documented  
- [ ] Platform schedules staging window  
- [ ] Rotate **one** non-production secret (recommended: `JWT_SECRET` on staging API)  
- [ ] Capture: before/after health checks, auth smoke, rollback tested  
- [ ] Security signs drill record on Notion FS-76 evidence field  

## Repo safeguards (no live secrets)

```bash
node scripts/check-env-documentation.mjs
```

Pair review: confirm PR diff contains no literal `sk_`, `whsec_`, or high-entropy assigned secrets.
