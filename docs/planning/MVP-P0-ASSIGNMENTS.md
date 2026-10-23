# MVP P0 assignments — Batches 7–9 (active dispatch)

**Authority:** Founder MVP-first policy (`BATCH-PLAN-5-9.md` §0) + winter urgency (`MVP-SHORTEST-PATH-WINTER-2026.md`) · **PO:** Elena  
**Tech Lead:** Grace · **Rule:** Each PR needs **Isaac + Lily + Sam PASS @ exact head** before `batch-ci` merge. Request reviewers **within 1h of push**.

**Integration base:** `dev` (merge-from-dev only on conflict — never rebase signed heads).

---

## MVP P0 backlog (Elena cut-line)

| Priority | Ticket | Lifecycle | Status |
| --- | --- | --- | --- |
| P0 | **FS-11 / import** | Migrate | Vendor CSV presets (Jobber/HCP/ST) + FS-11 test fix |
| P0 | **FS-38** | Discover | [#88](https://github.com/SimonShaun2/Renvani/pull/88) |
| P0 | **FS-21** | Book | [#89](https://github.com/SimonShaun2/Renvani/pull/89) |
| P0 | **FS-58** | Discover/Book | [#90](https://github.com/SimonShaun2/Renvani/pull/90) |
| P0 | **Dispatch SSE** | Serve | [#86](https://github.com/SimonShaun2/Renvani/pull/86) @ `6ca557f` — Isaac PASS, Sam ACCEPT; **Lily @ head pending** |
| P0 | **FS-72** | Repeat | #85 merged; [#91](https://github.com/SimonShaun2/Renvani/pull/91) policy + worker stub |
| P0 | **FS-87** | Serve | #83 merged (contract doc) |

---

## Developer assignments (16 + Elena) — parallel P0

| # | Dev | Pod | Ticket | Deliverable | Branch / PR |
| --- | --- | --- | --- | --- | --- |
| 1 | **Ava** | Pair 1 | FS-72 | `loyalty.reminder.propose` policy | `cursor/fs-72-agent-policy-ava-1f27` → [#91](https://github.com/SimonShaun2/Renvani/pull/91) |
| 2 | **Marcus** | Pair 1 | FS-11 | Jobber/HCP/ST header presets in worker | `cursor/fs-11-import-vendor-presets-1f27` (next) |
| 3 | **Priya** | Pair 2 | FS-38 | Book flow QA matrix @ #88 head | Support [#88](https://github.com/SimonShaun2/Renvani/pull/88) |
| 4 | **Leo** | Pair 2 | FS-38 | Idempotency + consent UX | [#88](https://github.com/SimonShaun2/Renvani/pull/88) |
| 5 | **Sofia** | Pair 3 | FS-58 | Public surface runbook | [#90](https://github.com/SimonShaun2/Renvani/pull/90) |
| 6 | **Omar** | Pair 3 | Dispatch | SSE API | [#86](https://github.com/SimonShaun2/Renvani/pull/86) |
| 7 | **Ben** | Pair 4 | Dispatch | EventSource + poll | [#86](https://github.com/SimonShaun2/Renvani/pull/86) |
| 8 | **Nina** | Pair 4 | FS-21 | Hold-token inspect / resume | [#89](https://github.com/SimonShaun2/Renvani/pull/89) |
| 9 | **Diego** | Pair 5 | FS-72 | Worker dry-run stub | [#91](https://github.com/SimonShaun2/Renvani/pull/91) |
| 10 | **Hana** | Pair 5 | FS-72 | Queue job name + replay registry entry | Follow #91 → `evaluate-loyalty-reminder-candidates` docs |
| 11 | **Noah** | BE 1 | FS-11 | Preset types + Zod export surface | `cursor/fs-11-import-vendor-presets-1f27` |
| 12 | **Aria** | BE 2 | FS-11 | Import rollback demo script for sales | After presets merge |
| 13 | **Kai** | BE 3 | FS-11 | Golden CSV fixtures per vendor | After presets merge |
| 14 | **Mila** | Infra 1 | FS-11 | CI: preset unit tests in `batch-ci` path | `import-vendor-presets.test.ts` |
| 15 | **Ezra** | Infra 2 | FS-58 | Runbook cross-link FS-8 matrix | [#90](https://github.com/SimonShaun2/Renvani/pull/90) |
| 16 | **Iris** | Infra 3 | FS-11 | Fix 3× import `/errors` contract tests | `cursor/fs-11-import-errors-fix-1f27` (next) |
| — | **Elena** | PO | All | Cut-line + demo script sign-off | `MVP-SHORTEST-PATH-WINTER-2026.md` |

---

## Open PR tracker

| PR | Head (sign @) | Isaac | Lily | Sam |
| --- | --- | --- | --- | --- |
| [#86](https://github.com/SimonShaun2/Renvani/pull/86) | `6ca557f` | PASS | **pending @ head** | ACCEPT |
| [#88](https://github.com/SimonShaun2/Renvani/pull/88) | `b620036` | ☐ | ☐ | ☐ |
| [#89](https://github.com/SimonShaun2/Renvani/pull/89) | `26b6827` | ☐ | ☐ | ☐ |
| [#90](https://github.com/SimonShaun2/Renvani/pull/90) | `bbad2fc` | ☐ | ☐ | ☐ |
| [#91](https://github.com/SimonShaun2/Renvani/pull/91) | `7129b07` | ☐ | ☐ | ☐ |

**Merged (winter train):** #87, #84, #85, #83.

---

## PR workflow (mandatory)

1. Branch from latest `dev`; push → **request Isaac, Lily, Sam @ full SHA within 1h**.
2. Triple PASS → `batch-ci` → merge with head SHA guard.
3. Report E.. CoS at batch merge with **MVP date table** (`MVP-SHORTEST-PATH-WINTER-2026.md` §5).
