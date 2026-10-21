# FS-38 — Pair 2 web UI implementation checklist (Dev D)

**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Contract:** `docs/contracts/revenue-agent-pair2-v0.1.md` (JOINT PAIR-ACK)  
**UX addendum:** `docs/planning/FS-38-acquisition-web-ux-addendum-v0.1.md` (capacity, errors, Dev C mapping)  
**Design:** [FS-9](https://app.notion.com/p/3ff317b92d1581f5be38ccbd1b1df6b5) · Figma `WmranFjZTG3pXGFZGt2F9z`  
**Status:** Preflight only — **no implementation** until FS-17 Ready + FS-36 merged for estimate routes.

---

## 1. Dependencies (do not start UI build)

| Gate | Blocks |
|------|--------|
| **FS-36** | Public estimate route `/approve/{token}`, `isPublicRoute`, link utils, worker email URL |
| **FS-17 API** (Dev C) | `Idempotency-Key` handling, idempotent replay status codes, optional `InquiryIntakeV1` response |
| **FS-3** | Duplicate-window policy (AT-ID-03 UI copy) |
| **FS-8** | Marketing vs appointment consent copy and enforcement matrix |
| **FS-14** | Operator workbench (FS-9 D01/D04) — not in current app shell |
| **FS-9 design PASS** | Crisp frames M01–M10, D01 — **In Review**, operator walkthrough open |

---

## 2. Direct inquiry path map (shipped vs target)

### 2.1 Customer — public (today @ `12b23226`)

| Step | Route | Component | API |
|------|-------|-----------|-----|
| Entry | `/book/{slug}?src=` | `app/(public)/book/[slug]/page.tsx` | `GET /api/v1/public/booking/{slug}` |
| ZIP/location | same flow | `BookingFlowClient` `step=location` | `POST .../check-zip` |
| Service | `/book/{slug}/service` | `step=service` | — |
| Schedule | `/book/{slug}/schedule` | `step=schedule` | `GET .../availability` |
| Contact | `/book/{slug}/contact` | `step=contact` | — |
| Review/submit | `/book/{slug}/confirm` | `step=confirm` | `POST .../submit?src=` via `useSubmitBookingRequest` |
| Done | `/book/{slug}/confirmed?ref=` | `BookingConfirmed` | `GET .../confirmation/{ref}` |

**State:** `apps/web/src/stores/booking-flow.store.ts` (persisted `servicerev-booking-flow`).

**FS-9 target (Crisp M01→M03→M02):** Single-scroll “inquiry form” + explicit **not booked** success (`7:283`). Shipped flow is **multi-step booking** with “Confirm Booking” and “Review your booking” (`BookingFlowClient.tsx` confirm step).

### 2.2 Customer — estimate approval (after FS-36)

| Phase | Public URL | Page file (main) | Page file (post–FS-36) |
|-------|------------|------------------|-------------------------|
| Today | `/estimates/{token}` | `app/(public)/estimates/[token]/page.tsx` | **Remove or redirect** |
| Target | `/approve/{token}` | — | `app/(public)/approve/[token]/page.tsx` (new) |
| API | unchanged | `GET/POST /api/v1/public/estimates/{token}` | same |

**Handoff files (FS-36 + FS-17b):**

- `apps/web/src/components/estimates/estimates.utils.ts` — `buildEstimatePublicPath` → `/approve/{token}`
- `apps/web/src/lib/route-access.ts` — `isPublicRoute`: add `/approve/:token`, remove ambiguous `/estimates/:segment`
- `EstimateBuilderClient.tsx`, `EstimateListClient.tsx` — copy-link UI
- Reuse `CustomerEstimateView` + `usePublicEstimate` hooks (paths only)

### 2.3 Owner — link generators (no inquiry submit)

| Surface | Route | Notes |
|---------|-------|-------|
| Booking links + QR | `/settings/booking/links` | `masterUrl = {origin}/book/{slug}?src=` |
| Estimate public link | `/estimates/{id}` builder | Uses `buildEstimatePublicPath` after send |

---

## 3. Web-owned N-R2 → UI checklist

### N-R2-07 / AT-ID-01 / AT-ID-02 — Double submit & idempotency retry

| # | Requirement | Implementation target | Done when |
|---|-------------|----------------------|-----------|
| W-ID-01 | Mint **one** `Idempotency-Key` (UUID v4) per confirm-session | `BookingFlowClient` confirm step OR `useSubmitBookingRequest` wrapper | Key stable across retries |
| W-ID-02 | Persist **idempotency key** in `sessionStorage` (`fsm:idempotency:{slug}`) from first confirm attempt until success | Same module as W-ID-01 | Body edits after mint → server 409 (W-ID-08); do not rotate key on retry |
| W-ID-03 | Send header `Idempotency-Key` on `POST .../submit` | Extend `apps/web/src/lib/api.ts` `post()` optional headers **or** dedicated `publicBookingApi.submit` | Dev C contract satisfied |
| W-ID-04 | Primary CTA: `disabled` + `aria-busy="true"` while `isPending` | Confirm button ~872–881 | Already partial; add `aria-busy` |
| W-ID-05 | Prevent double-click: ignore extra clicks while pending | `handleSubmitBooking` guard | |
| W-ID-06 | **Retry:** network/5xx → same key, show toast “Still working…” (M03 `7:289`) | Error branch in `handleSubmitBooking` | Figma M04 `7:293` for hard fail |
| W-ID-07 | **Replay success:** second response same `referenceNumber` → navigate once | `confirmed` route | AT-ID-01 |
| W-ID-08 | **409 key/body mismatch:** show non-destructive error, prompt restart (M07 stale `7:307`) | Map `ApiError` `CONFLICT` | AT-ID-02 |
| W-ID-09 | **Duplicate policy (AT-ID-03):** UI for “We already have your request” (M06 `7:301`) | After FS-3 ADR | Block second submit or show ref # |

**Figma alignment:** M03 loading `7:289`, M04 error `7:293`, M06 duplicate `7:301`, M07 stale `7:307`.

---

### N-R2-05 — Consent capture & messaging honesty

| # | Requirement | Implementation target | Done when |
|---|-------------|----------------------|-----------|
| W-C-01 | **Separate** appointment SMS checkbox (unchecked default) | `booking-flow.store.ts` — change `smsConsent: true` → **`false`** default; contact step label | Matches FS-8 / FS-9 A6 |
| W-C-02 | Optional **marketing** SMS checkbox (unchecked default) | `BookingFlowClient` contact step; map `smsConsentMarketing` in submit body | Schema field wired |
| W-C-03 | Submit body sends both flags explicitly | `handleSubmitBooking` body | Dev C gates SMS on flags |
| W-C-04 | If appointment SMS **unchecked**, confirm step must **not** promise “Confirmation SMS within 2 hours” | Confirm copy block ~861–869 | Contract §4.0 |
| W-C-05 | Align success screen with **not booked** (M02 `7:283`) not “booking confirmed” | `BookingConfirmed` component | Remove implied appointment until operator confirms |
| W-C-06 | Opt-out / blocked send surface (M05 `7:297`) | FS-20 / inbound STOP — show read-only message if API returns consent error | Post–FS-8 |
| W-C-07 | Consent change invalidates implied promises | `aria-live="polite"` on consent summary on confirm | FS-9 A6 |

**Evidence @ SHA:** Store defaults `smsConsent: true` (`booking-flow.store.ts:64`); confirm promises SMS regardless (`BookingFlowClient.tsx:864–866`).

---

### N-R2-11 — Estimate approval route (FS-36 handoff)

| # | Requirement | File | Done when |
|---|-------------|------|-----------|
| W-E-01 | New route segment `/approve/[token]` | `app/(public)/approve/[token]/page.tsx` | Next build unique dynamic segments |
| W-E-02 | Delete or 308 redirect legacy `/estimates/[token]` public page | Product decision with FS-36 (legacy links) | Documented on FS-36 card |
| W-E-03 | `buildEstimatePublicPath` returns `/approve/${token}` | `estimates.utils.ts` | Sync with worker `APP_URL` |
| W-E-04 | `isPublicRoute('/approve/x')` true; `/estimates/{uuid}` not public | `route-access.ts` | Middleware regression |
| W-E-05 | Authenticated `/estimates/{id}` unchanged | `(app)/estimates/[id]` | Owner builder works |
| W-E-06 | Tier select + approve keyboard | `CustomerEstimateView.tsx` — tier buttons need `aria-pressed`, focus order | WCAG 2.1.1 |

**Dependency:** Merge **FS-36** before FS-17b/estimate link QA.

---

### N-R2-01 / N-R2-02 — Public estimate UX (token)

| # | Requirement | Component | Done when |
|---|-------------|-----------|-----------|
| W-P-01 | Expired/invalid token → empty state (no leak) | `(public)/approve/[token]/page.tsx` | Matches API 404 |
| W-P-02 | Post-`expiresAt` approve → show error from API | `usePublicApproveEstimate` error UI | N-R2-02 |
| W-P-03 | Decline path + reason optional | `CustomerEstimateView` | Existing hooks |

---

### N-R2-06 — Cross-tenant booking (web smoke)

| # | Requirement | Test |
|---|-------------|------|
| W-T-01 | Wrong slug shows booking disabled / 404 UI | E2E: `/book/nonexistent-slug` |

---

### N-R2-08 / N-R2-12 — Agent drafts (FS-18/19 — web surfaces)

| # | Requirement | Future surface |
|---|-------------|----------------|
| W-A-01 | Inquiry notes rendered as text only, never `dangerouslySetInnerHTML` | Booking notes field display in operator views |
| W-A-02 | Missing price → disabled send + “missing catalog price” | FS-19 builder |

---

## 4. Keyboard & accessibility (FS-9 → engineering)

Map FS-9 findings to implementation (frames on page `03 / Owner & Staff Flows — Crisp`, notes `7:327`).

| FS-9 ID | Requirement | Web implementation target | Priority |
|---------|-------------|----------------------------|----------|
| A1 | Workspace nav as real links/tabs | Future `/inbox` (FS-14) — **out of FS-17 scope** | P2 |
| A2 | Agent rail `aria-selected` | FS-18 workbench | P2 |
| A3 | Status not color-only | `StatBadge` + icon for “Needs approval” | P1 when inbox ships |
| A4 | Contrast tokens | Align with `@fsm/ui` / Tailwind tokens | P1 |
| A5 | Lead queue keyboard | FS-14 inbox list | P2 |
| A6 | Consent `aria-live` + block send | W-C-07; operator send (FS-18) | **P0** consent path |
| A7 | Mobile nav duplicate Home/Jobs | `apps/web` mobile layout — separate ticket | P2 |
| **Crisp** | CTA min height 44px, focus-visible ink ring | All public booking buttons | **P0** |
| **Crisp** | `aria-live` on submit loading/error | Confirm step status region | **P0** (M03/M04) |

**Booking flow today:** native `<button>`/`<input>` — no skip link; contact checkbox is `<label>` wrapped — OK; confirm back link is `<a>` — OK.

---

## 5. FS-9 Figma ↔ contract mismatch (node IDs)

Verified via Figma API metadata @ 2026-10-20 (file `WmranFjZTG3pXGFZGt2F9z`).

| Figma node | Frame | Contract / code expectation | Mismatch |
|------------|-------|----------------------------|----------|
| `7:262` (M01) | Inquiry form, CTA **“Request my estimate”** | v0.1: inquiry via booking submit; copy should not promise booking | Code: **“Confirm Booking”** + “Review your booking” (`BookingFlowClient` confirm) |
| `7:280` | Disclaimer: no appointment until team confirms | Pair-ACK §2.1 | Partial on contact; **contradicted** by confirm “What happens next” SMS list |
| `7:283` (M02) | **“Inquiry received — not scheduled”** | FS-9 interaction contract | `BookingConfirmed` uses booking/confirmation language — **not aligned** |
| `7:289` (M03) | Submitting loading | W-ID-04/06 | Only button label “Confirming…” — no skeleton/`aria-live` |
| `7:293` (M04) | Submit error + Try again | W-ID-06 | Toast only on error today |
| `7:297` (M05) | SMS opt-out blocked | N-R2-10 / FS-8 | **No UI** |
| `7:301` (M06) | Duplicate inquiry | N-R2-07 / AT-ID-03 | **No UI** (double submit creates duplicate rows) |
| `7:307` (M07) | Stale session | W-ID-08 | **No UI** |
| `3:55` | Legacy branded inquiry (Page 1) | Archive reference | Superseded by Crisp M01 for pilot; keep for copy/legal |
| `10:152` (D04) | Operator Approve and send | §4.0 — no autonomous send | Maps to **future** FS-14/18; today AI Revenue action ≠ send |
| `7:326` / `10:99` | Desktop workbench | No `/inbox` route in `route-access.ts` | **U1** — FSM sidebar vs agent IA |

**Open design defects (FS-9 card):** M01 CTA overflow 390px; M02 copy overlap; D01/D04 nav clip — fix in Figma before visual QA parity.

---

## 6. Future test locations (exact paths)

`@fsm/web` has **no** Vitest/Playwright harness today (`package.json` `test` is no-op). When FS-2/Platform enables web tests:

| Test ID | Type | Proposed file | Scope |
|---------|------|---------------|-------|
| AT-ID-01, W-ID-01–05 | Unit | `apps/web/src/components/booking/booking-idempotency.test.ts` | Key mint, header attachment, pending guard |
| N-R2-11, W-E-03–04 | Unit | `apps/web/src/lib/route-access.test.ts` | `isPublicRoute` matrix |
| W-E-03 | Unit | `apps/web/src/components/estimates/estimates.utils.test.ts` | `buildEstimatePublicPath` → `/approve/` |
| N-R2-05, W-C-01–04 | Component | `apps/web/src/components/booking/BookingFlowClient.consent.test.tsx` | Copy + default unchecked (RTL optional) |
| AT-ID-01, N-R2-07, W-C-05 | E2E | `apps/web/e2e/acquisition/public-booking.spec.ts` | Playwright — double-click, consent off, success copy |
| N-R2-11, W-E-01 | E2E | `apps/web/e2e/acquisition/public-estimate-approve.spec.ts` | `/approve/{token}` loads; `/estimates/{uuid}` auth |
| N-R2-02 | E2E | same estimate spec | Expired token UI |
| W-T-01 | E2E | `public-booking.spec.ts` | Invalid slug |

**Cross-package:** API idempotency integration stays `apps/api/src/routes/booking/booking.test.ts` + `phase2-operations.test.ts` (Dev C). Worker SMS count: `apps/worker/src/processors/notifications.processor.test.ts`.

**CI:** Only in approved batch per operating rules; local `pnpm --filter @fsm/web test` must be wired when adding files.

---

## 7. Error messaging catalog (implementation copy targets)

| API / condition | UI surface | Figma ref | Message direction |
|-----------------|------------|-----------|-------------------|
| `CONFLICT` zip | location step | — | Existing toast from API |
| `CONFLICT` duplicate/idempotency | confirm | M06 `7:301` | “We already received your request. Reference: {ref}” |
| `CONFLICT` idempotency body mismatch | confirm | M07 `7:307` | “This form changed. Please review and submit again.” |
| Network error | confirm | M04 `7:293` | “Couldn’t reach us. Try again.” + retry same key |
| 404 booking slug | layout | — | Empty/disabled booking |
| 404 public estimate | approve page | — | Existing “Estimate not available” |
| Consent block (future) | confirm/success | M05 `7:297` | “We can’t text this number. We’ll email instead.” |

---

## 8. Evidence log (this document)

```bash
git rev-parse HEAD
# 12b23226c0e0c199626940117fc7f0fa89f87375

# Figma node verify (MCP get_metadata)
# 7:262 FS9-M01, 7:283 FS9-M02, 3:55 legacy inquiry — OK
```

No web build/test executed (`node_modules` not installed). No new tickets opened.
