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

**Gate:** Host-specific secret-manager configuration waits on [FS-93](https://app.notion.com/p/401317b92d15817fa00ccf76a6932894).

Validate templates against schema:

```bash
pnpm check:env-docs
```
