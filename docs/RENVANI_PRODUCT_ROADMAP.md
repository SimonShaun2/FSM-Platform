# Renvani Product Roadmap

## Product direction

Renvani is a growth company for home services. The product helps businesses attract customers through their own channels, turn inquiries into booked jobs, deliver great service, and earn repeat revenue. AI agents power workflows across the products; “AI workforce” describes how Renvani operates, not the company identity.

The product portfolio follows one owner-friendly path:

**Get found → Win more jobs → Run the work → Earn repeat business → Manage the business**

These are five connected product areas. They may be adopted in stages and should strengthen one another. The complete FSM suite is in scope; it is not a distant optional add-on or a reason to rebuild existing code.

## Portfolio

### 1. Renvani Growth — Get found

Help home service businesses attract customers through their own brand and channels.

- Branded website and service pages
- Local search and discovery
- Online booking or service-request entry
- Understand where jobs come from

### 2. Renvani Revenue — Win more jobs

Help businesses turn inquiries into confirmed work.

- Fast inquiry response
- Lead qualification
- Estimates and approvals
- Follow-up with leads
- Booking conversion and handoff

### 3. Renvani Operations — Run the work

Help teams deliver booked work reliably and keep customers informed.

- Scheduling and dispatch
- Jobs and field service workflows
- Technician/crew app
- Invoices and payments
- Customer portal

### 4. Renvani Retention — Earn repeat business

Help businesses bring customers back and build ongoing relationships.

- Service agreements and recurring work
- Reminders and win-backs
- Reviews and referrals

### 5. Renvani Command Center — Manage the business

Give owners one place to understand performance, manage exceptions, and oversee the work.

- Owner app and reporting
- Customer and property records
- Onboarding and data import
- Approvals, recommendations, and exceptions across the portfolio

## Existing FSM project is the product foundation

The FSM-Platform repository already contains substantial work for the non-AI product areas. The roadmap is to **finish, validate, and improve that work** and connect agent capabilities into it where useful. Do not assume existing modules are complete or production-ready, and do not rebuild them from scratch by default.

Before new implementation, map each current module to the five product areas and record:

- Existing code and user workflow (UI, API, schema, jobs/workers, integrations)
- What currently works, with exact test and browser evidence
- Broken, incomplete, confusing, or missing behavior
- Security, tenant, accessibility, reliability, and performance gaps
- The smallest finish/improvement ticket and dependencies
- Whether to keep, finish, improve, integrate, or—only with evidence—replace/rebuild

Use the FSM project’s current implementation as the starting point. A README, design, schema, or passing unit test does not by itself prove an end-to-end capability is done.

## Build sequence

### Step 0 — Portfolio and code baseline

Map the existing FSM project to the five product areas. Verify routes, UI, API behavior, schemas, tests, browser flows, integrations, and known blockers. Create a capability matrix and tickets for actual gaps. Keep this as a baseline and planning step, not a reason to stall unrelated, verified work.

### Step 1 — Complete the first cleaning growth path

Make the end-to-end residential-cleaning journey coherent: local discovery and branded request → inquiry response and estimate → booking handoff → scheduling and service completion → recurring-work/review/referral follow-up → owner visibility.

Use existing FSM capabilities wherever they cover the workflow. Prioritize the smallest necessary fixes and agent integrations. Keep the operator in control of customer-visible messages, estimates, schedule commitments, and exceptions.

### Step 2 — Finish and improve the portfolio by area

Work through the capability matrix. Improve current scheduling, dispatch, job, technician, invoice/payment, agreement, customer, portal, reporting, onboarding, and import functionality as evidence shows. Build new capabilities only for verified gaps. Maintain one clear customer/service record and explicit system-of-record rules.

### Step 3 — Extend agent execution across the products

Add AI/agent behavior to the existing workflows where it creates measurable value: growth recommendations, inquiry conversion, schedule support, service preparation/recovery, repeat-service actions, and owner oversight. Keep permissions, consent, approvals, audit history, and safe failure handling built into every action.

### Step 4 — Broaden and mature

Improve reliability, usability, integrations, reporting, and trade configuration from operator evidence. Expand beyond residential cleaning when the product path is reliable and the core workflows transfer.

## Roadmap rules

- Do not push Operations or the full FSM suite out of scope; the growth-first sequence determines where to lead and what must work together first.
- Prefer completing or improving existing FSM code over greenfield replacement.
- A feature is “done” only with verified end-to-end acceptance appropriate to its risk, not because a design or code path exists.
- Distinguish current availability from planned product scope in design and marketing.
- Do not advertise integrations, autonomous actions, customer results, or performance claims that have not been built and verified.
- Preserve operator consent, owner approval, privacy, attribution, and clear failure recovery.

## Success measures

Measure the journey as a connected system: direct inquiries/jobs from owned channels, inquiry-to-estimate and estimate-to-confirmed-job conversion, reliable completed service, recurring/repeat revenue, customer experience, and owner time saved. Establish definitions and baselines before claiming improvement.
