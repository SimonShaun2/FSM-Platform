# Revenue Agent — Pair 2 acquisition contract `v0.1`

**Status:** **JOINT PAIR-ACK** (preflight only — FS-17..20 remain Backlog until dependencies Ready per §6)  
**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375` (`main`, 2026-05-02)  
**Authors:** Dev D (Acquisition Web / UX surfaces) + Dev C (backend services)  
**Downstream tickets:** FS-17, FS-18, FS-19, FS-20 (implementation blocked until P0 dependencies clear)  
**Preflight ticket:** [FS-38](https://app.notion.com/p/3ff317b92d1581839f76d73ba1d9d99e)

## Partner acknowledgment (required before implementation)

| Role | Agent | Ack | Date | Notes |
|------|-------|-----|------|-------|
| Dev D (web/UX contract) | FSM Senior Dev D | **CONTRACT ACK v0.1** | 2026-10-20 | Accepts Dev C §4.1/idempotency/branch corrections |
| Dev C (API/services contract) | FSM Senior Dev C | **ACK with corrections** | 2026-10-20 | FS-38 page + idempotency PROPOSED v0.1 |
| Joint idempotency addendum | Both | **JOINT ACK** | 2026-10-20 | `docs/planning/FS-38-pair2-joint-ack.md` §2 |

Implementation PRs must link this document version in the description. Chat-only agreement is insufficient.

---

## 1. Scope boundary

### In scope (Pair 2 revenue acquisition lane)

- Read-only **customer** journeys: branded booking intake, public estimate approval, public payment view, public review landing.
- **Owner/operator** surfaces: booking link generators, estimate builder public-link preview, AI Revenue Center action UI, campaign draft/edit/send UI.
- **Contract gaps** between product agent model ([Architecture § Action contract](https://app.notion.com/p/3ff317b92d158102883eda000b1b2d25)) and current FSM code.

### Out of scope for Pair 2 v0.1 implementation

- Agent control plane tables/APIs (FS-10/FS-12 — Pair 1).
- Operator approval inbox unified model (FS-14 — Pair 4).
- Live SMS/email send without queued worker + consent checks.
- Stripe live payments, Vercel, public website deploy.
- New `inquiries` schema without FS-3 ADR + Tech Lead approval.

---

## 2. Canonical journeys (as-is @ base SHA)

### 2.1 Direct inquiry / acquisition (customer, unauthenticated)

**Primary surrogate today:** online booking flow, not a dedicated inquiry entity.

| Step | Web route | API | Persistence |
|------|-----------|-----|-------------|
| Land | `/book/{slug}?src={attribution}` | `GET /api/v1/public/booking/{slug}` | `booking_settings` |
| Service + ZIP | same | `POST .../check-zip`, `GET .../availability` | service areas / tech zips |
| Contact + consent | `/book/{slug}/contact` | — | UI state |
| Submit | confirm → `/book/{slug}/confirmed` | `POST .../submit?src=` | `booking_requests` (+ optional customer/property/job) |

**Consent captured:** `smsConsentAppointments` only in UI (`BookingFlowClient`); `smsConsentMarketing` exists on `booking_requests` schema but is **not** collected in the public booking UI.

**Attribution:** `booking_requests.source` via `?src=`; `deriveSource()` in `booking.service.ts` accepts only known enum values else falls back to `direct` — **client-supplied `src` is not cryptographically proven** (FS-11 adapter work).

**Gap vs FS-17:** No staff-entered inquiry, no inbox thread, no dedupe/classify pipeline, no “ambiguous lead” escalation object — only booking-shaped intake.

**Idempotency @ base SHA:** `POST .../submit` has **no** `Idempotency-Key` header; each call inserts a new `booking_requests` row and may enqueue `send-booking-confirmation` SMS regardless of `smsConsentAppointments` (see §7).

### 2.2 Estimate approval (customer, token)

| Step | Web route | API |
|------|-----------|-----|
| View / approve / decline | `/estimates/{token}` (**collides** with app `/estimates/{id}`) | `GET/POST /api/v1/public/estimates/{token}` |

Token minted on `sendEstimate` → `estimates.approval_token`; email job builds URL (see link generators).

### 2.3 Payment + review (customer, token)

| Journey | Web | API |
|---------|-----|-----|
| Pay invoice | `/pay/{token}` | `/api/v1/public/pay/{token}` |
| Leave review | `/review/{token}` | `/api/v1/public/reviews/{token}` |

### 2.4 Owner draft / approval surfaces (authenticated)

| Surface | Route | Backend touchpoints | Sends customer message? |
|---------|-------|---------------------|-------------------------|
| Booking links + QR | `/settings/booking/links` | `booking_settings.bookingSlug` | No (link copy only) |
| Estimate send + public link | `/estimates/*`, builder | `POST /estimates/{id}/send` → `notifications` `send-estimate-email` | Yes (email queue) after human send |
| AI Revenue Center | `/ai-revenue-center` | `POST /ai/recommendations/{id}/action` | **No** — marks `actioned` only |
| SMS campaigns | campaigns UI | `generateDraft`, `sendCampaign` → notifications queue | Yes after human send + draft body |

---

## 3. Link generator contract `v0.1`

All customer-visible URLs must be produced by **one shared module** (new in implementation; today duplicated).

| Kind | Path pattern (main @ 12b2322) | Proposed after FS-36 | Generators (must stay in sync) |
|------|------------------------------|----------------------|--------------------------------|
| Booking | `/book/{slug}?src=` | unchanged | `settings/booking/links/page.tsx` |
| Estimate approval | `/estimates/{approvalToken}` | `/approve/{approvalToken}` (FS-36 local patch) | `estimates.utils.ts`, `EstimateBuilderClient`, `EstimateListClient`, `notifications.processor.ts`, worker tests |
| Invoice pay | `/pay/{paymentToken}` | unchanged | invoice services + hooks |
| Review | `/review/{referenceId}` | unchanged | review-request services + hooks |

**Middleware public allowlist:** `apps/web/src/lib/route-access.ts` `isPublicRoute` — must be updated in the same change set as path moves.

**Env:** Worker uses `env.APP_URL` + path segment; web uses `window.location.origin` for booking links.

---

## 4. Proposed API additions (implementation — not built in preflight)

### 4.0 Consent and outbound-send authority (normative @ v0.1)

| Action | Who may trigger | Consent gate @ implementation | Today @ `12b23226` |
|--------|-----------------|--------------------------------|---------------------|
| Booking confirmation SMS | System after submit/confirm | `smsConsentAppointments === true` | **Fails N-R2-05** — queued without check (`booking.service.ts` → `send-booking-confirmation`) |
| Campaign SMS/email | Owner after draft review | Channel consent + `!doNotContact` | Skips `doNotContact` only; **no** `smsConsentMarketing` check (**N-R2-04** target) |
| Estimate email | Owner `sendEstimate` | Customer email on file | Email only; not SMS consent path |
| AI recommendation action | Owner one-click | Must not enqueue customer send | **Pass N-R2-03** — status only |
| Agent draft send (FS-18+) | Owner approve → execute | FS-8 matrix + FS-14 inbox | Not built |

### 4.1 `InquiryIntake` (FS-17) — versioned DTO `inquiry-intake@v0.1`

**v0.1 transport (Pair-ACK):** No new public `POST /inquiries` route. FS-17 phase-1 uses the **existing** `POST /api/v1/public/booking/{slug}/submit` handler and returns/maps an `InquiryIntakeV1` **response** DTO (adapter). Staff-entered and imported channels wait for FS-3 ADR + authenticated routes.

**Idempotency (required for FS-17) — joint addendum v0.1:**

- Header: `Idempotency-Key` (UUID v4) on `POST .../submit` only; optional for non-web clients until documented.
- Scope: unique per `(companyId, key)` for **24h**; storage shape = **FS-3** ADR.
- **Replay:** same key + same server `payloadHash` → HTTP **200**, identical body, no second row, **no** notification enqueue.
- **First success:** HTTP **201** with same body shape as today plus optional `inquiry: InquiryIntakeV1`.
- **Conflict:** same key + different hash → HTTP **409** `CONFLICT`, `fields.reason = "idempotency_payload_mismatch"` (distinct enum optional in FS-17 PR).
- **Missing header:** preserves non-idempotent behavior @ legacy clients.
- Client (web): mint key on first confirm submit; `sessionStorage` until success; retry transient errors with same key (see `FS-38-pair2-joint-ack.md` W-ID-*).
- `dedupeKey` (phone/email/window) is separate from idempotency — **FS-3** owns duplicate-window policy (AT-ID-03 / W-ID-09).

```typescript
// @fsm/types — proposed; persistence shape requires FS-3 decision
interface InquiryIntakeV1 {
  id: string;
  companyId: string;
  channel: "web_form" | "staff_entry" | "imported" | "adapter";
  sourceAttribution: string | null; // normalized enum stored on booking_requests.source
  attributionProvenance: "query_param" | "adapter_signed" | "staff_entry" | "unknown"; // NEW — not spoofable for adapter path
  contact: { phone: string; email?: string; firstName: string; lastName: string };
  property?: { zip: string; city: string; state: string; addressLine1: string };
  intentText: string;
  classifiedIntent?: "book" | "quote" | "question" | "unknown";
  serviceability: "in_area" | "out_of_area" | "unknown";
  consent: {
    smsAppointments: boolean;
    smsMarketing: boolean;
    capturedAt: string; // ISO
    captureSurface: string; // e.g. "book/contact", "staff_modal"
  };
  status: "open" | "qualified" | "escalated" | "converted" | "closed";
  linkedBookingRequestId?: string;
  linkedCustomerId?: string;
  dedupeKey?: string;
}
```

**Mapping from today:** `submitBookingRequest` → `booking_requests` row; adapter maps to `InquiryIntakeV1` with `channel: "web_form"`, `attributionProvenance: "query_param"` when `?src=` used.

### 4.2 `AgentDraft` (FS-18) — `agent-draft@v0.1`

```typescript
interface AgentDraftV1 {
  id: string;
  companyId: string;
  inquiryId: string;
  draftType: "qualification_reply" | "follow_up";
  body: string;
  groundedFacts: string[]; // ids/labels of records used
  missingInputs: string[];
  policyVersion: string;
  requiresApproval: true; // always true in v0.1
  status: "proposed" | "approved" | "rejected" | "expired";
}
```

**Mapping from today:** `ai_recommendations.suggestedMessage` + campaigns `generateDraft` are partial precedents; neither ties to inquiry id or approval inbox.

### 4.3 `EstimateDraftProposal` (FS-19) — `estimate-draft@v0.1`

Human-approved estimate only; extends existing `estimates` + `sendEstimate` boundary:

- Agent may **propose** line items → stored as draft estimate with `metadata.agentProposalId`.
- `sendEstimate` remains the only transition to `sent` + token + email job.
- No payment collection in this contract.

### 4.4 `FollowUpSequence` (FS-20) — `follow-up@v0.1`

- Triggers: unanswered inquiry, `estimate.sent` + no response, booking abandoned (if detectable).
- Requires: consent channel matrix (FS-8), automation rules, stop on reply/booking/opt-out.
- **Today:** `unsold_estimate` AI recommendations + `estimate-follow-up` worker job pattern — not wired to inquiry lifecycle.

---

## 5. Consumer list

| Consumer | Uses |
|----------|------|
| `apps/web` public booking | public booking API, consent fields, link builders |
| `apps/web` public estimate/pay/review | public * routes, `isPublicRoute` |
| `apps/web` settings booking links | `bookingSlug`, stats |
| `apps/web` estimate builder/list | `buildEstimatePublicPath`, send mutation |
| `apps/web` AI Revenue Center | recommendations list/action (no send) |
| `apps/web` campaigns UI | draft + send |
| `apps/api` `booking.service` | intake → customer/property/job |
| `apps/api` `estimate.service` | token, send, public approve |
| `apps/api` `ai-revenue.service` | recommendations |
| `apps/api` `campaign.service` | AI draft + send |
| `apps/worker` `notifications.processor` | estimate email URL, SMS/email jobs |
| Pair 3 FS-21 | booking handoff receipt from `booking_requests` |
| Pair 4 FS-14 | unified approval inbox (future consumer of `AgentDraftV1`) |
| Pair 1 FS-10/12 | policy version, idempotency, tool execution |

---

## 6. Dependency / decision blockers

| Blocker | Owner | Blocks |
|---------|-------|--------|
| FS-36 estimate route collision / public path | Pair 3 Platform | Web boot, consistent link contract |
| FS-3 schema ADR (inquiry vs reuse booking_requests) | Tech Lead | FS-17 persistence |
| FS-10/12 control plane + action service | Pair 1 | FS-18 autonomous guardrails |
| FS-8 threat model + consent matrix | Security | FS-18/20 outbound drafts |
| FS-14 approval inbox | Pair 4 | Single operator UX for drafts |
| FS-2 test baseline | QA | Trustworthy regression signal |
| PR #1 reconciliation | Platform | Overlay vs main truth |

---

## 7. Negative test matrix (required before Done on FS-17..20)

| ID | Scenario | Expected | @ `12b23226` (evidence) |
|----|----------|----------|-------------------------|
| N-R2-01 | Public estimate token from company A used against company B context | 404/403; no data leak | Not re-run (no deps); token lookup is global by `approval_token` |
| N-R2-02 | Approve estimate after `expiresAt` | Reject; no status change | Not re-run |
| N-R2-03 | `actionRecommendation` alone | No SMS/email job enqueued | **Pass** — `ai-revenue.service.ts` |
| N-R2-04 | `sendCampaign` SMS without marketing consent | Reject or skip recipient | **Fail** — `campaign.service.ts` checks `doNotContact` only |
| N-R2-05 | Booking submit with `smsConsentAppointments: false` | No appointment SMS jobs | **Fail** — always queues `send-booking-confirmation` |
| N-R2-06 | Cross-tenant `GET public/booking/{slug}` | Only matching company settings | Not re-run |
| N-R2-07 | Duplicate submit same phone+email rapid double-click | Idempotent or single row; no duplicate jobs | **Fail** — no `Idempotency-Key` |
| N-R2-08 | Prompt injection in `customerNotes` / inquiry text | Draft only; no execution | N/A until FS-18 |
| N-R2-09 | Staff attempts send estimate in `draft` without approve step | Only `sendEstimate` path | **Pass** — draft guard on send |
| N-R2-10 | Follow-up after STOP/opt-out (FS-20) | Sequence halted; event logged | N/A until FS-20 |
| N-R2-11 | UUID-shaped segment on `/estimates/{id}` vs token route (FS-36) | Public path unambiguous after fix | **Fail** — route collision on main |
| N-R2-12 | Agent proposes price not in catalog/rules | Blocked; surfaced as missing input | N/A until FS-19 |

### 7.1 Idempotency acceptance tests (FS-17 implementation — Dev C API / Dev D UI)

| ID | Given | When | Then |
|----|-------|------|------|
| AT-ID-01 | Valid submit body | Two `POST .../submit` with same `Idempotency-Key` + same body | HTTP **201** then **200**; identical `referenceNumber`; one row; ≤1 customer SMS job |
| AT-ID-02 | Valid submit body | Same key, different body (tamper) | **409** `CONFLICT`; `fields.reason = "idempotency_payload_mismatch"` |
| AT-ID-03 | Valid submit body | Two submits, different keys, same phone within 60s | Policy per FS-3: either two rows with linked `dedupeKey` audit **or** second rejected — must be explicit in ADR |
| AT-ATTR-01 | `?src=google` | Submit | `source=google`, `attributionProvenance=query_param` |
| AT-ATTR-02 | Adapter-signed attribution (FS-11) | Submit via connector | `attributionProvenance=adapter_signed`; unsigned `src` ignored |

**Test ownership:** Dev C — API integration + worker job counts; Dev D — web idempotency key generation + N-R2-11 route regression; QA — batch CI when enabled.

---

## 8. Implementation split, branches, merge order

**Rule:** No overlapping file ownership per tandem process; contract-first PR then parallel implementation.

| Order | Branch (template) | Owner | Files / packages | Ticket |
|-------|-------------------|-------|------------------|--------|
| 0 | `cursor/fs-38-contract-pair2-96e5` | Dev D + Dev C | `docs/contracts/revenue-agent-pair2-v0.1.md`, FS-38 Notion evidence | FS-38 |
| 1 | `cursor/fs-36-estimate-route-collision-96e5` | Pair 3 (blocks web) | web routes, `route-access.ts`, link utils, worker URL | FS-36 |
| 2a | `cursor/fs-17-inquiry-intake-api-96e5` | Dev C | `packages/types`, `packages/db` (if ADR), inquiry adapter on `submit`, idempotency store | FS-17 |
| 2b | `cursor/fs-17-inquiry-intake-web-96e5` | Dev D | branded inquiry/booking UX, consent UI, `Idempotency-Key` on submit | FS-17 |
| 3a | `cursor/fs-18-qualification-drafts-api-96e5` | Dev C | draft proposal service, queue hooks | FS-18 |
| 3b | `cursor/fs-18-qualification-drafts-web-96e5` | Dev D | operator workbench draft review UI (Figma FS-9) | FS-18 |
| 4a | `cursor/fs-19-estimate-draft-api-96e5` | Dev C | estimate proposal + audit | FS-19 |
| 4b | `cursor/fs-19-estimate-draft-web-96e5` | Dev D | builder approval UX | FS-19 |
| 5 | `cursor/fs-20-followup-96e5` | Dev C lead, Dev D surfaces | worker schedules + reporting | FS-20 |

**Merge order:** 0 → 1 → (2a ∥ 2b with contract lock) → 3 → 4 → 5. Pair 1 control plane may insert before 3 if FS-10 lands first.

---

## 9. Web UI implementation checklist (Dev D — FS-38)

Normative preflight for FS-17b / FS-36 web work:

- **`docs/planning/FS-38-acquisition-web-ux-addendum-v0.1.md`** — Direct inquiry, verified/unavailable capacity, estimate revision boundary, consent, duplicate/idempotency UX, error catalog, Dev C request/response mapping.
- **`docs/planning/FS-38-pair2-web-ui-checklist.md`** — N-R2 web cases, consent, FS-36 routes, a11y, Figma nodes.
- **`docs/planning/FS-38-pair2-joint-ack.md`** — Dev C ↔ Dev D idempotency/duplicate reconciliation (W-ID ↔ AT-ID).

Implementation blocked per §6 until dependencies Ready.

---

## 10. Design / contract gaps (FS-9 Figma vs code)

| Design intent | Code today | Gap |
|---------------|------------|-----|
| Branded inquiry (not only full booking) | Multi-step booking only | Need lightweight inquiry step or FS-17 form |
| Operator workbench unified queue | Separate AI center, campaigns, booking admin | FS-14 dependency |
| Separate marketing vs appointment SMS consent | Single checkbox in booking | Wire `smsConsentMarketing` or remove from schema |
| Public estimate branded approval | `CustomerEstimateView` exists | Route collision FS-36 |
| Agent draft → approve → send | AI action does not send | FS-18 + notifications integration |

---

## Changelog

- **v0.1 (2026-10-20):** Initial preflight contract from Dev D @ `12b23226`.
- **v0.1 pair-ack (2026-10-20):** Dev C corrections merged; Dev D **CONTRACT ACK v0.1**; §4.0 consent table; §4.1 adapter-only + idempotency; §7 baseline column + AT-ID/AT-ATTR; branches `-96e5`.
- **v0.1 preflight (2026-10-20):** §9 web UI checklist; FS-9 Figma node cross-check.
- **v0.1 joint-ack (2026-10-20):** `FS-38-pair2-joint-ack.md`; idempotency addendum §4.1; FS-38 items 5–6 closed on ticket.
- **v0.1 ux-addendum (2026-10-20):** `FS-38-acquisition-web-ux-addendum-v0.1.md`; §9 link; capacity/consent/error mapping for Dev C.
