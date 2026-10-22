# Environment templates (FS-76)

Redacted examples for planning injection per runtime. **Do not commit filled-in files.**

| Template | Use |
| --- | --- |
| [local-dev.env.example](./templates/local-dev.env.example) | Full local stack (`pnpm dev`) — mirrors root `.env.example` |
| [api.env.example](./templates/api.env.example) | `apps/api` minimum |
| [webhook.env.example](./templates/webhook.env.example) | `apps/webhook` minimum |
| [worker.env.example](./templates/worker.env.example) | `apps/worker` minimum (monolithic until per-service bundles) |
| [web.env.example](./templates/web.env.example) | `apps/web` — public + server-only URLs |
| [migrations.env.example](./templates/migrations.env.example) | Drizzle CLI / one-off migrations |

**Inventory:** [FS-76-secrets-env-inventory.md](../security/FS-76-secrets-env-inventory.md)  

**FS-93 Option A (approved):** Vercel (`apps/web`) + Railway (`apps/api`, `apps/worker`, `apps/webhook`, Postgres, Redis) + Cloudflare R2. See [PRODUCTION-DEPLOYMENT.md](../planning/PRODUCTION-DEPLOYMENT.md) and the per-host table in the [owner map](../security/FS-76-secret-owner-map.md#fs-93-option-a--approved-injection-model-documentation-only). No live secret wiring in this ticket.

| Surface | Host |
| --- | --- |
| `apps/web` | Vercel project env |
| `apps/api`, `apps/worker`, `apps/webhook` | Railway service variables |
| Postgres / Redis | Railway connect strings → `DATABASE_URL`, `REDIS_URL` |
| Files | R2 keys → Railway services that import `@fsm/config/storage` |

Validate templates against schema:

```bash
pnpm check:env-docs
```
