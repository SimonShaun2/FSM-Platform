# FS-93 Option A — platform design target (dev broadcast)

**Effective:** 2026-10-22 (founder sign-off on [FS-93 decision proposal](../decisions/FS-93-founder-decision-proposal.md) §7)

## Approved architecture (design only)

| Layer | Provider |
| --- | --- |
| Web | Vercel (Next.js) |
| API / worker / webhook | Railway (long-lived processes) |
| PostgreSQL / Redis | Railway-managed |
| Object storage | Cloudflare R2 |
| Staff auth | In-repo JWT (FS-84 session contract) |

## You may now

- Target **Option A** in docs, env examples, staging matrices, and runbooks for **FS-75, FS-76, FS-80, FS-84, FS-85, FS-92** (and related PRs #61–#63).
- Assume Fastify + BullMQ stay on Railway-class hosting (not Vercel serverless for API/worker).

## You may not (without separate founder OK)

- Create or configure Vercel/Railway/R2 **accounts or projects**
- Store or rotate **production/staging credentials** in repo or agent environments
- **Deploy**, enable production domains, or run **live** Stripe/Twilio/SendGrid traffic
- Treat founder FS-93 approval as **staging provisioning** authorization

**Accounts/secrets:** Shaun only. **Staging spend/provisioning:** explicit second approval.

**ADR:** [ADR-FS-93](../adr/ADR-FS-93-managed-platform-boundaries.md) — Accepted (founder); PO + Security ACK pending.
