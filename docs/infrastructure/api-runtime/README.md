# Stateless API runtime (FS-79)

**Ticket:** [FS-79](https://app.notion.com/p/401317b92d15814d91aff63219d13cb8)  
**Gate:** No provider deploy/IaC until [FS-93](https://app.notion.com/p/401317b92d15817fa00ccf76a6932894) approves managed-platform boundaries.

## Deployment unit

- One **stateless** Node process per instance: `apps/api` (`pnpm --filter @fsm/api start`).
- **No in-process session state** — auth uses JWT; durable work uses PostgreSQL, Redis/BullMQ, and object storage.
- Optional `API_INSTANCE_ID` env for load-balancer correlation in health JSON (not required locally).

## Health endpoints (unauthenticated)

| Route | Role | Success | Failure |
|-------|------|---------|---------|
| `GET /health` | Liveness (process up) | 200 | — |
| `GET /health/live` | Liveness alias | 200 | — |
| `GET /health/ready` | Readiness (DB + Redis + object storage) | 200 | 503 |
| `GET /health/db` | Database probe only | 200 | 503 |
| `GET /health/redis` | Redis probe only | 200 | 503 |
| `GET /health/storage` | Object storage (`HeadBucket`) only | 200 | 503 |

`apps/webhook` exposes `GET /health` → `{ status: "ok", service: "webhook" }` (liveness only).

Platform wiring (post–FS-93): point liveness to `/health` or `/health/live`; readiness to `/health/ready`.

## Graceful shutdown

`server.ts` handles `SIGINT` / `SIGTERM` by calling `app.close()` so in-flight HTTP requests can drain before exit. Workers and webhooks use separate processes.

## Horizontal scaling (design)

- Scale API replicas independently; each instance runs the same image and env config.
- Size PostgreSQL pool per instance (`postgres` client `max` in `@fsm/db`) against cluster connection budget.
- Sticky sessions are **not** required for API traffic.
