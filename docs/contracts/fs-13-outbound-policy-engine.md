# FS-13 — Outbound policy, consent, and authorization engine (standalone)

**Policy version:** `outbound-authorization-v1`

## Scope

Pure evaluation in `@fsm/types` (`evaluateOutboundAuthorization`) plus API wiring for agent action execute (`message.send_proposed`) and retention queued outreach (via retention gates eval).

## Decision record

Every evaluation returns:

- `allowed`
- `policyVersion`
- `reason` (human-readable)
- Optional `failureCode` / `errorCode` when blocked

Agent execute stores `authorizationDecision.policyVersion` + `reason` on the execution receipt when outbound authorization runs.

Retention touchpoint decisions include `policyVersion` + `reason` on allow and block paths.

## Negative scenarios (automated)

| Scenario | Failure code | HTTP `ErrorCode` |
| --- | --- | --- |
| Cross-tenant resource | `CROSS_TENANT_ACCESS` | `NOT_FOUND` |
| Forged asserted company | `FORGED_IDENTITY` | `FORBIDDEN` |
| Stale consent version | `STALE_CONSENT` | `CONSENT_REQUIRED` |
| Revoked consent | `CONSENT_REVOKED` | `CONSENT_REQUIRED` |
| Missing channel/scope consent | `CONSENT_REQUIRED` | `CONSENT_REQUIRED` |
| Unapproved send | `UNAUTHORIZED_SEND` | `POLICY_DENIED` |

No live Twilio/SendGrid/Stripe calls in this slice.
