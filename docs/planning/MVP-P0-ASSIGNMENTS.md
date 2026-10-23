# MVP P0 assignments — Batches 7–9 (active dispatch)

**Authority:** Founder MVP-first policy (`BATCH-PLAN-5-9.md` §0) + winter urgency (`MVP-SHORTEST-PATH-WINTER-2026.md`, `MVP-MIGRATION-AI-IMPORT.md`) · **PO:** Elena  
**Tech Lead:** Grace · **Rule:** Each PR needs **Isaac + Lily + Sam PASS @ exact head** before `batch-ci` merge. Request reviewers **within 1h of push**.

**Integration base:** `dev` (merge-from-dev only on conflict — never rebase signed heads).

---

## MVP P0 backlog (Elena cut-line)

| Priority | Ticket | Lifecycle | Status |
| --- | --- | --- | --- |
| P0 | **FS-11 / migration** | Migrate | AI-guided import + presets (Jobber/HCP/ST/**QuickBooks**) — [#92](https://github.com/SimonShaun2/Renvani/pull/92); QB items/invoices P0b/c next |
| P0 | **FS-38** | Discover | [#88](https://github.com/SimonShaun2/Renvani/pull/88) |
| P0 | **FS-21** | Book | [#89](https://github.com/SimonShaun2/Renvani/pull/89) |
| P0 | **FS-58** | Discover/Book | [#90](https://github.com/SimonShaun2/Renvani/pull/90) |
| P0 | **Dispatch SSE** | Serve | [#86](https://github.com/SimonShaun2/Renvani/pull/86) @ `6ca557f` — Isaac PASS, Sam ACCEPT; **Lily @ head pending** |
| P0 | **FS-72** | Repeat | #85 merged; [#91](https://github.com/SimonShaun2/Renvani/pull/91) |
| P0 | **FS-87** | Serve | #83 merged |
| P0 | **Migration plan** | Migrate | [#93](https://github.com/SimonShaun2/Renvani/pull/93) winter shortest path |

**Founder gate (no dev work):** QuickBooks OAuth / Intuit developer app — Ezra documents only until founder approves budget.

---

## Migration squad (16 devs — parallel, no idle)

| # | Dev | Pod | Track | Deliverable | Branch / PR |
| --- | --- | --- | --- | --- | --- |
| 1 | **Marcus** | Import 1 | FS-11 P0a | FSM + **QB customer** header presets | [#92](https://github.com/SimonShaun2/Renvani/pull/92) |
| 2 | **Noah** | Import 1 | FS-11 | Preset types, entity-aware sniff | [#92](https://github.com/SimonShaun2/Renvani/pull/92) |
| 3 | **Kai** | Import 1 | FS-11 | Golden CSV fixtures (Jobber/HCP/ST/**QB** × entity) | `cursor/fs-11-import-golden-fixtures-1f27` |
| 4 | **Aria** | Import 2 | FS-11 P0c | Invoice + payment history import service (tenant-scoped) | `cursor/fs-11-qb-invoices-import-1f27` |
| 5 | **Hana** | Import 2 | FS-11 P0b | Products/services (`products`) import worker path | `cursor/fs-11-qb-items-import-1f27` |
| 6 | **Iris** | Import 3 | FS-11 | Fix 3× import `/errors` contract tests | `cursor/fs-11-import-errors-fix-1f27` |
| 7 | **Priya** | Import UX | FS-11 | Vendor + entity picker in import wizard | `cursor/fs-11-import-ui-vendor-step-1f27` |
| 8 | **Leo** | Import UX | FS-11 | Preview/commit copy (AI-guided, on-brand) | With Priya after [#88](https://github.com/SimonShaun2/Renvani/pull/88) |
| 9 | **Ezra** | Infra | FS-11 | QB OAuth **founder gate** doc (no credentials) | [#93](https://github.com/SimonShaun2/Renvani/pull/93) + security note |
| 10 | **Mila** | Infra | FS-11 | CI coverage for preset + import contract tests | [#92](https://github.com/SimonShaun2/Renvani/pull/92) |
| 11 | **Ava** | Repeat | FS-72 | Agent policy | [#91](https://github.com/SimonShaun2/Renvani/pull/91) |
| 12 | **Diego** | Repeat | FS-72 | Worker stub | [#91](https://github.com/SimonShaun2/Renvani/pull/91) |
| 13 | **Sofia** | Public | FS-58 | Runbook | [#90](https://github.com/SimonShaun2/Renvani/pull/90) |
| 14 | **Nina** | Book | FS-21 | Hold inspect | [#89](https://github.com/SimonShaun2/Renvani/pull/89) |
| 15 | **Omar** | Serve | Dispatch | SSE API | [#86](https://github.com/SimonShaun2/Renvani/pull/86) |
| 16 | **Ben** | Serve | Dispatch | EventSource | [#86](https://github.com/SimonShaun2/Renvani/pull/86) |
| — | **Elena** | PO | All | Cut-line, QB P0b/c acceptance, OAuth gate | `MVP-MIGRATION-AI-IMPORT.md` |

*Grace / Tech Lead:* [#93](https://github.com/SimonShaun2/Renvani/pull/93) planning merges; unblock import branches on `dev`.

---

## Open PR tracker

| PR | Head (sign @) | Isaac | Lily | Sam |
| --- | --- | --- | --- | --- |
| [#86](https://github.com/SimonShaun2/Renvani/pull/86) | `6ca557f` | PASS | **pending @ head** | ACCEPT |
| [#88](https://github.com/SimonShaun2/Renvani/pull/88)–[#91](https://github.com/SimonShaun2/Renvani/pull/91) | see PR | ☐ | ☐ | ☐ |
| [#92](https://github.com/SimonShaun2/Renvani/pull/92) | import presets | ☐ | ☐ | ☐ |
| [#93](https://github.com/SimonShaun2/Renvani/pull/93) | winter plan | ☐ | ☐ | ☐ |

---

## PR workflow (mandatory)

1. Push → request **Isaac, Lily, Sam @ full SHA within 1h**.
2. Triple PASS → `batch-ci` → merge with head SHA guard.
3. CoS report at batch merge + MVP dates (`MVP-SHORTEST-PATH-WINTER-2026.md` §5).
