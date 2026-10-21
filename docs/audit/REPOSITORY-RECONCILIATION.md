# REPOSITORY-RECONCILIATION.md

**Ticket:** FSM-0001
**Date:** 2026-08-21
**Repository:** `SimonShaun2/Renvani` (GitHub rename from `SimonShaun2/FSM-Platform`; verified 2026-10-21)
**Prepared from:** direct inspection of the founder machine working tree and `origin/main`

> **2026-10-21 annotation:** GitHub renamed the repository to Renvani. Protected integration branch is **`dev`**; **`main`** is promotion-only (founder). **F2 decided by Shaun 2026-10-21: PR #1 → `dev`.** Merge gate: peer review, QA, Security-by-risk at exact head, approved batch CI, then **E.. CoS** final approval into `dev`.

---

## 1. Purpose

This document records the measured repository state for Sprint 0 reconciliation work.
It exists so the restart baseline is derived from repository artifacts rather than chat
memory.

---

## 2. Verified Git Baseline

### Remote

- Remote name: `origin`
- Remote URL: `https://github.com/SimonShaun2/Renvani.git` (redirects from former `FSM-Platform` slug)
- Default branch under audit: `main`

### Baseline SHA

- Local `HEAD`: `12b23226c0e0c199626940117fc7f0fa89f87375`
- `origin/main`: `12b23226c0e0c199626940117fc7f0fa89f87375`

### Commit divergence

Measured with:

```powershell
git rev-list --left-right --count origin/main...HEAD
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
```

Result:

- Ahead of `origin/main`: `0`
- Behind `origin/main`: `0`
- Local-only commits: none
- Remote-only commits: none

**Conclusion:** committed history is already reconciled. The repository divergence problem
is not in commit history; it is in the local working tree.

---

## 3. Tag State

Measured with:

```powershell
git tag --list
git ls-remote --tags origin
```

### Present locally

- `v1.0.0`
- `v2.0.0`

### Present on origin

- `v1.0.0`
- `v2.0.0`

### Missing vs documented milestone history

The following milestone tags are referenced by project documentation but are absent from
the repository:

- `v3.0.0`
- `v2.0.0-baseline`

### Tag restoration

`v1.0.0` was restored on 2026-08-21 as an annotated tag pointing at commit
`57a87fc9a2f882ad15faa2f04a1e1ca4bc2c0717`, whose commit message is
`Phase 1C complete: TICKETS 010-013 - BullMQ Workers, CSV Import, AI Revenue Engine, SMS Automation`.

**Conclusion:** milestone tagging is partially complete. `v3.0.0` is not defensible from
committed history because TICKET-034 is documented as approved but no corresponding commit
exists on `main`, and tickets 035-038 are present only in the local dirty overlay.

---

## 4. Working Tree Divergence

Measured with:

```powershell
git status --short
```

### Summary on 2026-08-21

- Tracked files modified: `44`
- Untracked entries visible after `.gitignore` tightening: `84`

### What the dirty tree contains

The local overlay is a mix of:

1. **Probable unpublished FSM product work**
   - agency routes and dashboard paths
   - portal routes and customer portal services
   - push notification services and worker processor
   - reporting tab extensions
   - migration `0017_icy_nicolaos.sql`

2. **Generated artifacts**
   - compiled `*.js`, `*.js.map`, `*.d.ts`, `*.d.ts.map` under source directories
   - Next.js build output under `apps/web/.next/`

3. **Workspace-local caches and tool directories**
   - `.corepack/`
   - `.npm-cache/`
   - `.pnpm-store/`
   - `.codex_tmp/`
   - browser scratch directories

4. **Completely unrelated non-FSM projects placed under the repo root**
   - examples include `VelumeAI/`, `amida-wp/`, `resume_redesign/`, `trayloop_*`, `luma-*`,
     `RepGeo-mono/`, `SimonShaun2-profile/`, and others

**Conclusion:** the current machine cannot yet serve as a trustworthy clean baseline for
Sprint 0 because the working tree contains both real unpublished work and substantial local
noise.

---

## 5. Tracked Generated Files

Measured with:

```powershell
git ls-files "*.js" "*.js.map" "*.d.ts" "*.d.ts.map"
```

Confirmed tracked generated or generated-adjacent files include:

- `.eslintrc.js`
- `apps/api/src/test-support/env-setup.d.ts`
- `apps/api/src/test-support/env-setup.js`
- `apps/api/src/test-support/fake-db.d.ts`
- `apps/api/src/test-support/fake-db.js`
- `apps/web/next-env.d.ts`

Not all of these are necessarily defects:

- `apps/web/next-env.d.ts` is standard for Next.js
- the `test-support/*.js` companions may be intentional compatibility files

However, the current tree also contains **untracked generated outputs** in source folders,
which proves repo hygiene is not yet under control.

---

## 6. `.gitignore` Status

The local `.gitignore` has been partially tightened during this audit.

It now ignores:

- dependency and package-manager caches: `node_modules/`, `.corepack/`, `.npm-cache/`, `.pnpm-store/`
- environment files with `.env.example` preserved
- logs
- common build output: `coverage/`, `dist/`, `tmp/`, `output/`, `outputs/`, `.next/`, `.turbo/`
- generated artifacts under `packages/*/src/`
- selected generated artifacts under `apps/api/src/`

This improves hygiene, but it does **not** resolve the main repository problem:

- the repo root still contains many unrelated non-FSM directories as untracked entries
- there is still substantial unpublished FSM work in tracked and untracked files
- there is still no clean separation between authoritative repo content and founder-machine workspace clutter

**Conclusion:** `.gitignore` is in better shape, but repo-root contamination and unpublished
work remain unresolved blockers.

---

## 7. Secret Scan Snapshot

Tracked-tree pattern scans were run against `HEAD` for common credential markers.

### Findings

- No tracked `.env`, `.pem`, `.key`, `.p12`, or `.pfx` files were found in the committed tree
- No obvious live secrets were found in committed source code
- The only high-signal match was in [docs/planning/PRODUCTION-DEPLOYMENT.md](/C:/Users/simon/OneDrive/Documents/Playground/docs/planning/PRODUCTION-DEPLOYMENT.md:85), which contains placeholder documentation text such as `sk_live_...`

### Status

- Working-tree scan against `HEAD`: no live secret exposure identified
- Full-history scan via `gitleaks git`: completed with `3` findings

### Full-history scan findings

1. `docs/planning/PHASE2-MASTER-PLAN.md:19`
   - Figma file key reference
   - Classified as a likely false positive / public design identifier

2. `docs/planning/PHASE2-MASTER-PLAN.md:23`
   - Repeated Figma file key reference in example code
   - Classified as a likely false positive / public design identifier

3. Historical path `trayloop/apps/web-marketing/src/app/demo/page.tsx:29`
   - `HUBSPOT_FORM_ID` value in older unrelated repo history
   - Classified as a likely false positive because the matched value is a HubSpot form ID, not an API token

**Conclusion:** there is no immediate evidence of committed live secrets in the current tree,
and the full-history scan did not surface any confirmed live credentials. The scan findings
should still be reviewed before final sign-off because they prove the repository history
contains unrelated project material.

---

## 8. Clean-Clone Verification

Verification was rerun from a fresh clone of `origin/main` at baseline
`12b23226c0e0c199626940117fc7f0fa89f87375`.

### Unpatched baseline results

- `corepack pnpm install`: passed
- `corepack pnpm build`: passed
- `corepack pnpm test`: failed

### Test failure summary

- Workspace total at failure: `7 failed | 274 passed (281)`
- Failing app: `@fsm/api`
- Passing apps/packages during the same run:
  - `@fsm/web`: passed
  - `@fsm/webhook`: passed
  - `@fsm/worker`: passed
  - `@fsm/ai`: passed

### Failing files

1. `apps/api/src/services/ai-revenue.service.test.ts`
   - `listRecommendations filters by type, excludes snoozed, and sorts urgency descending by default`
   - Failure: expected `result.total` to be `2`, received `3`

2. `apps/api/src/services/estimate.service.test.ts`
   - `getPublicEstimate returns a customer-safe view, marks viewedAt, and rejects expired tokens`
   - `customerApproveEstimate succeeds and rejects expired or already actioned estimates`
   - `customerDeclineEstimate declines via token and enqueues AI evaluation when enabled`
   - Failure in all three: `AppError: Estimate has expired`

3. `apps/api/src/routes/estimates/estimates.test.ts`
   - `GET /public/estimates/:token works without auth and rejects missing or expired tokens`
   - `POST /public/estimates/:token/approve works without auth and rejects repeat approvals`
   - `POST /public/estimates/:token/decline works without auth and enqueues AI evaluation`
   - Failure in all three: expected success responses `200`, received `409`

### Root cause

The failures were caused by hardcoded test dates that were future dates when the tests
were written but are now in the past on 2026-08-21:

- public estimate tests used `2026-05-28T00:00:00.000Z` as a non-expired token date
- the AI recommendation test used `2026-05-10T12:00:00.000Z` as a snooze-until date

Per FSM-0001, this finding is recorded rather than fixed in this ticket. The test-date
repair should be handled by the test baseline and coverage workstream.

### Non-blocking noise observed

- Vite emitted sourcemap warnings for missing `apps/api/src/test-support/env-setup.js.map`
- Worker tests logged expected structured error cases during retry/failure-path testing

**Conclusion:** the current remote baseline is not green. Even in a clean clone, install/build
pass but tests fail. FSM-0001 cannot be considered complete until the failing baseline is
explicitly accepted and handed to FSM-0007, or the fix is performed under the correct ticket.

---

## 9. Acceptance Criteria Status Snapshot

| Criterion | Status | Notes |
|---|---|---|
| `git log origin/main..HEAD` returns empty | Complete | No committed divergence |
| Remote tags include required milestones | Incomplete | `v1.0.0` and `v2.0.0` exist; `v3.0.0` and `v2.0.0-baseline` remain absent |
| No secrets or credentials in pushed tree | Partially verified | HEAD scan is clean apart from placeholder docs text |
| Secret scanning across full history | Complete with review note | `gitleaks` found 3 likely false positives, no confirmed live credentials |
| `node_modules`, build output and generated sources untracked | Incomplete | Common outputs are now ignored, but the root remains heavily contaminated |
| Branch protection active on `main` | Complete | PR required, one approval required, stale reviews dismissed, admin enforcement on, force pushes/deletions disabled |
| Baseline SHA recorded in `PROJECT_STATE.md` | Complete on PR branch | Present on `feature/FSM-0001-repository-reconciliation`; absent from `origin/main` until integration merge |
| Clean-clone install/build succeeds on baseline | Complete | Verified in fresh clone |
| Clean-clone full test suite passes on baseline | Incomplete | Clean clone fails with 7 API test failures |
| Subsequent Sprint 0 tickets reference baseline SHA | Incomplete | Cannot be verified from repository files until Sprint 0 control docs are added |

---

## 10. Residual Risks

1. **Unpublished FSM work may be stranded only in the founder working tree.**
   There are no unpushed commits, but there is substantial uncommitted FSM-related work.

2. **The repo root is acting as a general workspace, not an isolated repository root.**
   This increases the risk of accidental staging, false-positive audit findings, and baseline
   contamination.

3. **Tag history is incomplete.**
   Phase milestones referenced in docs are not reconstructable from remote tags today.

4. **Branch protection is active on `main`, but CI status checks are not required yet.**
   PR review is required, admin enforcement is on, force pushes/deletions are disabled, and
   required status checks remain unset until FSM-0010 defines the CI gates.

5. **The repository history includes unrelated project material.**
   The `gitleaks` scan hit an older `trayloop` path, which reinforces that this repo has
   served as a mixed workspace rather than a tightly bounded product repository.

6. **Sprint 0 control documents are not yet present on `origin/main`.**
   They exist on the PR branch (`feature/FSM-0001-repository-reconciliation`) but remain
   absent from `origin/main` until an authorized integration merge at an exact head.

7. **A root `CHANGELOG.md` is on the PR branch but not merged to `origin/main`.**
   The initial reconciliation and Sprint 0 scaffolding events are recorded there.

8. **Integration branch and batch CI are unset.**
   PR #1 still targets `main`. `GITHUB_WORKFLOW.md` and `TEAM.md` require a CoS/Technical
   Lead decision before merge or retarget. Approved-batch CI is policy-only (no workflows).

---

## 11. Next Actions

1. Separate **real unpublished FSM work** from local junk and caches.
2. Decide whether the current unpublished FSM working tree should be:
   - committed and merged into the reconciliation baseline, or
   - split into ticket branches, or
   - discarded as non-authoritative local work
3. Formally disposition the 7 clean-clone API test failures under FSM-0007, or fix them under a separate approved ticket.
4. Add the missing annotated tags where defensible historical commits can be identified.
5. Add required status checks to **`dev`** branch protection after FSM-0010 defines CI gates (`main` remains promotion-only).
6. Add the Sprint 0 control documents to the repository before relying on them as project state (on PR branch until merged to `dev`).
7. After exact-head peer review, QA, Security-as-risk, and approved batch CI, **E.. CoS** may merge governance into **`dev`** (not `main`). PR #1 base retarget to `dev` is founder decision **F2** only.
8. Re-run clean-clone verification against the eventual baseline tag after the test suite is green.

---

## 12. Current Reconciliation Status

**FSM-0001 is not complete.**

Committed history is reconciled, but the working tree is not. The baseline commit
`12b23226c0e0c199626940117fc7f0fa89f87375` is the current remote truth; it is **not yet**
the final Sprint 0 audit target because:

- the local working tree remains contaminated by unpublished FSM work and unrelated root folders
- Sprint 0 control documents are saved in the candidate branch but not merged to `origin/main`
- milestone tags are incomplete: `v1.0.0` and `v2.0.0` exist; `v3.0.0` and `v2.0.0-baseline` remain absent
- `main` branch protection does not require CI status checks yet because FSM-0010 has not landed
- the clean-clone baseline test suite currently fails with 7 API test failures

---

## 13. Candidate Branch Addendum

The working branch is `feature/FSM-0001-repository-reconciliation` (PR #1).

As of the 2026-08-21 audit snapshot it was five commits ahead of `origin/main`; the branch
has since accumulated governance remediation commits. Measure with:

`git rev-parse origin/main` and `git rev-parse origin/feature/FSM-0001-repository-reconciliation`

PR #1: `https://github.com/SimonShaun2/Renvani/pull/1` — draft; base **`dev`** (F2, 2026-10-21).

Current dirty working tree measurement:

- Tracked modified files: `43`
- Untracked status entries: `83`
- Tracked FSM-looking diff size: `43 files changed, 2580 insertions(+), 254 deletions(-)`

Additional detail is recorded in:

- `docs/audit/LOCAL-WORKTREE-OVERLAY.md`
- `docs/audit/UNPUBLISHED-FSM-WORK-INVENTORY.md`

**Decision:** do not stage the dirty overlay into this branch without a targeted domain review.
After gates at an exact head, merge governance into **`dev`** via E.. CoS approval; split
unpublished FSM product overlay into separate reviewable branches. See
`docs/reference/WORKFLOW/reconciliation.md`.
