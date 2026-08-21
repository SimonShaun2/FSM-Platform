# SPRINT_ROADMAP.md

**Authority:** FSM Platform V2 Master Directive §49
**Owner:** Claude (Product Manager)
**Supersedes:** the Phase 1A / 1B / 1C / Phase 2 / Phase 3 structure

Sprints are dependency-ordered, not date-ordered. A sprint begins when its dependencies
clear. Sprints may run partially in parallel where `TEAM.md` §4 allows. Additional sprints
may be inserted where feature depth requires — the numbering is not sacred, and oversized
sprints must not be forced to preserve it.

Per master directive §69, each major module is preceded by a competitor research update
into `COMPETITOR_RESEARCH.md` before its implementation tickets begin.

---

## Sprint 0 — Existing Repository Audit and Rebaseline · **ACTIVE**

Inspect before rebuilding. Produce full inventories of code, database, routes, frontend,
workers, integrations, tests, CI, dependencies, security posture and documentation.
Identify technical debt, obsolete architecture, conflicting instructions, reusable assets
and migration risk. Classify every meaningful area KEEP / REFACTOR / REPLACE / REMOVE.
Retire legacy governance. The audit becomes the restart baseline.

Tickets FSM-0001 → FSM-0014. **No V2 feature work begins until FSM-0012 is merged.**

---

## Sprint 1 — Architecture, Developer Platform, CI/CD and Design System

Target architecture and module boundaries. Tiered CI pipeline. Environment strategy.
Migration tooling and validation. Observability foundation. Design system foundation and
tokens. Progressive disclosure primitives — feature modules, role-based navigation,
command/search shell. Performance budgets. Accessibility baseline.

Depends on Sprint 0.

---

## Sprint 2 — Organizations, Authentication, Tenant Isolation, Roles and Permissions

Organization · business unit · location hierarchy. Authentication, token security, MFA
readiness, session management. Tenant isolation enforcement and adversarial test suite.
Role and permission model including custom roles. Permission-based navigation.
Support impersonation with audit.

Depends on Sprint 1. Security-sensitive — QA-02 required on every ticket.

---

## Sprint 3 — CRM, Customers, Contacts, Properties and Assets

Customers, contacts, properties, service and billing locations, notes, tags, custom fields,
history, communication history, attachments, preferences, lead sources, segmentation,
duplicate detection, import tooling. Equipment and asset management with serial numbers,
warranty, service history, maintenance intervals and coverage linkage.

Depends on Sprint 2.

---

## Sprint 4 — Scheduling, Calendar, Capacity and Dispatch

Daily, weekly and monthly scheduling. Drag-and-drop. Recurring and multi-day jobs. Arrival
windows. Capacity, technician and crew availability, time off, skills, territories, service
areas. Emergency and priority jobs. Conflict detection, waitlists, schedule templates.
Live dispatch board, technician status, GPS context, map view, route optimization, nearest
technician, skill matching, reassignment, customer ETA, On My Way, late notification,
dispatch zones.

Depends on Sprint 3.

---

## Sprint 5 — Jobs, Work Orders, Projects and Job Lifecycle

Jobs, work orders, visits, tasks, checklists, job types and statuses, notes, photos, videos,
files, forms, signatures, labor, materials, equipment, technician and crew assignment,
history, completion requirements, return visits, callbacks, warranty work, change orders,
projects, progress billing readiness.

Depends on Sprint 4.

---

## Sprint 6 — Field Technician Application

The full field experience against the flow in `AGENTS.md` §3. Today's work, job detail,
navigation, customer and equipment history, status updates, photos, forms, time, materials,
estimates, invoices, signatures, payment capture, completion. Offline and unstable-network
behaviour designed deliberately. Large touch targets. No duplicate entry.

Depends on Sprint 5. DES-02 leads UX; FE-02 implements.

---

## Sprint 7 — Pricebook, Estimates, Proposals and Sales Pipeline

Pricebook, products, services, materials, labor, bundles, packages. Good/Better/Best,
optional upgrades, recommendations. Proposal templates, photos, attachments, e-signatures,
deposits. Follow-ups, approval and decline tracking, estimate conversion, sales pipeline,
opportunity stages, sales performance.

Depends on Sprint 5.

---

## Sprint 8 — Invoices, Stripe Payments and Financial Operations

Automatic, manual, partial and progress invoicing. Deposits, credits, refunds, discounts,
taxes, payment terms, due dates, past-due workflows, recurring invoices, reminders,
receipts, statements, accounts receivable.

Stripe platform: Terminal and card-present, tap to pay, technician and office collection,
payment links, portal and online invoices, saved payment methods, phone payments, booking
deposits, membership billing, recurring payments, ACH and wallets where available.

**Gated on ADR-0003** — the Stripe Connect charge model (direct vs destination vs separate
charges and transfers) must be decided before implementation, based on merchant of record
structure, platform liability, dispute and refund responsibility, platform economics,
connected account experience and tax/reporting implications.

Includes the card surcharge engine per `AGENTS.md` §9 — off by default, lowest-permitted-
amount computation, full audit trail. Security-sensitive throughout; QA-02 required.

---

## Sprint 9 — Memberships, Service Agreements and Recurring Services

Membership templates, billing intervals, recurring billing, saved payment methods, included
visits, discounts, priority scheduling, reduced rates, waived fees, member pricing,
equipment and multi-property coverage, renewals, cancellation, pause, failed payment
recovery, upgrades and downgrades, technician/office/online sales, membership and recurring
revenue reporting, retention, upcoming service obligations.

Service agreements modelled separately from memberships: terms, covered equipment and
locations, planned visits, recurring work, custom and commercial billing, contract dates,
renewals, price adjustments, attachments, signatures.

Membership benefits surface automatically in estimates, scheduling and invoicing.

Depends on Sprints 7 and 8.

---

## Sprint 10 — Communications, Unified Inbox and Customer Notifications

Unified SMS, email, two-way messaging and push. Automated confirmations, reminders, On My
Way, delay notifications, estimate follow-ups, invoice reminders, payment confirmations,
review requests, renewal notices, maintenance reminders. All communication appears in the
customer timeline.

Depends on Sprint 5.

---

## Sprint 11 — Online Booking, Customer Portal and Self Service

Booking: service and location selection, problem description, photo and video upload,
availability, exact time or arrival window, deposits, saved payment methods, membership
application, intake questions, policy acceptance, confirmation. Existing customers resolve
to existing CRM records — duplicate creation is a defect.

Portal: upcoming and past appointments, estimate approval and change requests, invoice
payment, receipts, membership and agreement visibility, equipment, service requests,
booking, file upload, messaging, saved payment methods, referrals. No FSM jargon.

Self-service: appointment and arrival confirmation, property access instructions, gate
codes, pet and parking information, contactless arrival, remote check-in.

Depends on Sprints 9 and 10.

---

## Sprint 12 — Inventory, Purchasing, Vendors and Truck Stock

Warehouse, truck and location inventory. Products, materials, parts, barcode scanning,
counts, transfers, usage, returns, adjustments, minimum and reorder levels, purchase orders,
vendors, receiving, job material allocation, truck replenishment, inventory costing.

Depends on Sprint 7.

---

## Sprint 13 — Time Tracking, Payroll Support, Commissions and Workforce

Employees, technicians, dispatchers, managers, salespeople, CSRs, admins, custom roles,
skills, certifications, territories, availability, schedules, time off, timesheets, job
time, drive time, performance, commissions, goals, permissions.

Depends on Sprints 5 and 6.

---

## Sprint 14 — Job Costing, Profitability and Advanced Reporting

Revenue, labor, material, equipment and subcontractor cost, commission, discounts, refunds,
payment fees, other direct cost, gross profit, margin, estimated vs actual. Profitability at
job, customer, technician, service, location, business unit and date range.

Default dashboards before custom report building: revenue, jobs, average ticket, conversion,
technician production and sales, memberships, recurring revenue, marketing attribution,
customer acquisition, AR, payments, job costing, margin, inventory, utilization, capacity,
callbacks, reviews, retention, custom date ranges, exports.

Depends on Sprints 8, 12 and 13.

---

## Sprint 15 — Marketing, Reviews, Referrals, Loyalty and Customer Retention

Segmentation, SMS and email campaigns, automated campaigns, lead capture and source
tracking, reactivation, unsold estimate recovery, maintenance reminders, seasonal,
membership, retention, review and referral campaigns, loyalty, promotional offers, campaign
tracking and revenue attribution.

Audiences are built from operational FSM data, not a disconnected marketing database.
Reviews: automated requests, Google links, tracking, feedback, negative feedback routing,
internal satisfaction scores, referral workflows, campaign metrics. No review manipulation
or selective suppression.

Loyalty and referrals are optional and must not complicate core workflows for businesses
that do not use them.

Depends on Sprints 10 and 14.

---

## Sprint 16 — AI, Search, Recommendations and Workflow Automation

Job, customer, technician, equipment, call and message summaries. Estimate and invoice note
drafting. Follow-up, scheduling, dispatch and route recommendations. Membership opportunity
detection, unsold estimate recovery, maintenance opportunity detection, customer
reactivation. Natural language search, report explanation, anomaly detection, revenue
opportunity detection, marketing audience recommendations, AI-generated communication and
internal notes.

AI recommends. Deterministic authorized services act. AI never owns financial state, payment
state, job completion state or permissions.

Depends on Sprints 14 and 15.

---

## Sprint 17 — QuickBooks, Accounting, Public API and External Integrations

Accounting sync, QuickBooks integration, public API, webhooks, integration connection
management, integration health and status surfacing.

Depends on Sprints 8 and 14.

---

## Sprint 18 — Industry Packs and Advanced Operational Configuration

Optional configuration packs — never forks — covering default job types, forms, workflows,
pricebook structure, terminology, equipment types, required fields, membership and agreement
templates, reporting and automation templates, scheduling assumptions. Initial trades per
master directive §37, starting with HVAC, plumbing and electrical.

Depends on Sprint 16.

---

## Sprint 19 — Platform Billing, Internal Administration and Support Tools

Platform subscription billing, plan management, internal admin, support tooling, impersonation
with audit, account lifecycle.

Depends on Sprint 8.

---

## Sprint 20 — Security, Performance, Reliability, Data Migration and Hardening

Security review and penetration testing, performance budget enforcement, reliability and
backup verification, competitor data migration and reconciliation per master directive §67,
onboarding flows — Fast Start and Guided Advanced Setup per §68.

Depends on all feature sprints.

---

## Sprint 21 — Controlled Beta

Limited real-customer operation, feedback loop, defect triage, UX measurement against the
metrics in `AGENTS.md` §3, stability hardening.

---

## Sprint 22 — Production Release

Release certification by TL-01, QA-03 and DevOps. Automated release gates. Runbook execution
per `RELEASE_RUNBOOK.md`. General availability.

---

## Dependency Summary

```
Sprint 0 ──▶ Sprint 1 ──▶ Sprint 2 ──▶ Sprint 3 ──▶ Sprint 4 ──▶ Sprint 5
                                                                   │
                              ┌────────────────────┬───────────────┼───────────────┐
                              ▼                    ▼               ▼               ▼
                          Sprint 6            Sprint 7        Sprint 10       Sprint 13
                              │                    │               │               │
                              │              ┌─────┴─────┐         │               │
                              │              ▼           ▼         │               │
                              │          Sprint 8    Sprint 12     │               │
                              │              │           │         │               │
                              │              ▼           │         │               │
                              │          Sprint 9 ◀──────┼─────────┘               │
                              │              │           │                         │
                              │              ▼           ▼                         ▼
                              │          Sprint 19    Sprint 14 ◀──────────────────┘
                              │                          │
                              │                    ┌─────┴─────┐
                              │                    ▼           ▼
                              │                Sprint 15   Sprint 17
                              │                    │
                              │                    ▼
                              └──────────────▶ Sprint 11, Sprint 16
                                                     │
                                                     ▼
                                                 Sprint 18
                                                     │
                                                     ▼
                                    Sprint 20 ──▶ Sprint 21 ──▶ Sprint 22
```
