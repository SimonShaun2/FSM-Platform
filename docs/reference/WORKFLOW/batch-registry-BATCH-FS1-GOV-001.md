# Batch registry — `BATCH-FS1-GOV-001`

**Status:** `PROPOSED` (not approved — do not run CI)

| Field | Value |
|---|---|
| Batch ID | `BATCH-FS1-GOV-001` |
| Owner | Platform 1 |
| Approver (founder) | Shaun — pending |
| CoS recorder | PM / E.CoS — pending |
| Technical Lead (waiver) | Pending signature |
| Repository | `SimonShaun2/Renvani` |
| Integration branch (proposed) | `integration` |
| PRs in batch | [#1](https://github.com/SimonShaun2/Renvani/pull/1) governance reconciliation |
| Base SHA | `12b23226c0e0c199626940117fc7f0fa89f87375` |
| Batch head SHA | *Set at approval time — local remediation `git rev-parse HEAD` on `cursor/fs-1-pr1-remediation-0f37`* |

## Commands

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm lint
corepack pnpm --filter @fsm/api test
```

## Expected outcomes

| Command | Expected |
|---|---|
| install / build / lint | Exit 0 |
| `@fsm/api test` | Exit 1 — **7 failures waived** per decision packet |

## Run record

| Field | Value |
|---|---|
| Workflow run URL | — |
| Conclusion | — |
| Executed at (UTC) | — |
| Exact head SHA | — |
