# SQL migration numbering registry (Tech Lead authority)

**Purpose:** One linear Drizzle journal (`packages/db/migrations/meta/_journal.json`). Prevent colliding `00xx_*.sql` tags across open PRs.  
**Canonical tip on `dev` @ `7f1e632`:** `0017_agent_control_plane` (idx 17).  
**Next free index:** **0024** (after #52–#56 chain and #75 assignment below). Slots **0018–0022** reserved; **0023** assigned to [#75](https://github.com/SimonShaun2/Renvani/pull/75).  
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
| **0023** | `0023_field_work_sync.sql` (**assigned**) | [#75](https://github.com/SimonShaun2/Renvani/pull/75) | FS-87 | Pair 2 (**Priya** + Leo) | **6** after #52–#56 chain — **renumber from** `0018_field_work_sync` @ `57a0b37b` |

**Collision (2026-10-22):** [#75](https://github.com/SimonShaun2/Renvani/pull/75) head `57a0b37b` incorrectly uses `0018_field_work_sync.sql`; **0018–0019** belong to [#52](https://github.com/SimonShaun2/Renvani/pull/52). Priya: new commit renaming to **`0023_field_work_sync`** + `_journal.json` (no rebase/force-push).

**No new SQL at heads (2026-10-22):** [#61](https://github.com/SimonShaun2/Renvani/pull/61) FS-75 staging, [#62](https://github.com/SimonShaun2/Renvani/pull/62) FS-84, [#63](https://github.com/SimonShaun2/Renvani/pull/63) FS-80, [#57](https://github.com/SimonShaun2/Renvani/pull/57).

**Next unallocated slot:** **0024** (request from Tech Lead before generate).

---

## Pair queue (FS-91) — migration expectations

| Pair | Devs | Ticket | PR | Schema change expected? |
| --- | --- | --- | --- | --- |
| 1 | Ava + Marcus | FS-84 | #62 | Unlikely (contract/tests); if needed → slot **0023+** |
| 2 | Priya + Leo | FS-80 / **FS-87** | #63 / **#75** | #63: no SQL; **#75 → `0023_field_work_sync`** |
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
| 2026-10-22 | Assigned **0023** to #75 (FS-87); #75 must renumber off `0018_field_work_sync` |
