# FS-76 — Environment configuration and secrets controls

**Ticket:** [FS-76 — Implement environment configuration and secrets controls](https://app.notion.com/p/401317b92d1581c49195d4cff55672fe)  
**Pair:** Platform / Pair 5 (Infrastructure Dev 2)  
**Risk:** Tenant/Consent  
**Gate:** [FS-93 — Choose managed-platform boundaries](https://app.notion.com/p/401317b92d15817fa00ccf76a6932894) must **Accept** the provider responsibility ADR before any host-specific secret-manager wiring (Railway/Vercel/Supabase dashboards, GitHub Actions secrets, rotation in live accounts).

**Status:** Provider-neutral prep on branch `cursor/fs-76-environment-secrets-controls` — documentation, redacted templates, and repo consistency checks only. No credentials, no live configuration, no deployment.

## Objective

Keep secrets out of source control and document least-privilege configuration per runtime and environment, aligned with the canonical schema in `packages/config/src/env.ts`.

## Canonical sources of truth

| Artifact | Role |
| --- | --- |
| `packages/config/src/env.ts` | Zod schema for shared runtime configuration (all Node services that import `@fsm/config`) |
| `.env.example` | Root local-dev template (all schema keys; empty secret placeholders) |
| `docs/env/templates/*.env.example` | Per-service **minimum** sets for staging/production planning (redacted) |
| `apps/api/src/test-support/env-setup.ts` | Test fixture values (non-production dummies) |
| [FS-76 environment variable inventory](./FS-76-environment-variable-inventory.md) | Keys, classification, and code consumers |
| [FS-76 least-privilege matrix](./FS-76-least-privilege-matrix.md) | Per-service / per-environment access |
| [FS-76 secret rotation runbook](./FS-76-secret-rotation-runbook.md) | Staging vs production rotation and incident steps |

## Injection model (provider-neutral)

Until FS-93 selects the managed secret store and deployment injection path:

1. **Runtime processes** receive configuration as environment variables at process start (12-factor). No secret files in the repository.
2. **Build time** for `apps/web` may embed only `NEXT_PUBLIC_*` values approved for browser exposure.
3. **Server-only** values (`API_URL`, database URLs, signing keys, vendor API keys) must never be prefixed with `NEXT_PUBLIC_` and must not appear in client bundles.
4. **Rotation** updates the secret in the approved store, redeploys or restarts affected services, and validates health checks — documented per class in the rotation runbook.

Host-specific steps (dashboard names, CLI commands, IAM roles) are **explicitly out of scope** for FS-76 and belong to FS-93 + Platform after ADR acceptance.

## Service boundaries (current repository)

| Runtime | Package | Loads `@fsm/config` | Notes |
| --- | --- | --- | --- |
| API | `apps/api` | Yes (full schema) | Auth, Stripe, email/SMS adapters, R2 uploads, queues |
| Webhook | `apps/webhook` | Yes (full schema) | Stripe/Twilio signature verification; shares DB/Redis |
| Worker | `apps/worker` | Yes (full schema) | DB, Redis, R2, OpenAI via `@fsm/ai`; notifications dynamically import `apps/api/dist/lib/email.js` and `sms.js` (same SendGrid/Twilio credentials as API) |
| Web | `apps/web` | Partial (`publicEnv` only) | Plus optional server-only `API_URL` in Next.js (not in Zod schema) |
| Migrations / Drizzle CLI | `packages/db` | Yes (`drizzle.config.ts`) | Needs `DATABASE_URL` only in practice; full schema still validated if `env` is imported |

## Acceptance criteria mapping (FS-76)

| Criterion | This branch | Follow-up (FS-93 / Security / Platform) |
| --- | --- | --- |
| 1. No secrets in tracked source | Inventory + `pnpm check:env-docs`; see `docs/audit/REPOSITORY-RECONCILIATION.md` secret scan | Periodic gitleaks in approved batch CI |
| 2. Approved injection path | Documented model above; templates per service | Implement per FS-93 ADR |
| 3. Rotation demonstrated in non-prod | Runbook with staging checklist | Execute in staging after FS-93 |
| 4. CI / reviewer detects exposure | `check:env-docs` + manual review checklist in runbook | Wire gitleaks to batch CI |
| 5. Least-privilege reviewed | Matrix doc for Security review | Split monolithic env after schema refactor (future) |

## Known documentation drift (do not “fix” live docs in FS-76 without FS-93)

`docs/planning/PRODUCTION-DEPLOYMENT.md` references variables that are **not** in `env.ts` (for example `CORS_ORIGINS`, `JWT_EXPIRES_IN`, `SENDGRID_FROM_NAME`). The consistency script flags these. Reconcile that file when FS-93 accepts the deployment ADR.

## Local verification

```bash
node scripts/check-env-documentation.mjs
```

Add to pair self-review before draft PR; batch CI is not run from this ticket per user directive.

## Reviewers

| Role | Review focus |
| --- | --- |
| **Security** | Least-privilege matrix, rotation runbook, PII/logging notes, FS-93 gate |
| **Technical Lead** | Alignment with FS-93 provider ADR scope |
| **Platform 1** | Template completeness, staging vs prod separation |
| **Peer (Pair 5 partner)** | Consumer inventory accuracy |
| **E.. CoS** | Board evidence, draft PR traceability |
