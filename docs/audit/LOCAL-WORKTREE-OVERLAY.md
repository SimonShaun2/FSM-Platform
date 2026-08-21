# LOCAL-WORKTREE-OVERLAY.md

**Ticket:** FSM-0001
**Date:** 2026-08-21
**Branch:** `feature/FSM-0001-repository-reconciliation`
**Purpose:** classify the dirty local working tree before any baseline or feature build work proceeds.

---

## 1. Summary

The local working tree is not safe for broad staging.

Measured on 2026-08-21:

- Tracked modified files under `README.md`, `apps/`, `packages/`, and `pnpm-lock.yaml`: `43`
- Untracked status entries: `83`
- Tracked FSM-looking diff size: `43 files changed, 2580 insertions(+), 254 deletions(-)`
- Current branch-only Sprint 0 commits ahead of `origin/main`: `5`

The overlay appears to contain real unpublished FSM product work mixed with unrelated projects
and local tooling artifacts. Treating the whole tree as authoritative would contaminate the
Sprint 0 baseline.

Detailed module-level findings are recorded in `docs/audit/UNPUBLISHED-FSM-WORK-INVENTORY.md`.

---

## 2. Probable FSM Product Work

These paths appear related to the FSM platform and should be reviewed as candidate future
ticket work, not blindly committed into FSM-0001:

- `apps/api/src/routes/agency/`
- `apps/api/src/routes/portal/`
- `apps/api/src/routes/public/portal/`
- `apps/api/src/routes/push/`
- `apps/api/src/middleware/portal-auth.ts`
- `apps/api/src/services/agency.service.ts`
- `apps/api/src/services/customer-portal.service.ts`
- `apps/api/src/services/push.service.ts`
- `apps/web/app/(app)/agency/`
- `apps/web/app/(portal)/`
- `apps/web/src/components/agency/`
- `apps/web/src/components/portal/`
- `apps/web/src/components/landing/`
- `apps/web/src/hooks/agency.hooks.ts`
- `apps/web/src/hooks/portal.hooks.ts`
- `apps/web/src/hooks/push.hooks.ts`
- `apps/web/src/lib/portal-api.ts`
- `apps/web/src/stores/portal-auth.store.ts`
- `apps/worker/src/processors/push-notification.processor.ts`
- `packages/jobs/src/push-delivery.ts`
- `packages/types/src/agency.types.ts`
- `packages/types/src/portal.types.ts`
- `packages/types/src/push.types.ts`
- `packages/db/migrations/0017_icy_nicolaos.sql`
- `packages/db/migrations/meta/0017_snapshot.json`

Recommendation:

- Preserve these files in place for now.
- Do not merge them into the Sprint 0 reconciliation branch without a targeted review.
- Split them into one or more later feature/audit branches after the baseline is stable.

---

## 3. Tracked Modified Platform Files

The tracked diff touches core platform files:

- API package metadata, app registration, auth plugin, public routes, server startup, services, tests, and fake DB support.
- Web app layout, page shell, middleware, auth/navigation helpers, query provider, mobile shell, reporting UI and hooks.
- Worker package metadata, processor registration, and notification processor coverage.
- Config env validation, database schema and migration journal, jobs package metadata, shared types, and lockfile.

These changes may be meaningful, but they are too broad for FSM-0001. They should be audited
by domain before becoming repository baseline.

Recommendation:

- Generate a per-domain diff review before staging any of these files.
- If retained, group them by ticket or module so QA can verify intent and test scope.

---

## 4. Obvious Non-FSM Workspace Contamination

The following untracked root entries do not appear to belong to the FSM platform repository:

- `.chrome-noir-9230-fresh/`
- `.chrome-noir-9232/`
- `.codex_tmp/`
- `_node_spec_extract/`
- `_node_spec_extract.zip`
- `amida-wp/`
- `apps/restaurant-waitlist/`
- `hubspot-sdr-agent/`
- `luma-daily/`
- `luma-daily-deploy-staging/`
- `luma-daily-main-fix/`
- `luma-daily-shopify/`
- `luma-shopify-theme/`
- `noir-os/`
- `repgeo-animation-fix-20260515-192230/`
- `repgeo-animation-video-assets/`
- `repgeo-animations-v3-fixed.zip`
- `repgeo-solo-v3-animations-fixed.zip`
- `RepGeo-mono/`
- `resume_redesign/`
- `seo-agency-site/`
- `SimonShaun2-profile/`
- `trayloop_bugfix/`
- `trayloop_bugfix_land/`
- `trayloop_bugfix_latest/`
- `trayloop_email_ticket/`
- `trayloop_multilocation_tl101/`
- `trayloop_promo_land/`
- `trayloop_runtime_health_land2/`
- `trayloop_storefront_no_location_fix/`
- `trayloop_storefront_upsell_fix/`
- `trayloop_tier2_37/`
- `trayloop_tier2_37_land/`
- `trayloop_tier3_suite/`
- `VelumeAI/`
- `VelumeAI-main-release/`

Recommendation:

- Do not stage these paths.
- Move them outside the repository root or add narrowly scoped ignore rules only after
  confirming they are not intentionally part of this repo.

---

## 5. Ambiguous Root Entries

These entries may be local artifacts or may need human classification:

- `.theme-check.yml`
- `config/`
- `layout/`
- `locales/`
- `run-node-migration.js`

Recommendation:

- Inspect before removing or ignoring.
- Do not stage as part of FSM-0001.

---

## 6. Documentation Overlay

The following untracked documentation files are not part of the current Sprint 0 governance
commit set and were confirmed to reference Luma Daily / Shopify rather than FSM:

- `docs/apps.md`
- `docs/deployment.md`
- `docs/qa-checklist.md`

Recommendation:

- Do not stage these files.
- Remove or relocate them outside the FSM repository during workspace cleanup.

---

## 7. Baseline Decision

FSM-0001 should not merge the dirty overlay as-is.

Safe path:

1. Merge the current Sprint 0 governance/audit branch after review.
2. Keep the dirty overlay local and uncommitted.
3. Create separate follow-up branches for verified FSM product work.
4. Remove or relocate unrelated root workspace folders outside the repository.
5. Re-run clean-clone install, build, and test against the eventual baseline tag.

Current disposition: **CHANGES REQUIRED before final baseline tagging.**
