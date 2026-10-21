# Decision packet — integration target & approved-batch CI

**For:** Shaun (founder) · **From:** Platform 1 · **Date:** 2026-10-21
**Repository:** [`SimonShaun2/Renvani`](https://github.com/SimonShaun2/Renvani) (formerly `FSM-Platform`; see `repo-canonical.md`)
**Status:** **Platform recommendation submitted** — awaits founder approval before branch creation, protection changes, or CI execution.

---

## Executive summary

| Decision | Platform 1 recommendation |
|---|---|
| **A — Integration branch** | **A2:** create protected branch `integration`; retarget PR #1 from `main` → `integration`; keep `main` for founder/release promotion only. |
| **B — First approved batch** | **`BATCH-FS1-GOV-001`** — governance remediation head only; required gates = install + build + lint; API tests **run and recorded** with **signed waiver** for 7 known failures until FS-2 merges. |
| **C — Enforcement** | After A+B approval: Platform 1 adds workflows + required check contexts on `integration` (FSM-0010 implementation ticket; **not executed in this remediation**). |

**No merge, no CI run, no PASS** is authorized by this document alone.

---

## Decision A — integration branch target

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A1 — `main` as integration** | PR #1 stays on `main` | Simple | Conflicts with release gate language in `TEAM.md` §4 |
| **A2 — `integration` branch** *(recommended)* | PR #1 merges to `integration` first | Clear separation; `main` stays promotion target | One-time retarget + protection setup |
| **A3 — Hold** | No merge | Lowest risk | FS-1 docs remain off integration |

**Founder action:** Approve **A2** (or select A1/A3). If A2: confirm branch name `integration` and authorize retarget of [PR #1](https://github.com/SimonShaun2/Renvani/pull/1).

**Owners after approval**

| Role | Owner | Action |
|---|---|---|
| Founder | Shaun | Approve A2/A1/A3 |
| CoS | PM / E.CoS | Record decision on FS-1 Notion card |
| Platform 1 | Platform pair | Create `integration` from `main` @ `12b2322…`, configure protection draft for founder review |
| Technical Lead | TL | Confirm branch policy matches `GITHUB_WORKFLOW.md` |

---

## Decision B — approved-batch CI (first batch)

### Batch identity

| Field | Value |
|---|---|
| **Batch ID** | `BATCH-FS1-GOV-001` |
| **Purpose** | Evidence for FS-1 / PR #1 governance remediation (doc-only diff atop PR branch) |
| **Membership** | PR #1 branch head after remediation push (local remediation: `cursor/fs-1-pr1-remediation-0f37`; merge into `feature/FSM-0001-repository-reconciliation` before batch) |
| **Base ancestry** | `main` / `12b23226c0e0c199626940117fc7f0fa89f87375` |
| **Time box** | 45 minutes wall clock |
| **Budget** | Single GitHub Actions workflow run (when authorized) |

### Exact commands (batch runner — run only after founder approves batch)

From repository root, on the **exact batch head SHA** (record `git rev-parse HEAD` in registry):

```bash
corepack enable
node --version    # expect >= 20
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm lint
corepack pnpm --filter @fsm/api test
```

Optional informational (not blocking Batch 1 if waiver signed):

```bash
corepack pnpm test
```

### Required vs informational checks (Batch 1)

| Step | Required for batch PASS? | Owner |
|---|---|---|
| `pnpm install --frozen-lockfile` | **Yes** | Platform 1 |
| `pnpm build` | **Yes** | Platform 1 |
| `pnpm lint` | **Yes** | Platform 1 |
| `pnpm --filter @fsm/api test` | **Run required; 7 failures waived** | QA 3 records output; Technical Lead signs waiver |
| Full `pnpm test` | Informational | QA 3 |

### The 7 known API test failures (explicit waiver)

Measured on `main` lineage @ `12b2322` and unchanged by FS-1 governance docs. **Not fixed in PR #1.**

| # | File | Count | Nature |
|---|---|---|---|
| 1 | `apps/api/src/services/ai-revenue.service.test.ts` | 1 | Stale fixed dates / list total mismatch |
| 2 | `apps/api/src/services/estimate.service.test.ts` | 3 | Calendar-sensitive expectations |
| 3 | `apps/api/src/routes/estimates/estimates.test.ts` | 3 | Status/body expectations (e.g. 409 vs 200) |

**Remediation track:** [PR #16](https://github.com/SimonShaun2/Renvani/pull/16) (`cursor/fs-2-stale-date-fix-b8fd`) — FS-2. **Batch 2** (post–FS-2 merge) should require **zero** API test failures unless a new waiver is issued.

**Waiver text (for Technical Lead signature on batch registry):**

> For `BATCH-FS1-GOV-001` only, the seven failing API tests listed above are pre-existing baseline defects on commit ancestry `12b2322`, documented in `docs/audit/REPOSITORY-RECONCILIATION.md` and FS-1. Governance changes in the batch do not touch `apps/*`. CI may record `api-test` as failed while batch governance PASS is limited to install/build/lint. FS-2 must clear API failures before any batch that gates product work.

### Batch approval chain (before any CI run)

| Step | Role | Evidence |
|---|---|---|
| 1 | Founder | Approves A2 + `BATCH-FS1-GOV-001` scope and waiver policy |
| 2 | CoS | Publishes batch registry row (ID, SHAs, PR links) |
| 3 | Platform 1 | Confirms runner secrets and workflow file ready |
| 4 | Technical Lead | Signs API test waiver for Batch 1 |
| 5 | Run CI once | Platform 1 executes approved batch |
| 6 | QA 3 | Attaches test log to exact head |
| 7 | Reviewer 1 | Re-review governance at exact head |
| 8 | Gayle | Exact-head PASS only if 1–7 satisfied |

### Suggested required GitHub check contexts (after workflow implementation)

| Context | Maps to |
|---|---|
| `fsm-batch / install-build-lint` | install + build + lint |
| `fsm-batch / api-test-recorded` | api test (may fail with waiver for Batch 1 only) |

Apply to **`integration`** branch protection only after founder approves.

---

## Sequencing after founder approval

1. Founder approves **A2** + **Batch 1** policy (this packet).
2. Platform 1: create `integration`, implement workflows (FSM-0010), propose protection contexts — **no push from FS-1 remediation branch without separate authorization**.
3. Push remediation commits to `feature/FSM-0001-repository-reconciliation`; update PR #1 head; retarget base to `integration` when branch exists.
4. Execute **`BATCH-FS1-GOV-001`** once at recorded SHA.
5. Reviewer 1 + QA 3 + Gayle at that SHA; then merge PR #1 to `integration` — **not** production.

---

## Explicit non-actions

No merge, no standalone CI, no branch protection change, no Gayle PASS, and no production promotion from this packet until founder approves and steps above complete. TrayLoop remains paused.
