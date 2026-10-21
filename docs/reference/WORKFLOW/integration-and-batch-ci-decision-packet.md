# Decision packet — integration target & approved-batch CI

**For:** Shaun (founder) · **From:** Platform 1 · **Date:** 2026-10-21
**Repository:** [`SimonShaun2/Renvani`](https://github.com/SimonShaun2/Renvani) (see `repo-canonical.md`)
**Status:** **F2 decided by Shaun 2026-10-21: PR #1 → `dev`.** Batch execution awaits explicit approval.

---

## Integration branch (decided)

| Branch | Role |
|---|---|
| **`dev`** | Protected integration. Peer review, QA, Security, batch CI, then **E.. CoS** final merge approval. |
| **`main`** | Promotion-only. Shaun only. |

PR #1 is based on **`dev`**. Merges land on **`dev`** after gates.

---

## First approved batch: `BATCH-FS1-GOV-001`

**Registry:** `batch-registry-BATCH-FS1-GOV-001.md`

### Exact commands

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm lint
corepack pnpm --filter @fsm/api test
```

| Step | Required | Owner |
|---|---|---|
| install / build / lint | Pass | Platform 1 |
| `@fsm/api test` | Run; **7 failures waived** for this governance-only batch | QA 3 records; E.. CoS accepts waiver with FS-2 track |

### Seven waived API failures (baseline @ `12b2322`)

`ai-revenue.service.test.ts` (1), `estimate.service.test.ts` (3), `estimates.test.ts` (3). Fix: FS-2 / PR #16. Batch 2+ requires green API tests unless new waiver.

### Approval chain

Peer reviewer → QA → Security (if risk) → approved batch CI → **E.. CoS** merge to **`dev`**.

---

## Non-actions

No CI run, protection change, or merge from this packet alone. No PASS claimed.
