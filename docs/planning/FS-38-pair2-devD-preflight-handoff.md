# FS-38 — Pair 2 Dev D preflight handoff (Acquisition Web)

**Agent:** FSM Senior Dev D (Composer 2.5)  
**Ticket:** [FS-38 P0 revenue workflow and consent preflight](https://app.notion.com/p/3ff317b92d1581839f76d73ba1d9d99e)  
**Partner:** Dev C (backend — lead/estimate/comms services)  
**Date:** 2026-10-20

## Evidence record

| Field | Value |
|-------|--------|
| Base SHA | `12b23226c0e0c199626940117fc7f0fa89f87375` |
| Branch | `main` (read-only inspection) |
| Commit message | `docs: add all tickets, planning files, schema, and deployment guide` |
| Contract artifact | `docs/contracts/revenue-agent-pair2-v0.1.md` |
| Push / PR / CI | **None** (per FS-38 acceptance) |

### Commands run

```bash
cd /workspace && git rev-parse HEAD && git log -1 --oneline && git branch --show-current
# 12b23226c0e0c199626940117fc7f0fa89f87375
# 12b2322 docs: add all tickets, planning files, schema, and deployment guide
# main

cd /workspace/apps/web && pnpm exec next build
# ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL — next not found (node_modules not installed in this VM)

cd /workspace/apps/api && pnpm test -- --run phase2-operations
# vitest: not found (node_modules missing)

ls apps/web/app/(app)/estimates/[id] apps/web/app/(public)/estimates/[token]
# Both exist → Next.js dynamic segment collision (documented FS-36)
```

**Interpretation:** Static/repo evidence only; no green test or web boot claim. FS-36 documents local patch at `/approve/{token}` (not on `main`).

---

## Executive summary

At `12b2322`, **direct acquisition** is implemented as the **public online booking** stack (`/book/{slug}`), not a first-class inquiry model (FS-17 backlog). **Customer read-only** flows also include estimate approval, pay, and review tokens. **Owner approval** for outbound copy is split across estimate send, SMS campaigns, and AI Revenue Center — but AI “Send Follow Up” only records `ai.recommendation_actioned` without enqueueing messages. **Consent** is partial: booking captures appointment SMS opt-in only; marketing consent column is unused in UI.

Versioned contract **`revenue-agent-pair2-v0.1`** proposes DTOs, consumers, negative tests, and branch/merge order for FS-17–20. Dev C must co-sign on FS-38 or the contract PR before implementation.

---

## File reference index (Dev D ownership map)

### Public customer journey (read-only / token)

- `apps/web/app/(public)/book/[slug]/**` — booking wizard
- `apps/web/src/components/booking/BookingFlowClient.tsx` — steps, `smsConsent` → `smsConsentAppointments`
- `apps/web/app/(public)/estimates/[token]/page.tsx` — **route collision**
- `apps/web/app/(public)/pay/[token]/page.tsx`
- `apps/web/app/(public)/review/[token]/page.tsx`
- `apps/web/src/lib/route-access.ts` — `isPublicRoute` (lines 83–106)

### Link generators

- `apps/web/app/(app)/settings/booking/links/page.tsx` — `/book/{slug}?src=`
- `apps/web/src/components/estimates/estimates.utils.ts` — `buildEstimatePublicPath`, `buildInvoicePublicPath`
- `apps/web/src/components/estimates/EstimateBuilderClient.tsx` — copy public link
- `apps/worker/src/processors/notifications.processor.ts` — `approvalUrl` uses `/estimates/{token}`

### Draft / approval surfaces (owner)

- `apps/web/app/(app)/ai-revenue-center/**` + `AiRevenueCenterClient.tsx`
- `apps/web/src/hooks/ai-revenue.hooks.ts` → `POST /api/v1/ai/recommendations/:id/action`
- `apps/api/src/services/ai-revenue.service.ts` — `actionRecommendation` (no notify)
- Campaigns routes/services — `generateDraft`, `sendCampaign`
- `apps/web/src/components/estimates/*` — send estimate → worker email

### Dev C file map (for tandem — do not edit in FS-38)

- `apps/api/src/services/booking.service.ts` — submit, zip, job creation
- `apps/api/src/routes/public/booking/**`
- `apps/api/src/services/estimate.service.ts` — `sendEstimate`, `getPublicEstimate`, token lookup
- `apps/api/src/routes/public/estimates/**`
- `packages/db/src/schema.ts` — `booking_requests`, `estimates.approval_token`, consent columns

---

## Risks (ranked)

1. **P0 — Next.js route collision** (`/estimates/:param` app vs public). Blocks web dev server; link generators must move with FS-36.
2. **P0 — No inquiry entity** — FS-17 acceptance (dedupe, classify, escalate) cannot be met by booking alone without schema/ADR.
3. **P0 — AI action ≠ send** — Product copy implies follow-up; code only updates recommendation status → false sense of approval.
4. **Tenant/Consent — Marketing SMS** — DB field without UI; campaign send may not enforce per-recipient marketing consent (verify in Dev C audit).
5. **Money — FS-19** — Estimate send triggers customer-facing email with totals; agent draft must not bypass human send.
6. **Dependency drift** — FS-10/12/14/8 not Ready; implementing FS-18 before control plane risks rework.
7. **Environment** — This VM lacks `node_modules`; local test reproduction requires `pnpm install` (not run to avoid implying PASS).

---

## Downstream tickets mapping

| FS ID | Title | Current behavior @ 12b2322 | Contract section |
|-------|-------|------------------------------|------------------|
| FS-17 | Direct inquiry intake | `booking_requests` + public submit | §4.1 |
| FS-18 | Qualification drafts | AI `suggestedMessage`, campaigns AI draft | §4.2 |
| FS-19 | Quote/estimate draft | Manual estimate builder + `sendEstimate` | §4.3 |
| FS-20 | Missed inquiry / estimate follow-up | AI `unsold_estimate` + automation jobs partial | §4.4 |

---

## Next actions

1. **Dev C:** Review `docs/contracts/revenue-agent-pair2-v0.1.md`; mark acknowledgment table; add backend file commitments / amendments.
2. **PM:** Keep FS-17–20 **Backlog** until FS-36 + FS-3 + FS-8 gates clear.
3. **Pair 2:** Open contract-only branch when batch CI policy allows; no feature code until Ready.
4. **Design:** FS-9 Figma gaps in contract §9 — operator workbench vs fragmented UI.

---

## Operating rules compliance

Read: `AGENTS.md`, `CODEX.md`, `WORKFLOW.md`, [03 — Software Team & Operating Rules](https://app.notion.com/p/3ff317b92d15817b9f64dda55cddb97e). No push, PR, CI, deploy, Vercel, live payments, or customer messages from this session.
