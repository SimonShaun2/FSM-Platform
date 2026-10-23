# MVP P0 Epic — FS-MIGRATE: Universal AI import & onboarding

**Epic ID:** `FS-MIGRATE` (extends FS-11)  
**Authority:** Founder refinement **2026-10-22 7:21 PM CT** · **PO:** Elena · **Tech Lead:** Grace  
**Principle:** **One generic importer** — not per-vendor importer apps. Vendors ship as **source presets** (saved mapping templates + known export quirks).

---

## 1. What we build (single engine)

| Layer | Responsibility | Reuse on `dev` |
| --- | --- | --- |
| **Ingest** | CSV + **XLSX** upload, multi-file sessions, resumable wizard state | `import_sessions`, R2, wizard UI shell |
| **AI column match** | OpenAI maps columns → canonical fields; presets **seed** AI, never fork logic | `mapCsvColumns` worker job |
| **Relational stitch** | Link files: customers ↔ locations ↔ jobs ↔ invoices ↔ equipment | **Build** — `import_bundle` metadata on session |
| **Normalize** | Dates, phones, money (Decimal), enums | **Build** — `@fsm/types` + shared `import-normalize` |
| **Dedupe / merge** | Company-scoped keys; operator preview of collisions | Partial (`update_existing`); **extend** |
| **Domain commit** | Customers, properties, assets, jobs, invoices (balances), maintenance plans + visit schedules | Schema supports; processors **extend** |
| **Preview** | Row + relationship errors; plain-language AI summaries | `preview` status + `/errors` |
| **Reversible commit** | `importSessionId` tagging + rollback transaction | **Shipped** |
| **Audit** | `activity_events` + session log | **Shipped** pattern |

**Non-goals (founder gate):** QuickBooks OAuth / Intuit dev app, live API sync (ADR-FS-41), paid partner programs.

---

## 2. Source presets (not separate importers)

Presets are **data + quirks**, consumed by the generic engine:

| Source | Export formats | Preset contents |
| --- | --- | --- |
| **Service Fusion** | CSV/XLSX multi-export | Header aliases, file order, ID columns for joins |
| **Jobber** | CSV | Customer/job/invoice export quirks |
| **ServiceTitan** | CSV | Location vs customer split, job tags |
| **Housecall Pro** | CSV | Customer vs job exports |
| **QuickBooks Online** | CSV/XLSX | Customers, items, invoices, payments |
| **QuickBooks Desktop** | CSV (IIF/standard exports) | Column variants, desktop naming |

Implementation home: `packages/config/src/import-source-presets/` (rename from `import-vendor-presets` in [#92](https://github.com/SimonShaun2/Renvani/pull/92) follow-up).  
Adding a vendor = **new preset JSON/TS module**, not a new worker.

---

## 3. Relational multi-file model (MVP)

```text
import_bundle (per onboarding)
  ├── file: customers.csv      → entity customers
  ├── file: locations.csv      → properties (join: customer_external_id)
  ├── file: jobs.csv           → jobs
  ├── file: invoices.csv       → invoices + open balances
  ├── file: equipment.csv      → assets + service history pointers
  └── file: agreements.csv     → maintenance_plans + recurring schedule seeds
```

Worker phases: **map each file** → **validate joins** → **preview graph** → **commit in dependency order** (customers → properties → assets → jobs → invoices → plans).

---

## 4. Onboarding UX (seamless, resumable)

| Step | UX | AI role |
| --- | --- | --- |
| 1. Choose source | Service Fusion / Jobber / ST / HCP / QB Online / QB Desktop | Explain which exports to download |
| 2. Upload bundle | Multi-file drop; progress per file | Flag missing recommended files |
| 3. Review mappings | Per-file column review | Plain-language: “We mapped Phone → mobile” |
| 4. Preview issues | Errors + dedupe collisions | Summarize blockers vs warnings |
| 5. Commit | Progress bar; partial success OK | Post-commit summary |
| 6. Done / rollback | One-click undo | Explain what rollback removes |

**Resumable:** persist wizard step + `import_bundle` id in session (httpOnly / DB) — operator can leave and return.

---

## 5. Moat hooks (founder)

- **Equipment / asset history** → feeds asset-age campaigns & FS-72 reminders  
- **Open balances** → honest AR picture in Command Center  
- **Maintenance agreements + recurring schedules** → Repeat lifecycle demo

---

## 6. Acceptance (Elena sign-off)

- [ ] One tenant: **Service Fusion OR Jobber** bundle imported end-to-end with preview, commit, rollback.  
- [ ] Second source: **QuickBooks Online** (customers + invoices + open balance) via same wizard.  
- [ ] Dedupe preview shows merge decision before commit.  
- [ ] Audit: `import.started` / `import.completed` / `import.rolled_back` on bundle.  
- [ ] No cross-tenant leakage (FS-92 matrix).

---

## 7. Engineering phases (parallel)

| Phase | Target | Scope |
| --- | --- | --- |
| **M1** | Week 1 | Preset catalog + XLSX parse; generic map job uses presets only |
| **M2** | Week 2 | `import_bundle` + 2-file join (customer + location) preview |
| **M3** | Week 3 | Jobs + invoices + open balances commit |
| **M4** | Week 4 | Equipment + maintenance agreements; AI plain-language preview |
| **M5** | Week 5 | QB Desktop quirks + resumable wizard polish |

*Calendar weeks are planning buckets; ship slices as PRs merge.*

---

## 8. Contract alignment

- `fsm.data-import.v1` remains SoR contract; FS-MIGRATE adds **bundle** and **entity** extensions via ADR addendum (Elena + Isaac).  
- Types: extend `ImportEntityType` in `@fsm/types` as processors land — no per-vendor types.
