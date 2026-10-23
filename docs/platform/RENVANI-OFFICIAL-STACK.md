# Renvani official stack (operator reference)

**Authority:** [ADR-FS-STACK](../adr/ADR-FS-STACK-renvani-official-platform.md) (founder 2026-10-23)  
**Accounts:** Created and billed by **Shaun** only — see ADR § “Founder-owned accounts”.

## At a glance

```text
[Users] → Vercel (web) → Render API ─┬→ Neon (Postgres)
                                      ├→ Render Key Value (BullMQ)
                                      ├→ R2 (files)
                                      └→ Clerk (auth) / Stripe / Resend / Twilio / OpenAI
Observability: Sentry · PostHog · Langfuse · pino logs
```

## Environments

| Env | Vercel | Render | Neon | Stripe | Clerk |
| --- | --- | --- | --- | --- | --- |
| **dev** | Preview / local | Optional shared | Dev branch/DB | Test | Dev instance |
| **staging** | Preview or staging | Staging services | Staging DB | Test | Staging |
| **prod** | Production | Production | Prod DB | **Live (Shaun)** | Production |

## Where to look in repo (today vs target)

| Concern | Today (`dev`) | Target |
| --- | --- | --- |
| DB URL | `DATABASE_URL` (generic Postgres) | Neon connection strings per env |
| Auth | JWT + refresh in API | Clerk + mapped `companyId` |
| Email | SendGrid adapter | Resend adapter |
| Deploy narrative | FS-93 Render Postgres + JWT | This stack doc |

Full conflict matrix and ticket mapping: ADR-FS-STACK + `MVP-P0-ASSIGNMENTS.md` § Official stack.
