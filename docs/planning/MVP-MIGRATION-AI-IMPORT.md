# MVP migration — AI-guided import (pointer)

**Superseded by epic spec:** [`MVP-MIGRATION-EPIC-FS-MIGRATE.md`](./MVP-MIGRATION-EPIC-FS-MIGRATE.md) (founder **7:21–7:24 PM CT** — generic importer, presets, **media**, **price book**, **notes**, **multi-year history**, chunked ingest, lineage, platform P0).

**Also:** [`MVP-PLATFORM-P0-INFRA.md`](./MVP-PLATFORM-P0-INFRA.md) · assignments § file/platform grid in [`MVP-P0-ASSIGNMENTS.md`](./MVP-P0-ASSIGNMENTS.md).

**Still true:**

- File export first; QuickBooks OAuth = founder gate.  
- Workflow: upload bundle → AI map (presets seed) → **chunked commit** (idempotent) + **file batch** → AI/heuristic link → preview → commit → **reminder/reactivation eval** → audit → rollback.  
- Preserve vendor IDs as `source_system` + `source_id` and original business dates for reporting and campaigns.
- Tenant scope + `importSessionId` traceability per `fsm.data-import.v1`.

**PR [#92](https://github.com/SimonShaun2/Renvani/pull/92):** first **preset catalog** slice for the generic engine — not a Jobber-only importer.
