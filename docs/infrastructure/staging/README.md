# Staging foundation (FS-75)

**Ticket:** [FS-75 — Provision isolated staging environment](https://app.notion.com/p/401317b92d15812ab3ccc3a0e1165111)  
**Gate:** [FS-93 — Choose managed-platform boundaries](https://app.notion.com/p/401317b92d15817fa00ccf76a6932894) must be **approved** before provider account provisioning, credential issuance, or provider-specific IaC.  
**Authority:** `AGENTS.md`, `TEAM.md`, `GITHUB_WORKFLOW.md`, PR #59 `BUILD_LAYERS.md` (Footings).

This folder holds **provider-neutral** staging design and runbook material. It does not provision cloud resources or store secrets.

## Documents

| File | Purpose |
|------|---------|
| [service-inventory.md](./service-inventory.md) | Logical services, repo mapping, dependencies |
| [environment-boundary-matrix.md](./environment-boundary-matrix.md) | Per-environment isolation rules |
| [secrets-and-integrations.md](./secrets-and-integrations.md) | Data/secret boundaries and non-live payment/auth rules |
| [runbook.md](./runbook.md) | Setup, smoke, reset, teardown (pre/post FS-93) |

## Repo artifacts

| Path | Purpose |
|------|---------|
| `config/env/staging.env.example` | Staging env template (no secrets) |
| `packages/config/src/deployment-environment.ts` | Tier + non-live integration validation |
| `scripts/staging/validate-env-boundaries.mjs` | Local boundary check against an env file |
| `scripts/staging/smoke-check.template.sh` | Documented smoke steps (dry-run by default) |

## Local verification (allowed before batch CI)

```bash
corepack pnpm --filter @fsm/config build
corepack pnpm --filter @fsm/config test
node scripts/staging/validate-env-boundaries.mjs --tier staging config/env/staging.env.example
```
