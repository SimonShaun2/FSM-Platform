# MVP migration — AI-guided import (Elena + founder 7:19 PM CT)

**P0 vendors (file export first):** Jobber, Housecall Pro, ServiceTitan, **QuickBooks Online** (customers, items/services, invoices + payment history).  
**Not in v1 without founder budget:** QuickBooks OAuth app, Intuit partner program, paid third-party ETL. **QB API connect** is a **founder-gated** follow-on after file-export path ships.

---

## 1. Operator story (on-brand)

1. **Choose source** — Jobber / HCP / ServiceTitan / QuickBooks (export instructions in UI).  
2. **Upload** — CSV/XLSX per entity (customers first; then items; then invoices/payments).  
3. **AI maps** — Worker + OpenAI suggest columns; **vendor presets** seed maps before AI (deterministic).  
4. **Review preview** — Row errors, duplicate flags, formula-injection sanitization (`fsm.data-import.v1`).  
5. **Commit** — Tenant-scoped ingest; every row tagged `importSessionId`.  
6. **Audit** — `activity_events`: `import.started` / `import.completed` / `import.rolled_back`.  
7. **Undo** — Operator rollback (soft-delete session-tagged rows; restore `update_existing` snapshots).

**Connect later (gated):** QuickBooks OAuth — requires founder OK to create Intuit developer account; no agent provisioning until approved.

---

## 2. QuickBooks scope (MVP P0)

| Export (file) | Renvani entity | MVP phase | Notes |
| --- | --- | --- | --- |
| Customer list | `customers` (+ properties) | **P0a** | Preset headers in `#92` |
| Products & services | `products` (catalog) | **P0b** | New import entity path + worker |
| Invoices | `invoices` (historical, read-mostly) | **P0c** | No live Stripe; metadata + balances for reporting |
| Payment history | Invoice payments / `activity_events` | **P0c** | Tie to imported invoices; no payment capture |

Phases **P0b/P0c** may land immediately after **P0a** presets merge; same wizard, separate upload sessions per entity type.

---

## 3. Engineering map (existing vs build)

| Capability | Status |
| --- | --- |
| `import_sessions` lifecycle + rollback | **Shipped** |
| AI column mapping worker | **Shipped** |
| Vendor header presets | **#92** (FSM + QB customers) |
| Entity types `invoices` in schema enum | **Schema exists**; processor **build** |
| UI vendor picker + QB copy | **Build** (`Step1Upload` already mentions QB) |
| QB OAuth | **Blocked** — founder gate |

---

## 4. Founder policy hooks

- No new paid services / partner enrollments without CoS + founder (§0 BATCH-PLAN).  
- QuickBooks **API** = budget flag; **CSV export** = MVP P0 now.  
- All imports: `companyId` from JWT only; cross-tenant = `NOT_FOUND`.

---

## 5. Acceptance (Elena)

- [ ] Demo: one tenant imports **QB customer export** end-to-end with preview + rollback.  
- [ ] Second demo slice: **items** + **invoice** CSVs with row-level errors surfaced (partial OK).  
- [ ] Sales talk track: “switch in an afternoon” using exports, not API promises.
