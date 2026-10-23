# SQL migration numbering registry (Tech Lead authority)

**Purpose:** One linear Drizzle journal (`packages/db/migrations/meta/_journal.json`). Prevent colliding `00xx_*.sql` tags across open PRs.  
**Canonical tip on `dev`:** idx **25** — `0025_agent_action_reversed_state` (pre-**0026** merge).  
**Owner:** Tech Lead (Grace) — **central idx assignment** below is authoritative for open PRs @ 2026-10-23.

**Rules**

1. Never renumber migrations **already merged** on `dev`.  
2. Open PRs use **only** the idx in the pending table for that PR — rename SQL + `_journal.json` on your branch.  
3. **Lineage columns** (`source_system`, `source_id`, `import_session_id`, lineage unique indexes on importable entities) live **only** in **`0026_fs_migrate_import_lineage`** (Noah **#96**). No other migration may `ADD COLUMN` those fields.  
4. FS-80 (#63) owns **policy** (transactions, locks, recovery); this registry owns **sequence**.  
5. Sync feature branches with **`git merge origin/dev`** only — **no rebase, no force-push**.

---

## Current `dev` chain (0000–0025)

| idx | Tag | Notes |
| --- | --- | --- |
| 0–16 | `0000` … `0016` | Historical FSM baseline |
| 17 | `0017_agent_control_plane` | Agent actions / control plane |
| 18–19 | `0018_growth_check_fs55`, `0019_growth_check_activity_events` | FS-55 |
| 20 | `0020_inquiry_intake_idempotency` | FS-17 |
| 21 | `0021_agent_action_approved_parameters` | FS-14 |
| 22 | `0022_fs53_growth_intake_foundation` | FS-53 |
| 23 | `0023_field_work_sync` | FS-87 |
| 24 | `0024_fs89_data_export_sessions` | FS-89 (#81 renumber) |
| 25 | `0025_agent_action_reversed_state` | Agent action enum `reversed` (#81) |

---

## Pending allocations (planned merge order)

Apply after **`git merge origin/dev`**. Contiguous chain **0026 → 0030**.

| idx | SQL tag | Owner | PR | Scope (migration file only) |
| --- | --- | --- | --- | --- |
| **26** | `0026_fs_migrate_import_lineage` | **Noah** | [#96](https://github.com/SimonShaun2/Renvani/pull/96) | **All import lineage DDL** |
| **27** | `0027_stack10_tenant_rls_policies` | **Sofia** | [#102](https://github.com/SimonShaun2/Renvani/pull/102) | RLS policies |
| **28** | `0028_fs_migrate_onboarding_wizard` | **Ben** | [#114](https://github.com/SimonShaun2/Renvani/pull/114) | Wizard columns — **no lineage columns** |
| **29** | `0029_fs_migrate_price_book_catalog` | **Omar** | [#113](https://github.com/SimonShaun2/Renvani/pull/113) | Price book catalog |
| **30** | `0030_fs_migrate_invoice_payment_import` | **Hana** | [#115](https://github.com/SimonShaun2/Renvani/pull/115) | Invoice/payment import |

**No migration file:** **Ezra** [#110](https://github.com/SimonShaun2/Renvani/pull/110) — drop `0027_stack10_*` SQL from branch.

**Merge batch 1 (8–10 PRs):** #96, #107, #117, #102, #114, #113, #115, #110, #112, #103, #101, #104 — one batched triple sign-off when all green; merge preserving SQL order **0026→0030**.

**FS-94 platform billing:** **⏸** per `BATCH-PLAN-5-9.md` §0.

---

## Owner sync procedure (2026-10-23)

1. `git fetch origin dev`  
2. `git merge origin/dev` (**no rebase, no force-push**).  
3. Rename migration to assigned idx/tag; fix `_journal.json`.  
4. `pnpm --filter @fsm/db db:check-migrations` + `pnpm --filter @fsm/db test`.  
5. PR comment: `old_tag → new_tag` for E.. CoS.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-10-23 | Central assign **0026–0030**; batch-1 merge policy (8–10 PRs) |
