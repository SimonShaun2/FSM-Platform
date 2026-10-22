# FS-92 — Synthetic-tenant negative test matrix

**Ticket:** [Prove unauthenticated and cross-tenant database isolation](https://app.notion.com/p/401317b92d15814cb19fdd928d82198a)  
**Implementer:** Backend Dev 3 (Pair 3)  
**Branch:** `cursor/fs-92-tenant-isolation-proof`  
**Automated suite:** `apps/api/src/routes/security/fs-92-tenant-isolation.test.ts`  
**Fixtures:** `apps/api/src/test-support/synthetic-tenant-fixtures.ts`

## Proof boundary (not claimed by this ticket)

| Guarantee | Owner ticket | FS-92 API tests |
| --- | --- | --- |
| Database not publicly reachable; only private workloads connect with least-privilege credentials | **FS-80** (operations) + **FS-93** (platform/network ADR) | **Not proven** — documented deferral |
| Row-level security / DB roles vs application checks | **FS-80** / **FS-93** | **Not proven** |
| Worker, outbound webhook, and direct SQL adversarial paths | **FS-80**, worker security follow-ups | **Not proven** |
| Unauthenticated and cross-company **HTTP API** access with synthetic tenants | **FS-92** (this branch) | **Covered** (see below) |

API-level negatives validate the application boundary only. They do **not** substitute for infrastructure evidence required by FS-80 and FS-93.

## Synthetic tenants

Two organizations are created per test via `seedSyntheticTenantPair`:

- **Org A** / **Org B** — unique slugs `fs-92-synthetic-{a|b}-*`, owner JWTs, no production or pilot data.
- `seedTenantIsolationBundle` seeds representative records (customer, job, estimate, invoice, technician, product, AI recommendation, campaign, maintenance plan, import session, attachment, automation rule, booking request, payment, agent action).

## Matrix — unauthenticated access (expect `401 UNAUTHORIZED`)

| ID | Method | Route | Automated |
| --- | --- | --- | --- |
| FS92-UNAUTH-01 | GET | `/api/v1/customers` | Yes |
| FS92-UNAUTH-02 | GET | `/api/v1/jobs` | Yes |
| FS92-UNAUTH-03 | GET | `/api/v1/estimates` | Yes |
| FS92-UNAUTH-04 | GET | `/api/v1/invoices` | Yes |
| FS92-UNAUTH-05 | GET | `/api/v1/technicians` | Yes |
| FS92-UNAUTH-06 | GET | `/api/v1/products` | Yes |
| FS92-UNAUTH-07 | GET | `/api/v1/dispatch?date=…` (query required before auth) | Yes |
| FS92-UNAUTH-08 | GET | `/api/v1/reporting/job-sources` | Yes |
| FS92-UNAUTH-09 | GET | `/api/v1/company` | Yes |
| FS92-UNAUTH-10 | GET | `/api/v1/ai/recommendations` | Yes |
| FS92-UNAUTH-11 | GET | `/api/v1/campaigns` | Yes |
| FS92-UNAUTH-12 | GET | `/api/v1/service-agreements` | Yes |
| FS92-UNAUTH-13 | GET | `/api/v1/imports` | Yes |
| FS92-UNAUTH-14 | GET | `/api/v1/attachments?entityType=job&entityId=…` | Yes |
| FS92-UNAUTH-15 | GET | `/api/v1/automation-rules` | Yes |
| FS92-UNAUTH-16 | GET | `/api/v1/tenant-context` | Yes |
| FS92-UNAUTH-17 | GET | `/api/v1/agent-actions` | Yes |
| FS92-UNAUTH-18 | GET | `/api/v1/payments` | Yes |
| FS92-UNAUTH-19 | GET | `/api/v1/activity-events?customerId=…` | Yes |
| FS92-UNAUTH-20 | GET | `/api/v1/message-logs?customerId=…` | Yes |
| FS92-UNAUTH-21 | GET | `/api/v1/message-logs/conversations` | Yes |
| FS92-UNAUTH-22 | GET | `/api/v1/booking-requests` | Yes |
| FS92-UNAUTH-23 | GET | `/api/v1/booking-settings` | Yes |
| FS92-UNAUTH-24 | GET | `/api/v1/review-requests` | Yes |
| FS92-UNAUTH-25 | GET | `/api/v1/stripe/connect/status` | Yes |
| FS92-UNAUTH-26 | GET | `/api/v1/dispatch/workload?date=…` | Yes |
| FS92-UNAUTH-27 | GET | `/api/v1/jobs/unscheduled` | Yes |
| FS92-UNAUTH-28 | GET | `/api/v1/estimates/approved-unconverted` | Yes |
| FS92-UNAUTH-29 | GET | `/api/v1/service-agreements/templates` | Yes |
| FS92-UNAUTH-30 | GET | `/api/v1/ai/revenue-summary` | Yes |
| FS92-UNAUTH-31 | POST | `/api/v1/tenant-context/resolve` | Yes |
| FS92-UNAUTH-32 | PATCH | `/api/v1/time/:entryId` | Yes |
| FS92-UNAUTH-WRITE-01 | POST | `/api/v1/jobs` | Yes |
| FS92-INVALID-01 | GET | `/api/v1/customers` (malformed bearer) | Yes |

### Unauthenticated exclusions (documented)

| Prefix / route | Reason |
| --- | --- |
| `/api/v1/public/*` | Intentional public product surface (booking holds, pay links, etc.) |
| `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh` | Auth entrypoints |
| `POST /api/v1/ai/label-photo`, `POST /api/v1/stripe/connect/*` (except documented GET probes) | Validated POST-only; add FS-8 slice if product requires unauthenticated deny proofs |
| `GET/POST /api/v1/jobs/:id/*` (engagement sub-routes) | Requires job id + auth; covered indirectly via job id cross-tenant reads |
| `GET /api/v1/technicians/:id/time` | Extension route; technician id cross-tenant read covered |

## Matrix — cross-tenant (Org B token, Org A resource IDs)

| ID | Scenario | Expected | Automated |
| --- | --- | --- | --- |
| FS92-XT-READ-01 | GET customer by id | 404 `NOT_FOUND` | Yes |
| FS92-XT-READ-02 | GET job by id | 404 | Yes |
| FS92-XT-READ-03 | GET estimate by id | 404 | Yes |
| FS92-XT-READ-04 | GET invoice by id | 404 | Yes |
| FS92-XT-READ-05 | GET technician by id | 404 | Yes |
| FS92-XT-READ-06 | GET product by id | 404 | Yes |
| FS92-XT-READ-07 | GET AI recommendation by id | 404 | Yes |
| FS92-XT-READ-08 | GET campaign by id | 404 | Yes |
| FS92-XT-READ-09 | GET service agreement (plan) by id | 404 | Yes |
| FS92-XT-READ-10 | GET import session errors | 404 | Yes |
| FS92-XT-READ-11 | GET attachments for Org A job id | 200, empty list (no filenames leaked) | Yes |
| FS92-XT-READ-12 | GET tenant-context inquiry anchor | 404 | Yes |
| FS92-XT-READ-14 | GET `/invoices/:id/payments` (Org A invoice) | 404 | Yes |
| FS92-XT-READ-15 | GET `/payments` list (Org A payment id absent) | 200, no Org A payment/invoice ids | Yes |
| FS92-XT-READ-13 | PATCH automation rule | 404 | Yes |
| FS92-XT-AGENT-01 | GET `/agent-actions/:id` | 404 | Yes |
| FS92-XT-AGENT-02 | POST `/agent-actions/:id/approve` | 404 | Yes |
| FS92-XT-AGENT-03 | POST `/agent-actions/:id/reject` | 404 | Yes |
| FS92-XT-AGENT-04 | POST `/agent-actions/:id/execute` | 404 | Yes |

**Note:** There is no `GET /api/v1/payments/:id` route; payment isolation is asserted via invoice payments sub-resource and company-scoped payment list.

## Matrix — collection list leakage (Org B token; must not contain Org A record ids)

| ID | List route | Automated |
| --- | --- | --- |
| FS92-XT-LIST-01 | `/api/v1/customers` | Yes |
| FS92-XT-LIST-02 | `/api/v1/jobs` | Yes |
| FS92-XT-LIST-03 | `/api/v1/estimates` | Yes |
| FS92-XT-LIST-04 | `/api/v1/invoices` | Yes |
| FS92-XT-LIST-05 | `/api/v1/technicians` | Yes |
| FS92-XT-LIST-06 | `/api/v1/products` | Yes |
| FS92-XT-LIST-07 | `/api/v1/campaigns` | Yes |
| FS92-XT-LIST-08 | `/api/v1/imports` | Yes |
| FS92-XT-LIST-09 | `/api/v1/payments` | Yes |
| FS92-XT-LIST-10 | `/api/v1/agent-actions` | Yes |
| FS92-XT-LIST-11 | `/api/v1/ai/recommendations` | Yes |
| FS92-XT-LIST-12 | `/api/v1/service-agreements` | Yes |
| FS92-XT-LIST-13 | `/api/v1/automation-rules` | Yes |
| FS92-XT-LIST-14 | `/api/v1/booking-requests` | Yes |
| FS92-XT-WRITE-01 | PATCH customer | 404 | Yes |
| FS92-XT-WRITE-02 | PATCH job | 404 | Yes |
| FS92-XT-WRITE-03 | POST job with Org A `customerId` | 404 | Yes |
| FS92-XT-WRITE-04 | POST import rollback | 404 | Yes |
| FS92-XT-WRITE-05 | DELETE attachment | 404 | Yes |
| FS92-XT-WRITE-06 | POST revenue inquiry response-draft | 404 | Yes |
| FS92-SPOOF-01 | GET customer with spoofed `companyId` in body | 404 | Yes |
| FS92-SAME-01 | Org B reads own customer while Org A data exists | 200 | Yes |

## Gaps (follow-up, not blocking API slice)

| Area | Gap | Suggested owner |
| --- | --- | --- |
| Agent control plane | FS37-NT-01..12 (see `docs/security/FS-8-negative-test-matrix.md`) | FS-12 / Security |
| Activity events / message logs / review-requests lists | No FS-92 list-leak row yet | QA-2 follow-up |
| Dispatch board content | Cross-tenant job cards in `/dispatch` SSE/polling not matrix-tested | Pair 3 follow-up |
| Stripe Connect / payment session | Cross-tenant checkout not in FS-92 matrix | Money lane + Security |
| Message logs, time entries, review requests, job engagement sub-routes | Partial coverage via domain tests; not duplicated in FS-92 suite | QA-2 regression selection |
| Worker processors | No HTTP surface | FS-80 + worker negatives |
| Webhook ingress (Twilio/Stripe) | Signature + tenant resolution | FS-8 / integration QA |
| Export / bulk download paths | No dedicated export API in v1 slice | Future ticket |
| Timing side channels | Not tested | Security adversarial |
| Direct DB connection attempt | Requires FS-80/FS-93 infra evidence | Platform |

## Related existing coverage

FS-8 B-CP rows remain valid; FS-92 centralizes API regression IDs and extends route coverage. Overlap is intentional for CI batch selection.

## Local verification (allowed)

```bash
cd apps/api && pnpm test src/routes/security/fs-92-tenant-isolation.test.ts
```

Approved **batch CI** at exact head is required for merge per `TEAM.md` / `GITHUB_WORKFLOW.md`; local green is not CI.
