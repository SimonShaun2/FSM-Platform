# UNPUBLISHED-FSM-WORK-INVENTORY.md

**Ticket:** FSM-0001
**Date:** 2026-08-21
**Branch:** `feature/FSM-0001-repository-reconciliation`
**Purpose:** inventory likely FSM platform work present only in the dirty local working tree.

---

## 1. Executive Summary

The dirty local overlay contains probable unpublished FSM platform work in at least five
areas:

- Agency / multi-company console
- Customer portal
- Browser push notifications
- Public marketing landing page
- Reporting and operational UI extensions

It also contains unrelated non-FSM projects and unrelated documentation. The unpublished FSM
work should be preserved for later review, but it should not be merged into the Sprint 0
reconciliation branch as-is.

---

## 2. Workspace Hazard

`pnpm-workspace.yaml` includes:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

The untracked `apps/restaurant-waitlist/` directory has its own `package.json` named
`@local/restaurant-waitlist`. Because it lives under `apps/*`, broad workspace commands may
include it even though it is unrelated to the FSM platform.

Decision:

- Do not use broad `pnpm build` or `pnpm test` results from this dirty tree as Sprint 0
  baseline evidence.
- Remove or relocate unrelated `apps/*` projects before any final baseline verification.

---

## 3. Agency Console Overlay

Observed files:

- `apps/api/src/routes/agency/agency.test.ts`
- `apps/api/src/routes/agency/handlers.ts`
- `apps/api/src/routes/agency/index.ts`
- `apps/api/src/routes/agency/schemas.ts`
- `apps/api/src/services/agency.service.ts`
- `apps/api/src/services/agency.service.test.ts`
- `apps/web/app/(app)/agency/page.tsx`
- `apps/web/src/components/agency/AgencyDashboardClient.tsx`
- `packages/types/src/agency.types.ts`

Observed behavior:

- Adds `agency` to the user role enum.
- Adds `agency_memberships` schema and migration entries.
- Adds agency company listing, company switching, and aggregate dashboard routes.
- Adds agency-specific navigation and sidebar behavior.

Tests present:

- `listManagedCompanies`
- `switchCompany`
- `getAgencyDashboard`
- Route tests for list, switch, dashboard, and non-agency access rejection.

Initial review notes:

- Service code uses broad table scans followed by in-memory filtering in several places.
- This should be reviewed under database/query standards before promotion.
- Cross-company access is intentional for agency users, so tenant-isolation rules need
  explicit product and security review.

---

## 4. Customer Portal Overlay

Observed files:

- `apps/api/src/middleware/portal-auth.ts`
- `apps/api/src/routes/portal/handlers.ts`
- `apps/api/src/routes/portal/index.ts`
- `apps/api/src/routes/portal/portal.test.ts`
- `apps/api/src/routes/portal/schemas.ts`
- `apps/api/src/routes/public/portal/handlers.ts`
- `apps/api/src/routes/public/portal/index.ts`
- `apps/api/src/routes/public/portal/schemas.ts`
- `apps/api/src/services/customer-portal.service.ts`
- `apps/api/src/services/customer-portal.service.test.ts`
- `apps/web/app/(portal)/`
- `apps/web/src/components/portal/`
- `apps/web/src/hooks/portal.hooks.ts`
- `apps/web/src/lib/portal-api.ts`
- `apps/web/src/stores/portal-auth.store.ts`
- `packages/types/src/portal.types.ts`

Observed behavior:

- Adds one-time customer portal session tokens with a 15 minute TTL.
- Adds public portal access request and token verification routes.
- Adds portal-authenticated customer profile, invoice, job, agreement, and asset read routes.
- Adds portal UI pages for login, verify, home, jobs, invoices, agreements, and assets.
- Adds email and SMS notification jobs for customer portal magic links.

Tests present:

- Access request does not reveal whether a customer exists.
- Token verification is single-use and expires.
- Portal JWTs are rejected on main app routes.
- Main app JWTs are rejected on portal routes.
- Portal invoice detail is tenant-safe and customer-safe.

Initial review notes:

- Public portal access accepts an optional `companyId`; this needs explicit review because
  the legacy rule says never trust request-body company IDs. Public lookup may be a valid
  exception, but it must be documented.
- Several portal service reads use broad table scans and in-memory filtering.
- Magic link delivery adds customer communication paths that need PII/logging review.

---

## 5. Push Notification Overlay

Observed files:

- `apps/api/src/routes/push/handlers.ts`
- `apps/api/src/routes/push/index.ts`
- `apps/api/src/routes/push/push.test.ts`
- `apps/api/src/routes/push/schemas.ts`
- `apps/api/src/services/push.service.ts`
- `apps/api/src/services/push.service.test.ts`
- `apps/api/src/services/push.service.js`
- `apps/worker/src/processors/push-notification.processor.ts`
- `apps/worker/src/processors/push-notification.processor.test.ts`
- `packages/jobs/src/push-delivery.ts`
- `packages/types/src/push.types.ts`
- `apps/web/public/manifest.json`
- `apps/web/public/sw.js`
- `apps/web/public/icons/icon-192.png`
- `apps/web/public/icons/icon-512.png`
- `apps/web/src/components/mobile/MobileServiceWorkerBridge.tsx`
- `apps/web/src/components/mobile/PushPermissionPrompt.tsx`
- `apps/web/src/hooks/push.hooks.ts`

Observed behavior:

- Adds `push_subscriptions` schema and migration entries.
- Adds VAPID env vars.
- Adds push subscribe/unsubscribe API routes.
- Adds `send-push-notification` handling in the notifications worker.
- Adds push payload templates for job assignment, booking confirmation, and invoice payment.
- Adds service worker and manifest assets.

Tests present:

- API route tests for subscribe and unsubscribe.
- Service tests for saving subscriptions and soft-deleting expired subscriptions on 410.
- Worker tests for payload formatting and processor delivery.

Initial review notes:

- `apps/api/src/services/push.service.js` is generated JavaScript output and is not ignored.
- Test env files contain VAPID-looking constants. They appear to be test constants, but they
  should be reviewed by secret scanning before promotion.
- `processPushNotification` should validate the notification type before indexing templates.
- Push delivery logs `userId` at error level; review whether this is acceptable under the
  no-PII logging standard.

---

## 6. Landing Page Overlay

Observed files:

- `apps/web/app/page.tsx`
- `apps/web/src/components/landing/AIWidget.tsx`
- `apps/web/src/components/landing/FeaturesGrid.tsx`
- `apps/web/src/components/landing/FinalCTA.tsx`
- `apps/web/src/components/landing/HeroSection.tsx`
- `apps/web/src/components/landing/LandingFooter.tsx`
- `apps/web/src/components/landing/LandingNav.tsx`
- `apps/web/src/components/landing/LandingPage.tsx`
- `apps/web/src/components/landing/OnboardingSection.tsx`
- `apps/web/src/components/landing/ProblemSection.tsx`
- `apps/web/src/components/landing/SolutionSection.tsx`
- `apps/web/src/components/landing/WorkflowStrip.tsx`

Observed behavior:

- Changes the root app route from auth redirect behavior to a public marketing landing page.
- Adds public metadata and marketing components.

Initial review notes:

- This is product behavior, not repository reconciliation.
- It affects the root route and auth flow expectations, so it must be validated under a
  frontend/product ticket before merge.

---

## 7. Health, CORS and Runtime Overlay

Observed files:

- `apps/api/src/routes/health/index.ts`
- `apps/api/src/routes/health/health.test.ts`
- `apps/api/src/app.ts`
- `apps/api/src/server.ts`
- `packages/config/src/env.ts`

Observed behavior:

- Adds API health and DB health routes.
- Adds CORS configuration via `CORS_ORIGINS`.
- Enables `trustProxy` and router parameter length configuration.

Initial review notes:

- DB health check queries the database directly in a route handler. That may be acceptable
  for operational health endpoints, but it should be documented as an explicit exception to
  thin-handler rules if retained.
- CORS origin behavior needs production security review before baseline promotion.

---

## 8. Reporting and UI Extension Overlay

Observed files:

- `apps/web/src/components/reporting/BookingSourcesTab.tsx`
- `apps/web/src/components/reporting/RevenueForecastTab.tsx`
- `apps/web/src/components/reporting/TechPerformanceTab.tsx`
- `apps/web/src/components/reporting/ReportingDashboardClient.tsx`
- `apps/web/src/hooks/reporting.hooks.ts`
- `apps/web/src/components/mobile/MobileProfileScreen.tsx`
- `apps/web/src/lib/page-meta.ts`
- `apps/web/src/lib/navigation.ts`
- `apps/web/src/lib/route-access.ts`

Observed behavior:

- Extends reporting UI/hook logic.
- Adds agency role navigation and route access.
- Extends mobile profile and page metadata behavior.

Initial review notes:

- The reporting hook diff is large and should be reviewed separately from agency/portal/push.
- Because the overlay changes role navigation and auth routing, it may interact with Sprint 2
  authentication and permission design.

---

## 9. Schema and Migration Overlay

Observed migration:

- `packages/db/migrations/0017_icy_nicolaos.sql`

Observed schema additions:

- `user_role` enum value: `agency`
- `agency_memberships`
- `customer_portal_sessions`
- `push_subscriptions`

Initial review notes:

- The migration uses `ON DELETE cascade` on some `company_id` foreign keys. Application code
  normally uses soft deletes, so this should be reviewed before migration promotion.
- Schema changes require a ticket and clean migration generation; do not absorb this into
  reconciliation by accident.

---

## 10. Unrelated Documentation

The following untracked docs are unrelated to FSM and reference Luma Daily / Shopify:

- `docs/apps.md`
- `docs/deployment.md`
- `docs/qa-checklist.md`

Decision:

- Do not stage these files.
- Remove or relocate outside the FSM repository during workspace cleanup.

---

## 11. Recommended Disposition

Do not merge this overlay as a single unit.

Recommended split:

1. Workspace cleanup branch: remove or relocate unrelated root projects, unrelated docs, and generated JS output.
2. Agency branch: schema, service, routes, web console, and tests.
3. Customer portal branch: session schema, public/portal routes, UI, notification jobs, and tests.
4. Push notification branch: subscriptions, VAPID env, worker delivery, web service worker assets, and tests.
5. Landing page branch: root marketing page and auth-route behavior decision.
6. Reporting branch: reporting hook/UI expansions and mobile profile changes.
7. Runtime/health branch: CORS, health checks, proxy settings, and shutdown behavior.

Current disposition: **PRESERVE LOCALLY, DO NOT STAGE INTO FSM-0001.**
