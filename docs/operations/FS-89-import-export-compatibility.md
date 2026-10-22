# FS-89 — FS-11 import/export compatibility gaps

Evidence for FS-89 acceptance criterion #6. **No live credentials or rotations.**

| Area | FS-11 import (`fsm.data-import.v1`) | FS-89 export (`fsm.data-export.v1`) | Gap / mitigation |
|------|--------------------------------------|-------------------------------------|------------------|
| Entity coverage | `customers`, `jobs` CSV only | customers, properties, assets, jobs, estimates, invoices, payments, catalog, users, activity refs | Export is superset; import cannot round-trip full export without additional entity CSV contracts (v2). |
| File shape | CSV rows per entity type | JSON bundle with relational UUIDs | Operators re-import via FS-11 customer CSV; job CSV mapping documented separately. |
| Stripe fields | Not imported | Excluded from export manifest | By design — money state remains in Stripe. |
| `importSessionId` | Set on ingested rows | Exported when present on records | Supports traceability; rollback semantics import-only. |
| Activity payloads | N/A | `activity_events.payload` excluded | Audit references export `id`, `eventType`, `entityType`, `entityId`, `summary`, `occurredAt`. |
| Maintenance plans | Not in FS-11 v1 | Not in export v1 manifest | Future manifest version required. |
| Attachments / R2 files | Not imported | URLs may appear on entities; binary blobs not bulk-exported | Documented exclusion; separate attachment APIs. |

Automated evidence: `packages/types/src/data-export/v1/manifest.test.ts` (stable manifest), `apps/api/src/routes/data-exports/data-exports.test.ts` (tenant isolation + audit).
