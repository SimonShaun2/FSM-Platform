# Renvani: build the structure in the right order

> **Status: proposed architecture and sequencing for review.** This document is a construction map, not a change to merge authority or an automatic start signal for deferred FSM modules. The [Field Service Build Board](https://app.notion.com/p/74b3a1145d3f49d586ac6cdbf174ceb2) remains the execution queue; [`TEAM.md`](../../TEAM.md) and [`GITHUB_WORKFLOW.md`](../../GITHUB_WORKFLOW.md) govern WIP, approved batch CI, exact-head review, `dev` merge, and founder promotion. Product Owner and Technical Lead should map each accepted wave to the existing FS tickets and resolve conflicting scope statements in governing docs through a separate reviewed change. This proposal changes no production behavior.

**Live-work crosswalk (snapshot, October 22, 2026):**

| Existing work | Place in this map | Integration note |
|---|---|---|
| [Batch 3 PR #57](https://github.com/SimonShaun2/Renvani/pull/57) | Footings and frame hardening | Pending gate/merge; not counted as shipped |
| [FS-41 PR #47](https://github.com/SimonShaun2/Renvani/pull/47) | Survey and contract boundaries | Review its ADR and package rules before changing governing documents |
| [FS-12/13 PRs #48/#51](https://github.com/SimonShaun2/Renvani/pull/48) | Agent control room | Reconcile overlapping branches and review exact combined head |
| [FS-17 PR #53](https://github.com/SimonShaun2/Renvani/pull/53), [FS-31 PR #49](https://github.com/SimonShaun2/Renvani/pull/49), [FS-53 PR #56](https://github.com/SimonShaun2/Renvani/pull/56) | Inquiry and owned acquisition | Validate one combined customer path and migration order |
| [FS-14 PR #55](https://github.com/SimonShaun2/Renvani/pull/55), [FS-23 PR #50](https://github.com/SimonShaun2/Renvani/pull/50) | Command Center and scheduling | Integrate approval and booking evidence after underlying contracts |
| [FSM-0010 issue #11](https://github.com/SimonShaun2/Renvani/issues/11), [FSM-0013 issue #14](https://github.com/SimonShaun2/Renvani/issues/14) | Historical foundation audit | Explicitly map or retire in FS board; their old tiered CI/roster assumptions do not override current batch policy |

**Review decisions:** Product Owner confirms multi-industry/full-FSM product scope and first two acceptance scenarios; Technical Lead signs domain boundaries and dependencies; Platform checks environment/release details; Security and QA check gates. E.. CoS schedules accepted work within WIP limits. Founder retains `main`, production and live-money approval.

Software construction blueprint from foundation to scale

Prepared for Shaun Simon | October 22, 2026 | Planning version 1.0

**Design intent:** a multi-industry field and home services growth platform. Residential cleaning is the first focused acquisition and validation market. Every included product uses one set of core business records, permissions, and events. Customers can activate appropriate capabilities under Flex or Flat without feature gates or seat tiers.

Think of the software as a building. Site survey and engineering plans come first. Foundations carry the load. The structural frame defines safe spaces. Utilities make the building usable. The agent control plane is the operating system that can act within approved boundaries. The five products are connected rooms. Monitoring, release controls, and customer migrations make it occupiable and maintainable.

| Construction image | Software layer | Non-negotiable result |
|---|---|---|
| Survey and drawings | Repository, contracts, ownership, baseline | Everyone builds against the same plan |
| Footings | Environments, CI/CD, secrets, recovery | A safe place to build and ship |
| Foundation slab | Tenant, identity, schema, migration | Correct company and customer records |
| Structural frame | Domain services and event model | Trustworthy service and financial workflow |
| Utilities and controls | Queues, integrations, agent permissions | Actions execute safely and visibly |
| Connected rooms | Growth, Revenue, Operations, Retention, Command Center | Owners get a coherent product |
| Occupancy and additions | Industry configuration, proof, support, scale | More businesses fit without rebuilding |

**Construction rule:** finish one usable vertical path from entry to measured outcome while strengthening each layer. A perfectly drawn foundation without a customer path is incomplete; a polished top floor over untested payments and tenant boundaries is unsafe.

Source baseline: SimonShaun2/Renvani `dev` at `7f1e6328e1a5ba54c7477b0cce0496502235f1e0`, inspected October 22, 2026. Repo documents and open draft PRs describe work in progress. No production deployment or customer workflow was independently verified.

# Survey: inventory the real structure

The current TypeScript/pnpm monorepo contains `apps/web` (Next.js), `apps/api` (Fastify), `apps/worker` (BullMQ), and `apps/webhook`. Shared packages cover configuration, types, database, jobs, and AI. PostgreSQL/Drizzle schema and SQL migrations exist. The root workflow runs an approved `batch-ci` label through build, lint, and test. This is substantial reuse, not a blank-slate build. [G1-G4]

| Existing element | Current evidence | Decision for the build |
|---|---|---|
| Core business records | Customers, properties, assets, jobs, products, estimates, invoices, payments, agreements | Keep and verify relationships and real workflows |
| Growth and agent work | Branded site, booking, campaigns, AI services, draft PRs for intake and operator approvals | Integrate only after availability/permission evidence |
| Database | Drizzle schema, `DATABASE_URL` client, 18 migrations | Make one authoritative schema and prove fresh migration/restore |
| Batch CI | Label-gated build, lint, test; latest batch run green | Retain the approved batch policy and enforce reviewed heads |
| Deployment | No workflow under `.github/workflows` for staging/production | Establish controlled staging and production promotion |
| Branch policy | GitHub reports `dev` unprotected; documents call it protected | Repair the real gate or accurately document the gap |

The root `fsm-schema.ts` still exists beside authoritative `packages/db/src/schema.ts`; repo documentation identifies it as a source-of-truth drift. Remove or demote duplicate references through normal review so agents and people cannot design against stale data. The current `AGENTS.md` and `TEAM.md` also describe full FSM as a later optional offering. That conflicts with the founder's current full-scope, multi-industry intent and all-inclusive pricing. Correct the governing documents through the existing approval process before future agents inherit the wrong scope. [G2-G3]

Create a capability inventory with three states per customer-visible workflow: **verified in a representative end-to-end environment**, **controlled pilot with known limitations**, or **planned**. A table, demo, passing unit test, or draft PR alone does not mean the workflow is available.

Exit criterion for the survey: one accepted architecture map, domain owners, real branch policy, environment inventory, prioritized capability gap list, and a first end-to-end acceptance script. Do not stall independent fixes while this inventory is completed.

# Footings: developer platform and release path

Use the established stack unless a decision record justifies a change: TypeScript, Next.js/React, Fastify, PostgreSQL/Drizzle, Redis/BullMQ, the existing messaging/payment/storage adapters, and modular domain services. Avoid new microservices or vendors simply to draw a more ambitious architecture. [G2]

Define four distinct places: local development, short-lived preview where useful, persistent staging, and production. Staging uses isolated test accounts, separate secrets, separate database/queue/storage, and non-live money. Production uses separately scoped credentials, backups, alerting, and restricted operators. Validate the entire env schema for each service; today's config requires values for many integrations, which can impede isolated component startup and staging if unused adapters are not separated. Change this carefully with compatibility tests.

| Release stage | Trigger and owner | Required evidence |
|---|---|---|
| Feature PR | Two-developer pair and traceable FS ticket | Local checks, contracts, independent review and risk-specific QA |
| Approved batch CI | Authorized label and exact PR head | Install, build, lint, test; add integration/security checks by risk |
| Merge to `dev` | E.. CoS after established gates | Exact-head approvals and green authorized batch |
| Staging | Automatic after an approved integration merge | Build provenance, migration, smoke tests, rollback path |
| `main` promotion | Founder | Staging acceptance, QA release review, change summary |
| Production deployment | Founder-authorized release action | Same artifact, controlled migration, health check, monitored rollout |

Protect `dev` to match the documented gate and confirm the protection on `main`; require the authorized check and review state to apply to the exact commit. Do not let a skipped workflow count as a pass. A changed head invalidates review evidence under existing team rules. [G3-G5]

Staging deployment should prove a fresh database migration, worker startup, webhook routing with test credentials, a real app session, a sample job, and invoice creation. Use backward-compatible schema changes, a migration lock or single deploy runner, pre-deploy backup, and a practiced recovery path. Rollback cannot assume a reverse migration will restore altered financial data.

Exit criterion: one button or approved workflow can reliably put a reviewed build in staging; founder promotion releases the tested artifact to production with observable health and a documented recovery step. Platform 1 owns environment/CI implementation; Platform 2 owns observability and recovery; Security reviews gate authority and secret boundaries.

# Slab: identity, tenancy, data, and trust

The database is the load-bearing slab. Preserve a single source of truth for companies, users and roles, customers, service locations, assets, work, agreements, estimates, invoices, payments, communication consent, and event history. A company owns its own records and permissions. Company boundaries must be enforced in service queries and writes, including bulk imports and background jobs. [G2]

| Subsystem | Structural requirement | Acceptance test |
|---|---|---|
| Identity and access | Roles, session lifecycle, least privilege, MFA-ready design | One role cannot read or perform another's sensitive action |
| Tenant isolation | Tenant context propagates across API, workers, files, and reports | Cross-tenant IDs never reveal or mutate data |
| Schema and migration | Versioned, additive changes with source reconciliation | Empty and existing DB migrate cleanly |
| Customer graph | Company -> customer -> sites -> assets -> service history | Real multi-site samples remain linked |
| Consent and communication | Source, channel, scope, unsubscribe state and audit | Suppressed contact never receives an unauthorized campaign |
| Financial state | Independent quote, invoice, payment, fee, tax, refund state | Retries and reconciliation never duplicate money |
| Data rights | Export, retention/deletion, support access history | Customer data can be extracted with usable relationships |

Money amounts should remain precise and payment state authoritative in deterministic services. Renvani's Flex 1% fee, Flat no shop fee, customer payment fees, subscriptions, invoice totals, tax and refunds need separate ledger concepts and audit records. The founder-supplied pricing model does not make payment processor behavior, customer fees, or live funds automatic. The repository says live payment changes require founder authority. [G2, P1]

Backups are only useful after a restore is demonstrated. Choose explicit recovery targets with the owner; run a restore into a separate environment, then compare record counts, attachments, and recent financial events. Protect customer data in traces and AI prompts, and use documented access for support impersonation.

Exit criterion: a tester can create two companies, execute jobs and payment simulations within each, prove no cross-company access, migrate and restore the data, and export a coherent customer history. Pair 1 (A/B) and Security own this foundation with Platform and QA 2.

# Frame: real service and revenue domains

Keep a modular monolith. Domain services own business rules; typed APIs expose actions; queues and events connect domains. The frontend collects intent and shows results. It does not invent pricing, availability, permissions, or financial transitions. Thin routes validate and call domain services. [G2]

| Domain beam | Core entities and transitions | First acceptance |
|---|---|---|
| Acquisition | Branded business, service page, inquiry source | A real prospect enters one business and source is recorded |
| CRM/site/asset | Customer, location, equipment and history | Dispatcher and worker see correct context |
| Sales | Inquiry, qualification, estimate, approval | Correct price/options; changes are traceable |
| Booking/operations | Hold, job, crew/resource, schedule, status | Confirmed work appears without a collision |
| Field execution | Arrival, tasks, evidence, sign-off, completion | Worker completes a real job on a phone |
| Money | Invoice, payment intent, settlement, refund | Owner sees correct financial state and exceptions |
| Repeat business | Agreement, next visit, eligible outreach, referral | A real follow-up is offered only at the right time |

Existing jobs have a single technician reference and dispatch has fixed skill tokens and ZIP proximity. Add configurable skills, multi-person/crew assignments, resource requirements, service windows, duration policies and travel intelligence in measured increments. Keep the current working path compatible while introducing stronger primitives. A hard-coded list of cleaning or HVAC job types cannot define the platform's market. [G6]

Represent work as a state machine with explicit reasons for reschedule, cancellation, callback, declined estimate, refund and revisit. Use idempotency keys for create, charge, webhook and outbound-message operations. A transaction that changes multiple records must either complete together or leave a recoverable pending state.

Design one canonical customer-to-cash slice: owned inquiry -> qualification -> estimate/booking -> schedule -> field execution -> invoice/payment -> repeat opportunity -> owner report. Run it through both a recurring cleaning scenario and an equipment repair scenario using the same shared records. One successful example per scenario is a gate to controlled pilot, not proof of every trade.

Exit criterion: a dispatcher, worker and owner complete the full slice in staging, including one exception and a retry, without database edits or developer intervention. Pairs 2/3/4 own specific domain slices; QA 1/4 verify behavior.

# Wiring: events, queues, adapters, and recovery

Every meaningful state change writes an auditable activity event, in the same transaction where possible. Use a durable outbox to deliver domain events to asynchronous workers. Workers can retry and must handle duplicate delivery without creating duplicate jobs, messages, invoices or charges. Keep a dead-letter path and human-visible recovery queue. [G2]

| Signal | Consumers | Failure handling |
|---|---|---|
| Inquiry received | Qualification, owner inbox, attribution | Retry intake; flag malformed or duplicate record |
| Booking confirmed | Dispatch, customer update, dashboard | Preserve one authoritative confirmation |
| Job completed | Invoice, review eligibility, retention | Keep completion even when outbound service fails |
| Invoice paid | Reporting, agreement, permitted review request | Reconcile webhook, deduplicate event |
| Service due | Retention proposal and scheduling | Approval or human escalation when rule uncertain |

Keep Stripe, Twilio, SendGrid, OpenAI and Cloudflare R2 calls behind adapters as existing policy requires. Each adapter documents credentials, request/response contract, timeout, retry, idempotency, rate limits, cost, error codes, observability, and a test double. Vendor outages should degrade the affected workflow visibly without corrupting authoritative state.

The webhook service verifies signatures, ties external events to internal IDs, records duplicates and out-of-order events, and yields a traceable resolution. For messaging, store consent, intended recipient, message content/approval, provider result, and opt-out. For AI, record input provenance and output without placing secret or unnecessary customer data in logs.

Integrations should follow proven customer needs. Accounting is a first-class acceptance issue for many Service Fusion switchers because Service Fusion advertises QuickBooks Online and Desktop. Renvani must demonstrate a buyer's actual accounting workflow or document its gap before a replacement promise. Do not make a bare connector logo the proof. [S1]

Exit criterion: stop one vendor in staging, recover from transient failures, replay a webhook, and verify that business records and customer communications remain correct. Pair 5 (I/J), Platform 2 and QA 2 own the negative scenarios.

# Control room: safe agent execution

Agents create value by completing authorized work. A recommendation alone is helpful; an unbounded action is unsafe. The structural control plane separates reasoning from decisions and records the path from proposed work to result. The repo already has AI helpers, action records, and draft work for action state, consent and the operator inbox, but the complete production loop was not verified. [G4-G7]

| Action state | Requirement |
|---|---|
| Detect | Identify eligible event, source records, confidence and potential value |
| Propose | Draft exact action with recipient, price, time, cost and rationale |
| Authorize | Verify tenant, role, consent, capacity, thresholds, and required human approval |
| Execute | Call deterministic domain service once with idempotency key |
| Observe | Log provider result, business outcome, and error or customer response |
| Recover | Retry safely or give an owner a clear task; record override/cancellation |

Specify per-action policy: read scope, allowed write operations, approval threshold, hours, spend cap, recipient rules, message templates, fallback owner, and kill switch. Use conservative defaults. Sending a customer message, confirming availability, changing an estimate, and moving money have different authority levels. AI cannot silently own financial state, payment state, job completion or permission decisions. [G2]

Start with small, measurable agent actions: draft a response to a qualified inquiry, propose a slot, follow up an approved estimate, suggest a permitted lapsed-service message, or summarize today's exceptions. Test bad input, ambiguous customer, off-hours service, duplicate request, unavailable crew, revoked consent, vendor timeout, and stale price.

Evaluate three dimensions independently: policy correctness, operational completion, and business outcome. A model producing plausible copy does not prove a job was booked. Human interventions and costs are part of the result. QA 3 owns adversarial/evaluation suites; Security owns high-risk authority boundaries; Command Center makes the action trail intelligible to the owner.

Exit criterion: the same proposed action can be approved, rejected, executed, failed, retried and audited without double action or hidden state. Shut off one agent without breaking core FSM operations.

# Rooms: five products on one structural frame

The owner sees five connected products, not a catalog of infrastructure. Each product has a small default path and reveals depth according to role and need. The full FSM capability remains included in both payment options; industry configuration and access permissions control behavior, not entitlements. [P1, G2]

| Product | First clear promise | Dependence on lower layers | Proof of value |
|---|---|---|---|
| Growth | More owned inquiries | Site, source tracking, consent, conversion entry | Qualified direct inquiries and completed jobs |
| Revenue | More inquiries become collected work | Intake, pricing, booking, estimates, payment | Conversion and collected contribution |
| Operations | Work gets done reliably | Customer graph, crews, dispatch, worker UX | Completion, utilization, fewer corrections |
| Retention | Useful repeat work happens on time | History, agreements, outreach policy | Repeat completed and collected revenue |
| Command Center | Owner sees what matters and controls agents | Event store, permissions, reporting, approvals | Resolved exceptions and owner time |

Make the first customer journey discover -> inquire -> estimate/book -> complete -> rebook/report. Residential cleaning tests repeat visits, crews and owned booking. A repair service tests asset history, skill fit, urgency and estimate approval. Commercial account work adds site hierarchy and contract obligations. These are different acceptance cases within the same platform.

Office and field experiences deserve equal product quality. Office users need fast search, dispatch, rescheduling and exception queues. Field workers need legible job context, clear state actions, photo/task capture, and deliberate behavior under unstable connectivity. Do not bury worker workflows inside an owner dashboard. [G2]

Accessibility and task time are design acceptance criteria. Test keyboard navigation and screen reader basics in the office, touch targets in the field, and real task completion with users unfamiliar with the build. An attractive dashboard cannot compensate for a confusing booking or payment process.

Exit criterion: a new owner can find their first priority, a dispatcher can handle a normal change, and a field worker can finish a real job without training from an engineer. Designers 1/2, pairs 2/3/4 and QA 1/4 own these flows.

# Expandable floor plan: industry rules and migration

Multi-industry means common primitives and configurable behavior, not one generic form with an industry dropdown. Build an industry configuration layer for service taxonomy, intake questions, scheduling rules, labor/crew/asset constraints, price units, completion evidence, recurring cadence and customer messages.

| Workflow family | Examples | Distinct rules to validate |
|---|---|---|
| Recurring route/crew | Cleaning, lawn, pools, pest | Frequency, route density, access, quality verification |
| Asset repair | HVAC, plumbing, electrical, appliances | Equipment history, urgency, qualifications, warranty |
| Installation/project | Roofing, painting, remodeling | Phases, crew/materials, approval changes, progress billing |
| Commercial/multisite | Facility, mechanical, commercial cleaning | Account/site hierarchy, service levels, approvals and billing |

The first cleaning market gives the team a disciplined route to product-market evidence. Do not encode cleaning defaults in core services. Accept customers from other industries when their actual workflow is verified and supported, and create reusable rules as patterns repeat. A new industry should need configuration, focused UX and tests, not a forked application.

Build migration as a product capability. An importer maps customers, multiple sites, assets, catalog, agreements, open jobs, balances, communication preferences and historical context, preserving source IDs and provenance. Give the operator a preview, error report, dedupe choices, reconciliation totals, representative-record review and cutover checklist. Protect against reactivating opted-out contacts. Service Fusion already offers data import help; reliable migration is a threshold for displacement. [S2]

Exit criterion for an industry: two independent real business workflows within that family can be completed end to end, including a failure case and migration of representative data. Mark advanced capabilities separately where unfinished. Pair 5 owns importer/adapters; Product Owner defines the acceptance cases with domain owners.

# Occupancy: telemetry, service levels, and customer evidence

Trust grows when the building is observable. Every critical request and background job needs correlation IDs, structured logs, health checks, latency metrics, error alerts and a person responsible for recovery. Report queue depth, webhook failures, message delivery, payment mismatches, migration exceptions, and agent failures. [G2]

Operational dashboards serve three audiences: Platform sees system reliability and cost; customer-facing teams see onboarding and account health; owners see direct demand, booked/completed/collected work, repeat revenue and exceptions. Differentiate booked value from completed and collected revenue. Show uncertain attribution and manual intervention.

Set explicit service level targets after observing the pilot workload. As proposed initial product checks: customer search and a normal job action should feel immediate on common devices; a high-priority job/payment error should alert the on-call owner during published coverage; a failed automation should create a visible retry or task. Convert these into measured latency and response budgets rather than presenting invented performance facts.

Test recovery drills: restore a backup, process a delayed webhook, recover an interrupted import, retry a message safely, and disable a misbehaving agent. Check user-facing status after recovery. Prepare incident templates, support escalation, and a release change log as the first businesses go live.

For each pilot, record time from required inputs to first live workflow, percentage of staff using the relevant flow, error/support volume, owner intervention minutes, real jobs completed, and the first value event. Comparisons need a prelaunch baseline and a consistent postlaunch period.

Exit criterion for paid scale: real accounts are activated, support is responsive, severe defects have owners, recurring delivery cost is measured, and the first retained customers can describe value in their own words. Platform 2 and QA 4 own the technical evidence; founder/Customer Success own customer evidence.

# Construction schedule: six dependent waves

This is an implementation sequence, not a claim that every module is missing. Adapt ticket numbers to the current FS board, reuse open PRs where sound, and avoid parallel edits to the same contract. Existing team rules allow one active ticket and at most two waiting PRs per pair. [G3]

| Wave | Objective and work | Acceptance before rising |
|---|---|---|
| 0. Survey | Reconcile scope docs, schema source, code/status map, actual branch policy | Accepted plan and first scenario |
| 1. Footings | Protect `dev`, exact-head gate, isolated staging, migration/backup smoke | Reviewed build deploys and recovers in staging |
| 2. Slab | Tenant/security negatives, consent, schema reconciliation, import proof | No cross-company access; safe data operations |
| 3. Frame | Inquiry -> booking/estimate -> job -> invoice/payment path | Realistic customer-to-cash flow and exception |
| 4. Controls | Outbox, retries, action states, approval inbox, kill switches | Agent action safely proposed, approved, observed |
| 5. Rooms and occupancy | Growth/Revenue/Operations/Retention/Command Center UX, first industry cases, monitoring | Pilot business operates with measured value |

Some work can proceed concurrently after its dependencies are clear. Designers can model office and field flows while Platform builds staging. Pair 1 can strengthen tenant/agent contracts while Pair 2 validates intake. Pair 3 can finish a known field workflow while Pair 4 designs owner approvals; Pair 5 can test migration and event provenance. Integrate in authorized batches; every combined head requires fresh evidence.

Suggested first 2 weeks: Platform implements enforceable `dev` gate and staging design; Pair 1 reconciles schema and tenant boundaries; Product Owner selects two real test businesses/scenarios; Pair 2 finishes the inquiry contract; Pair 3 verifies the job and worker path; Pair 4 specifies approval UX; Pair 5 stages a sample Service Fusion migration. Independent review, QA and Security focus on exact accepted PR heads.

Suggested next 4 weeks: complete a testable customer-to-cash slice, wire event/agent proposals, and deploy it to staging. The founder reviews a real workflow and approves any production promotion separately. Suggested following 4-6 weeks: controlled paying pilots, first industry variations, import hardening, recovery drills, and onboarding evidence. Dates are planning windows; dependency and quality gates decide the actual release.

# Load calculations: quality gates and team ownership

Every floor has four gates: structural correctness, usable experience, safe failure, and measurable outcome. A passing unit test is one piece of structural evidence. An accepted release includes real environment, negative case, recovery and operator sign-off appropriate to its risk.

| Gate | Minimum evidence |
|---|---|
| Contract | Typed interface, schema migration, consumers, compatibility path |
| Security | Tenant, role, consent and sensitive-action negatives |
| Reliability | Retry/idempotency, observable failure and restore/rollback |
| Experience | Office/field task and accessibility review |
| Business | One defined result, accurate measurement, buyer acceptance |

The team roles already documented in `TEAM.md` should carry the work: E.. CoS governs WIP and dev merges; Product Owner owns scope/acceptance; Technical Lead owns architecture; five senior developer pairs own domains; two designers own office and field; reviewers and four QA roles test independently; Platform 1/2 own release/reliability; Security owns risk review. Founder controls `main` and production. The team document says 26 roles but its own enumeration totals 25 active gate roles; reconcile the roster rather than silently inventing a person. [G3]

Use ADRs for material changes, including infrastructure/provider choices, money model, data boundary and critical contract changes. Keep existing successful code and refactor it where evidence supports it. Avoid rewriting for a perfect diagram. Avoid launching unverified features to satisfy a marketing deadline.

Roadmap success means a stable building with people operating it, not simply completed tickets: a team can ship a safe change, a new customer can migrate and run work, an agent can complete an authorized task, the owner can see value, and a failure can be detected and recovered.

# Sources and immediate decisions

**G1. Repo structure.** <a href="https://github.com/SimonShaun2/Renvani/tree/7f1e6328e1a5ba54c7477b0cce0496502235f1e0">Renvani dev snapshot</a>, inspected October 22, 2026. Apps and packages checked through GitHub.

**G2. Architecture and engineering rules.** <a href="https://github.com/SimonShaun2/Renvani/blob/dev/AGENTS.md">AGENTS.md</a>, same dev snapshot. Some product-scope wording conflicts with founder instructions; the current founder direction governs this blueprint.

**G3. Team and release policy.** <a href="https://github.com/SimonShaun2/Renvani/blob/dev/TEAM.md">TEAM.md</a> and <a href="https://github.com/SimonShaun2/Renvani/blob/dev/GITHUB_WORKFLOW.md">GITHUB_WORKFLOW.md</a>. Actual `dev` branch was reported unprotected on inspection.

**G4. Database and CI.** <a href="https://github.com/SimonShaun2/Renvani/tree/dev/packages/db">Database package</a> and <a href="https://github.com/SimonShaun2/Renvani/blob/dev/.github/workflows/batch-ci.yml">approved batch CI</a>. Latest checked approved batch run passed build/lint/test; no deployment workflow in the inspected tree.

**G5. Historical state.** <a href="https://github.com/SimonShaun2/Renvani/blob/dev/PROJECT_STATE.md">PROJECT_STATE.md</a>. This includes legacy snapshots and should not override current board evidence or the founder's direction.

**G6. Current dispatch implementation.** <a href="https://github.com/SimonShaun2/Renvani/blob/dev/apps/api/src/services/dispatch-intelligence.service.ts">Dispatch intelligence service</a> and <a href="https://github.com/SimonShaun2/Renvani/blob/dev/packages/db/src/schema.ts">schema</a>.

**G7. Capability gaps.** <a href="https://github.com/SimonShaun2/Renvani/pull/42">Draft FS-52 gap map</a> and related draft FS PRs. Status labels are repo reports, not production certification.

**P1. Pricing.** Founder-supplied `FSM Pricing Structure - Deep Dive (1).pdf`, October 20, 2026. Flex, Flat, unlimited seats and full access are founder policy; exact live payment capabilities require validation.

**S1. Incumbent accounting.** <a href="https://www.servicefusion.com/pricing">Service Fusion pricing and integration descriptions</a>.

**S2. Incumbent migration.** <a href="https://www.servicefusion.com/blog/field-service-software-data-migration">Service Fusion migration guidance</a>.

The first decisions are architectural and operational: approve this dependency order as the work map; reconcile the product-scope/governance drift; select the first two representative workflow scenarios; and turn existing FS board work into wave assignments. Those are planning decisions. This blueprint does not merge PRs, deploy, change live payments, or declare pilot readiness.
