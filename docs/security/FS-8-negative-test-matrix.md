# FS-8 negative test matrix — mapping @ `12b23226`

**Status:** Mapped to existing tests where applicable; **FS37-NT-01..12 not executed** on agent-control-plane head (no FS-12 implementation). Security PASS withheld.

**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Last updated:** 2026-10-21 (CoS + repo grep; Security owns execution sign-off)

## Legend

| State | Meaning |
| --- | --- |
| **Covered** | Automated test exists on `main` @ base SHA (run in approved batch CI only) |
| **Gap** | No test or control-plane code not present |
| **FS-36** | Requires head `a170c4c` (local/unpushed) + Security D3 review |

## B-CP / tenant isolation (existing API)

| ID | Scenario | Mapping | State |
| --- | --- | --- | --- |
| B-CP-01 | Cross-tenant customer read | `apps/api/src/routes/customers/customers.routes.test.ts` | Covered |
| B-CP-02 | Cross-tenant job access | `apps/api/src/services/job.service.test.ts` | Covered |
| B-CP-03 | Cross-tenant estimate | `apps/api/src/services/estimate.service.test.ts` | Covered |
| B-CP-04 | Cross-tenant invoice | `apps/api/src/services/invoice.service.test.ts` | Covered |
| B-CP-05 | Cross-tenant AI recommendation | `apps/api/src/routes/ai/ai.test.ts` | Covered |
| B-CP-06 | Cross-tenant technician/product/agreement | `technician.service.test.ts`, `product-catalog.service.test.ts`, `service-agreement.service.test.ts` | Covered |
| B-CP-07 | Customer graph cross-tenant | `customer-graph.service.test.ts` | Covered |

## FS37-NT agent control plane (spec — execution pending)

| ID | Scenario | Expected | State |
| --- | --- | --- | --- |
| NT-01 | Execute without tenant context | 401/403 | Gap (no agent CP) |
| NT-02 | Cross-tenant entity ref | `NOT_FOUND` | Gap |
| NT-03 | Tool policy deny | `POLICY_DENIED` | Gap (U5 spec in ADR-FS-3; Security ACK pending) |
| NT-04 | Idempotency key replay mismatch | `CONFLICT` | Gap |
| NT-05 | Stale idempotency payload | `CONFLICT` | Gap |
| NT-06 | Stale `recordVersion` (`rv1:…`) | `CONFLICT` | Gap (U4 ADR proposed; PO + Security ACK pending) |
| NT-07 | Policy evaluation deny | `POLICY_DENIED` | Gap (U5 spec; Security ACK pending) |
| NT-08 | Missing consent | `CONSENT_REQUIRED` | Gap (U5 spec; Security ACK pending) |
| NT-09 | Public token probe leak | Generic not-found | Partial — public estimate API; **FS-36** legacy path @ `a170c4c` |
| NT-10 | Outbound SMS without consent guard | No enqueue | Gap (FS-12) |
| NT-11 | Spoofable attribution `src` | Reject/log | Gap (FS-38 contract) |
| NT-12 | Twilio tenant resolution | Company-scoped | Gap (review in threat model) |

## FS-36 middleware (D3) — Security checklist @ `a170c4c`

Requires fetchable branch; see FS-36 card SEC-1–6. CoS cannot execute without Dev E push.

## Next actions (Security)

1. Run **Covered** rows in next **approved batch CI**; attach log + SHA to FS-8 Evidence.  
2. Implement + execute NT rows after FS-37 types PR and FS-12 land (or document explicit deferral per founder).  
3. **ACK** ADR-FS-3 U5 table; then Dev B adds enum members in FS-37 types PR; execute NT-03/07/08 on FS-12 head.

## U5 — ErrorCode closure (Batch 1 spec @ ADR-FS-3)

`packages/types/src/errors.ts` on `main` has seven members. Contract adds:

- `POLICY_DENIED` → HTTP 403 (NT-03, NT-07, NT-11)
- `CONSENT_REQUIRED` → HTTP 422 (NT-08; no Twilio/SendGrid in FS-12 minimal slice)

Security sign-off = ACK on this mapping + executed negatives on FS-12 head (not enum merge alone).
