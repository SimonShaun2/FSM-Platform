# FS-76 — Least-privilege matrix (per service × environment)

**Purpose:** Plan credential scope before FS-93 selects secret-manager hosts.  
**Environments:** `development` (local), `staging`, `production`. Values must **never** be shared across staging and production for secrets.

## Matrix key

- **R** — required at process start (Zod will fail without it)
- **·** — not required for this service to start today (but may still be present if monolithic env is injected)
- **—** — should not be granted (target state; monolithic injection may temporarily violate)

Target state assumes FS-93 enables **per-service secret bundles**. Until then, Railway-style “copy all vars to API + Worker” is documented as **technical debt**.

## Secrets and credentials

| Variable | API | Webhook | Worker | Web | Migrations | Staging vs prod |
| --- | --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | R | R | R | — | R | **Distinct** DB per env; app role without superuser |
| `REDIS_URL` | R | R | R | — | — | **Distinct** instance; auth enabled in cloud |
| `JWT_SECRET` | R | — | — | — | — | **Distinct** per env; ≥32 bytes random |
| `JWT_REFRESH_SECRET` | R | — | — | — | — | **Distinct** per env |
| `BOOKING_HOLD_TOKEN_SECRET` | R | — | — | — | — | **Distinct** per env; rotate independently of session JWT |
| `STRIPE_SECRET_KEY` | R | R | — | — | — | Test keys in staging; live keys prod only |
| `STRIPE_WEBHOOK_SECRET` | — | R | — | — | — | **Separate** endpoint secrets per env |
| `STRIPE_CONNECT_CLIENT_ID` | R | — | — | — | — | Same platform client ID possible; verify in FS-93 |
| `OPENAI_API_KEY` | R¹ | — | R | — | — | Separate project/key per env recommended |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | R | R² | R¹ | — | — | Staging subaccount or test creds |
| `SENDGRID_API_KEY` | R | — | R¹ | — | — | Separate API keys per env |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R | — | R | — | — | **Bucket-scoped** IAM; staging bucket ≠ prod |
| `NEXT_PUBLIC_API_URL` | — | — | — | R | — | Public URL per env (no secrets) |

¹ Worker receives these because it dynamically loads API `email.js` / `sms.js` and runs `@fsm/ai`.  
² Webhook verifies Twilio signatures only (`TWILIO_AUTH_TOKEN`); does not send SMS.

## Non-secret configuration

| Variable | API | Webhook | Worker | Web | Notes |
| --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | R | R | R | R³ | `production` in deployed envs |
| `API_PORT` / `WEBHOOK_PORT` | R | R | — | — | Set by platform or default |
| `APP_URL` | R | R | R | — | Canonical web origin for links |
| `TWILIO_FROM_NUMBER` | R | R | R | — | Staging may use separate number |
| `SENDGRID_FROM_EMAIL` | R | — | R | — | Align with domain auth (FS-93/DNS) |
| `R2_ACCOUNT_ID` / `R2_BUCKET_NAME` | R | — | R | — | Separate buckets per env |
| `STRIPE_PLATFORM_FEE_PERCENT` | R | — | — | — | Config, not secret |
| Token TTLs / invoice / estimate days | R | — | — | — | May differ in staging for faster tests |
| `API_URL` (web only) | — | — | — | R⁴ | Internal API URL if split from public |

³ Next.js sets `NODE_ENV` during build; runtime public env still uses `NEXT_PUBLIC_*`.  
⁴ Optional; use when server-side fetches must not traverse public internet.

## Vendor permission posture (review with Security)

| Integration | API capabilities needed | Webhook | Worker |
| --- | --- | --- | --- |
| PostgreSQL | CRUD on app schema; no `SUPERUSER` | Same | Same |
| Redis | BullMQ commands on app key prefix | Same | Same |
| Stripe | Charges, Connect, customers; **no** unused admin scopes | Webhook verify only | None (target) |
| Twilio | Send SMS | Validate inbound | Send via API module |
| SendGrid | Mail send | — | Send via API module |
| R2/S3 | `PutObject`, `GetObject`, `DeleteObject` on tenant prefix | — | Read for CSV import |
| OpenAI | Chat/completions for mapped prompts | — | Import + revenue jobs |

## Logging and error redaction

| Data | Rule |
| --- | --- |
| Env values | Never log `process.env` dumps in production |
| `DATABASE_URL` / `REDIS_URL` | Redact userinfo in connection error messages (pino serializers) |
| JWT / reset tokens | Debug only; never in API error `message` to clients |
| Stripe/Twilio/SendGrid errors | Log provider error codes, not full request bodies with secrets |

Existing guidance: `AGENTS.md` logging section; FS-8 threat model for tenant data.

## Security sign-off checklist

- [ ] Staging and production secret sets are disjoint for every **secret** row above.
- [ ] Web bundle contains no `sk_`, `whsec_`, `SG.`, or JWT secrets.
- [ ] Webhook service cannot enqueue arbitrary jobs without Redis compromise (queue auth is FS-74+).
- [ ] FS-93 ADR records **who** injects secrets (platform vs Renvani) per runtime.

**Reviewer:** Security (tenant/consent risk on FS-76).
