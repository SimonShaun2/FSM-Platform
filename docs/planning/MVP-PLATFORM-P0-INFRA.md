# MVP P0 — Platform & agent infrastructure (founder 7:23–7:24 PM CT)

**PO:** Elena · **Tech Lead:** Grace  
**Principle:** **Internal agent/AI infrastructure must be as mature as customer-facing surfaces.** Migration, agents, and imports share the same runtime, queues, file pipeline, audit, and observability.

---

## P0 capabilities (not post-MVP)

| Area | MVP requirement | Primary owners |
| --- | --- | --- |
| **Agent workflow runtime** | Durable steps, idempotent handlers, versioned prompts in `@fsm/ai` | Noah + Ava |
| **Job queue / worker reliability** | BullMQ: retries, DLQ visibility, replay registry, **chunk child jobs**, no silent drops | Hana + Iris |
| **File processing** | R2 upload, virus-scan hook (stub OK), MIME sniff, size limits, tenant paths | Diego + Mila |
| **AI mapping / eval** | Column match + **file-to-record** match; logged token usage; eval fixtures for migration | Marcus + Kai |
| **Audit logs** | `activity_events` on every import/agent/file batch state change | Aria |
| **Observability** | Structured logs (`pino`), job start/fail/complete, `requestId` + `companyId` on API and workers | Ezra + Sofia |

---

## Shared queues (existing — harden for FS-MIGRATE)

| Queue | FS-MIGRATE use |
| --- | --- |
| `fsm:imports` | Tabular bundle + **import-chunk-commit** + **file batch** jobs |
| `fsm:ai` | Column mapping, file-to-entity matching, plain-language issue summaries |
| `fsm:notifications` | Operator alerts on import failure (optional v1) |

**Rules (repo law):** workers idempotent; failed jobs logged with full payload context; no long work in API handlers.

---

## Acceptance (Elena)

- [ ] Import **chunk** and file batch survive worker restart (resumable checkpoint).  
- [ ] Idempotent chunk re-run produces zero duplicate rows at same `source_system` + `source_id`.  
- [ ] Dashboard/log query can trace one migration bundle: session id → jobs → R2 keys.  
- [ ] Agent policy + import jobs share same audit event shape.  
- [ ] Sam sign-off on tenant isolation for file attach paths (extends FS-85).
