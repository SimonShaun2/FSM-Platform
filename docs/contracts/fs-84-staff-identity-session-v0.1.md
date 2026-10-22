# FS-84 — Staff identity & session controls (provider-neutral v0.1)

**Ticket:** [FS-84](https://app.notion.com/p/401317b92d1581bf8c25ef10aebae676)  
**Author:** Backend Dev 1 (Pair 1)  
**Status:** Ready for peer review — provider-neutral slice complete on `cursor/fs-84-staff-identity-session`  
**Blocked (follow-on work):** FS-93 / PR #59 identity-provider ADR (Security ACK before schema, transport, vendor); ADR-0002 membership (invites)

## Objective

Ship trusted staff identity for protected backend paths without selecting an identity vendor or changing auth transport until FS-93 and Security approve.

## Current implementation map (`dev` baseline)

| Area | Path | Notes |
|------|------|--------|
| Register / login / refresh / logout | `apps/api/src/services/auth.service.ts` | bcrypt passwords; refresh rotation; activity events |
| HTTP routes | `apps/api/src/routes/auth/` | Zod validation |
| Access JWT verify | `apps/api/src/lib/tokens.ts` | `userId`, `companyId`, `role` in access token |
| Request auth | `apps/api/src/plugins/authenticate.ts` | Loads user + company from DB; **role from DB** |
| Role guard | `apps/api/src/lib/authorize.ts` | `requireRole` |
| Tests | `auth.service.test.ts`, `auth-company.routes.test.ts` | Extended in FS-84 for session negatives |

Shared contract (no provider): `packages/types/src/staff-identity/v0/` — `STAFF_SESSION_CONTRACT_VERSION` `0.1.0`.

## Acceptance criteria traceability

| # | Criterion | v0.1 status | Evidence / next owner |
|---|-----------|-------------|------------------------|
| 1 | Approved ADR for identity source, session model, membership, revocation | **BLOCKED — FS-93** | No ADR file; TL + Security before schema/provider |
| 2 | No access before invite accepted + valid membership | **BLOCKED — membership model** | Today: self-serve `register` only; no `user_invites` |
| 3 | Revoked / expired / disabled / wrong-tenant / insufficient role denied | **Partial (slice done)** | Tests: inactive login/refresh/authorize; cross-company JWT → 403; JWT role escalation ignored (DB role). Access JWT until TTL after deactivate — **documented gap** (FS-93) |
| 4 | Rate limits + non-enumerating login/invite/recovery | **Partial** | Forgot-password non-enumerating (tests). Login/invite limits **BLOCKED** post-FS-93 |
| 5 | HttpOnly cookies + CSRF where cookie sessions | **BLOCKED — transport ADR** | Web uses JS-readable cookies (`apps/web/src/lib/auth.ts`); no API change in FS-84 |
| 6 | Security review + lifecycle integration tests | **Ready for Security** | Provider-neutral negatives in place; full lifecycle blocked on FS-93 |

## In scope (this branch)

- Provider-neutral session contract in `@fsm/types`.
- Document map + blocked items.
- Authenticate hardening: reject when `user.companyId !== company.id`.
- Negative tests: unauthenticated, cross-company token, inactive user.

## Out of scope (explicit)

- Database migrations (`user_invites`, MFA, session listing).
- Identity vendor (Auth0, Clerk, etc.).
- Cookie/BFF transport changes.
- Login/invite rate limiting (Redis — coordinate with Platform / FS-21 patterns).
- Worker/webhook session propagation (separate FS; workers use job payload `companyId` today).

## Reviewer handoff

- **Peer (Pair 1 B):** contract shape + test coverage.
- **Security:** FS-8 NT rows for auth when FS-93 ADR lands.
- **TL:** fold FS-93 ADR; align with ADR-0002 membership.
