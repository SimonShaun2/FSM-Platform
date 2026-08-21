# Architecture Decision Records

**Owner:** TL-01
**Authority:** Master Directive sections 39 and 52
**Bootstrapped by:** FSM-0014

An ADR records a decision that constrains future work, together with the reasoning behind it.
The purpose is to prevent two failure modes: violating a constraint without knowing it existed,
and re-arguing a settled question in a later sprint.

## When An ADR Is Required

- Any change to the technology baseline in `AGENTS.md` section 6
- Any change to system boundaries or module structure
- Any change to the tenant isolation model
- Any change to payment architecture or money flow
- Any change to the authentication or authorization model
- Any decision that will be expensive to reverse

Ordinary implementation choices inside an existing boundary do not need an ADR.

## Lifecycle

`Proposed` -> `Accepted` -> `Superseded` / `Deprecated`

ADRs are never deleted or edited after acceptance. A reversed decision is recorded in a new
ADR, and the prior record is marked `Superseded` with a forward reference.

## Authoring And Approval

TL-01 authors or approves every ADR. Claude reviews any ADR with product consequences. QA-02
reviews any ADR affecting tenant isolation, authentication, or payments. An ADR may not be
marked `Accepted` without a recorded decision and its consequences.

## Numbering

Sequential, zero-padded: `ADR-0001`, `ADR-0002`. Never reused.

Use [ADR-TEMPLATE.md](ADR-TEMPLATE.md) for new records.

---

## Index

| ID | Title | Status | Owner | Blocks |
|---|---|---|---|---|
| [ADR-0001](ADR-0001-restart-on-existing-repository.md) | Restart on existing repository | Accepted | TL-01 | - |
| [ADR-0002](ADR-0002-tenant-model.md) | Tenant model | **Proposed** | TL-01 | Sprint 2 |
| [ADR-0003](ADR-0003-stripe-connect-charge-model.md) | Stripe Connect charge model | **Proposed** | BE-02 / TL-01 | Sprint 8 |
| [ADR-0004](ADR-0004-modular-architecture.md) | Modular architecture over microservices | Accepted | TL-01 | - |

ADR-0002 is resolved by FSM-0011. ADR-0003 requires founder and possibly legal input and is
tracked in `PROJECT_STATE.md` section 6.
