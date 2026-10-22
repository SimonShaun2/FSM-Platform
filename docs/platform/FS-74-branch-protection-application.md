# FS-74 — Branch protection application guide (Shaun applies in GitHub UI)

**Ticket:** FS-74 / Platform assignment FS-91  
**Repository:** `SimonShaun2/Renvani`  
**Prepared by:** Platform 1  
**Do not apply via automation from this PR** — founder applies settings below in GitHub.

## Branch model (confirmed)

| Branch | Role |
|---|---|
| **`dev`** | Protected integration. PR + review + batch CI at exact head. E.. CoS final merge approver. |
| **`main`** | Promotion-only. Shaun merges from `dev`. Stricter protection, no day-to-day feature merges. |

## CI check names (from repo workflow — do not invent)

Workflow file: `.github/workflows/batch-ci.yml`  
Workflow **name:** `Batch CI (approved)`  
Job **id:** `batch`  

**Required status check context to require on `dev` (when batch CI is in use):**

```text
Batch CI (approved) / batch
```

CI runs only when PR has label `batch-ci` (approved batch). Merges that claim batch evidence must have that label and a green run at the PR head.

## `dev` — exact settings to apply

Use **Settings → Branches → Branch protection rules** or **Rulesets → New ruleset** targeting `dev`.

| Setting | Value |
|---|---|
| Require a pull request before merging | **On** |
| Required approvals | **1** |
| Dismiss stale pull request approvals when new commits are pushed | **On** |
| Require review from Code Owners | **Off** (unless CODEOWNERS added later) |
| Require status checks to pass before merging | **On** |
| Require branches to be up to date before merging | **On** |
| Status checks that are required | **`Batch CI (approved) / batch`** (add after first workflow run appears in the list) |
| Require conversation resolution before merging | **On** (recommended) |
| Allow force pushes | **Off** |
| Allow deletions | **Off** |
| Restrict who can push to matching branches | **On** — no direct pushes; merges via PR only |
| Bypass list | **Shaun only** for documented emergencies; log bypass in FS board + PR comment |

**Merge methods:** Allow merge commit; disable **rebase merge** and **squash** if policy is no-rebase (team convention: no rebase/force-push of reviewed heads).

## `main` — exact settings to apply

| Setting | Value |
|---|---|
| Require a pull request before merging | **On** |
| Required approvals | **1** (founder promotion) |
| Dismiss stale approvals on new commits | **On** |
| Require status checks to pass | **On** when promotion checks exist; until then **optional** with documented waiver on promotion PR |
| Required checks (initial) | Same as `dev` if promoting with batch evidence: **`Batch CI (approved) / batch`**; add release checks when defined |
| Require branches up to date | **On** |
| Allow force pushes | **Off** |
| Allow deletions | **Off** |
| Restrict pushes | **On** — **Shaun** (and admins if needed for break-glass only) |
| Bypass list | **Empty** or **Shaun only** with mandatory audit note on promotion PR |

## Post-apply verification (acceptance)

1. Open a **draft test PR** into `dev`; confirm direct push to `dev` is rejected.
2. Without `batch-ci` label / green check, merge to `dev` should be **blocked** once checks are required.
3. With failing `Batch CI (approved) / batch`, merge blocked.
4. Record rules screenshot or `gh api` export in FS-74 Evidence.

## Emergency bypass

Approver: **Shaun** only. Require: FS ticket id, reason, exact SHA, follow-up PR within 24h.

## Related

- `GITHUB_WORKFLOW.md` §2–§4  
- `docs/reference/WORKFLOW/batch-registry-BATCH-FS1-GOV-001.md`  
- Notion FS-74
