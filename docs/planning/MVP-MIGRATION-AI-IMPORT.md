# MVP migration — AI-guided import (pointer)

**Superseded by epic spec:** [`MVP-MIGRATION-EPIC-FS-MIGRATE.md`](./MVP-MIGRATION-EPIC-FS-MIGRATE.md) (founder **7:21 PM CT** — one generic importer + source presets).

**Still true:**

- File export first; QuickBooks OAuth = founder gate.  
- Workflow: upload → AI map (presets seed) → preview → commit → audit → rollback.  
- Tenant scope + `importSessionId` traceability per `fsm.data-import.v1`.

**PR [#92](https://github.com/SimonShaun2/Renvani/pull/92):** first **preset catalog** slice for the generic engine — not a Jobber-only importer.
