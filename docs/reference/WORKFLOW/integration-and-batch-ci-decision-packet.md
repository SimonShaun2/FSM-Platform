# Decision packet — integration target & approved-batch CI

**For:** Shaun (founder) · **From:** Platform 1 (FS-1 remediation) · **Date:** 2026-10-20  
**Status:** Awaiting decision — **not decided in this commit**

## Why this exists

PR #1 (`feature/FSM-0001-repository-reconciliation`) is governance/audit-only but **cannot merge safely** until two policy gaps are closed. Reviewer 1 and `docs/audit/REPOSITORY-RECONCILIATION.md` agree: today `main` allows merge with **one human approval and zero required CI checks**.

## Decision A — integration branch target

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A1 — `main` as integration** | Retarget PR #1 to `main`; future feature PRs also merge to `main` | Simple; matches current PR base | Collides with “production promotion is separate” if `main` is also release truth |
| **A2 — `integration` (or `develop`) branch** | Create protected integration branch; PR #1 merges there first; `main` only via release gate | Clear separation per `TEAM.md` §4 / `GITHUB_WORKFLOW.md` §5 | Requires branch creation, protection, retarget PR #1, team habit change |
| **A3 — Hold** | Keep PR #1 draft; no merge until FS board sequences FS-2+ | Lowest risk now | Sprint 0 docs stay off `main` longer |

**Platform 1 recommendation:** **A2** if `main` is intended to stay founder/production-aligned; **A1** only if the team explicitly accepts `main` as the day-to-day integration branch with a later tag-based release process.

**Needed from Shaun:** pick A1 / A2 / A3; if A2, provide branch name and whether existing open PRs retarget immediately.

## Decision B — approved-batch CI

| Element | Current state | Needed |
|---|---|---|
| Policy | `GITHUB_WORKFLOW.md` §4, `TEAM.md` §4 — batch-only CI | Already in repo on PR branch |
| Enforcement | **No** `.github/workflows/` | Workflow or external runner + **required check contexts** on integration branch |
| Batch registry | Not in repo | Artifact: batch ID, PR list, exact SHAs, commands, owner, time box |
| Who approves a batch | Undefined in repo | Suggest: CoS + Platform 1 + Gayle eligibility check before run |

**Platform 1 recommendation:** First batch is **FS-1 governance only** at the post-remediation PR head:

1. Commands: `pnpm install`, `pnpm build`, `pnpm --filter @fsm/api test` (expect **known 7 failures** on `main` lineage unless FS-2 fixes land first — record as accepted baseline or block batch).
2. Required check names (example): `fsm-batch / build`, `fsm-batch / api-test` — exact names must match GitHub contexts once workflows exist.
3. Add those contexts to branch protection on the **integration branch** chosen in Decision A.

**Needed from Shaun:** authorize Platform to implement FSM-0010 mechanics in a **follow-up ticket** (not this doc-only remediation); approve whether batch 1 may run with known test failures documented as waivers.

## Sequencing after decisions

1. Shaun decides A + B (this packet).
2. Platform applies branch protection + check contexts (separate change — not part of FS-1 minimal doc fix).
3. Reviewer 1 re-review at exact head; QA / Security as risk; **approved batch CI** run; Gayle verdict.
4. Merge PR #1 to chosen integration branch only after gates — still **not** production promotion.

## Explicit non-actions

This packet does **not** authorize merge, CI run, protection changes, or PASS. TrayLoop remains paused.
