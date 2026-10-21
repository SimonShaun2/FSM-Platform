# agent-control-plane@1.0.0 — Consumer registry (C1–C8)

**FS-37** · **PROPOSED** · Pair 1

| ID | Consumer | Needs from contract |
| --- | --- | --- |
| C1 | FS-10 Canonical context | `TenantContextV1`, `CanonicalEntityRefV1`, `buildRecordVersionV1`, graph loaders |
| C2 | FS-12 Agent action SM | `AgentActionProposalV1`, states, tool params, idempotency helpers |
| C3 | FS-8 / Security | FS37-NT-01…12, `AGENT_CONTROL_PLANE_ERROR_CODES`, HTTP mapping |
| C4 | FS-14 Approval inbox | `awaiting_approval` queries on proposals |
| C5 | FS-17–20 Revenue agents | Create proposals; no direct provider sends |
| C6 | `packages/ai` + worker | Validated proposal output only |
| C7 | `activity_events` | Terminal transitions via `emitEvent` (agent.* types — Dev A migration) |
| C8 | Owner / revenue UI (later) | Timeline + approvals |

**Merge order (implementation):** FS-3 Ready → FS-37 types PR (#21) → FS-10 → FS-12 → FS-8 NT execution on FS-12 head.
