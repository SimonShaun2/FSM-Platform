# SQL migration numbering registry (Tech Lead authority)

**Purpose:** One linear Drizzle journal (`packages/db/migrations/meta/_journal.json`). Prevent colliding `00xx_*.sql` tags across open PRs.  
**Canonical tip on `dev` @ `7f1e632`:** `0017_agent_control_plane` (idx 17).  
**Next free index:** **0018** (assign before generating new migrations).  
**Owner:** Tech Lead — pairs request slots in PR description before `drizzle-kit generate`.

**Rules**

1. Never renumber merged migrations on `dev`.  
2. Open PRs with conflicting numbers must **rebase and renumber** before E.. CoS merge to `dev`.  
3. One migration PR should prefer **one journal entry**; split only when rollback isolation requires it.  
4. FS-80 (#63) owns **policy** (transactions, locks, recovery); this registry owns **sequence**.

---

## Current `dev` chain (0000–0017)

| idx | Tag | Notes |
| --- | --- | --- |
| 0–16 | `0000` … `0016` | Historical FSM baseline |
| 17 | `0017_agent_control_plane` | Agent actions / control plane |

---

## Open PR reservations (audit 2026-10-22)

**Conflict:** Multiple PRs branched before `0017` landed on `dev`; they use **0018+** independently. **Do not merge out of order without renumbering.**

| Planned idx | Current file on PR | PR | FS ticket | Pair (FS-91) | Merge order |
| --- | --- | --- | --- | --- | --- |
| **0018** | `0018_growth_check_fs55.sql` | [#52](https://github.com/SimonShaun2/Renvani/pull/52) | FS-55 | Growth / TBD | **1** |
| **0019** | `0019_growth_check_activity_events.sql` | [#52](https://github.com/SimonShaun2/Renvani/pull/52) | FS-55 | Growth / TBD | **2** (same PR as 0018) |
| **0020** | `0020_inquiry_intake_idempotency.sql` | [#53](https://github.com/SimonShaun2/Renvani/pull/53) | FS-17 | Pair 2 (Priya+Leo) | **3** after #52 |
| **0021** | `0021_agent_action_approved_parameters.sql` | [#55](https://github.com/SimonShaun2/Renvani/pull/55) | FS-14 | Pair 4 (Ben+Nina) | **4** after FS-12 head stable |
| **0022** | `0022_fs53_growth_intake_foundation.sql` | [#56](https://github.com/SimonShaun2/Renvani/pull/56) | FS-53 | Growth | **5** — confirm dependency on #52/#53 |

**No new SQL files at heads (2026-10-22):** [#61](https://github.com/SimonShaun2/Renvani/pull/61) FS-75, [#62](https://github.com/SimonShaun2/Renvani/pull/62) FS-84, [#63](https://github.com/SimonShaun2/Renvani/pull/63) FS-80, [#57](https://github.com/SimonShaun2/Renvani/pull/57) Batch 3 bundle.

**Next unallocated slot after reconciling above:** **0023** (request from Tech Lead before generate).

---

## Pair queue (FS-91) — migration expectations

| Pair | Devs | Ticket | PR | Schema change expected? |
| --- | --- | --- | --- | --- |
| 1 | Ava + Marcus | FS-84 | #62 | Unlikely (contract/tests); if needed → slot **0023+** |
| 2 | Priya + Leo | FS-80 | #63 | No new SQL (ops policy) |
| 3 | Sofia + Omar | FS-92 | (new) | RLS/policy tests may add **0023+** after founder FS-93 |
| 4 | Ben + Nina | FS-75 | #61 | No SQL (staging docs) |
| 5 | Diego + Hana | FS-76 | (new) | TBD — request slot |

---

## Renumber procedure (for PR authors)

1. Fetch `dev`, note current max idx in `_journal.json`.  
2. `git rebase dev` on feature branch.  
3. Rename SQL + update `_journal.json` entries to next contiguous indices.  
4. Run `pnpm --filter @fsm/db db:migrate` locally against empty DB.  
5. Post old→new tag map in PR comment for E.. CoS.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-10-22 | Initial registry; mapped #52–#56 migration collision risk post-0017 |
