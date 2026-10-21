# Historical ServiceRev workflow — reference only

This file describes the earlier V1/Phase 2 product workflow and is not a current build or release instruction. The founder's agent-first FSM direction, current FS-* Notion board, TEAM.md and GITHUB_WORKFLOW.md govern present work. Preserve this file for product pattern inventory; do not infer permission to build the full suite, send customer messages, charge money, run standalone CI or deploy from its flow diagrams.

---

# ServiceRev — Full Product Workflow
**Version:** Phase 2 (Final) — **retired product boundary**
**Principle:** Thinner system, smarter brain. *(Retired; see `AGENTS.md` §0.)*

~~This document is the source of truth for how ServiceRev works end-to-end.~~
~~All agents read this before building any frontend or backend feature.~~

The body below is a **historical product-flow inventory** only. For build, merge, CI and
release instructions use `AGENTS.md`, `TEAM.md`, and `GITHUB_WORKFLOW.md`.

---

## Core System Loop

```
Login
  ↓
Role-Based Workspace
  ↓
Customer / Property / Asset
  ↓
Estimate or Work Order
  ↓
Convert Estimate → Job
  ↓
Schedule / Dispatch
  ↓
Tech Execution (Mobile)
  ↓
Upsell / Quote / Signature
  ↓
Job Completion
  ↓
Invoice / Payment
  ↓
Review Request
  ↓
AI Revenue Loop
```

---

## 1. Login → Role Entry

```
Login
  ↓
Role Detected
  ↓
Owner / Manager  → Dashboard
Dispatcher       → Dispatch Board
Technician       → Mobile Jobs
```

---

## 2. Owner / Manager Flow

**Default landing:** Dashboard
**Goal:** Find revenue → decide action → create estimate/job/invoice → capture payment

### Action A — Create Estimate / Quote
```
Create Estimate
  ↓
Add Products (from catalog)
  ↓
Good / Better / Best (optional tiers)
  ↓
Send Estimate
  ↓
Customer Views + E-Signs
  ↓
Convert to Job
  ↓
Schedule → Complete → Invoice → Payment
```

### Action B — Create Work Order Directly
```
Create Work Order / Job
  ↓
Add Tasks
  ↓
Attach Assets
  ↓
Add Products
  ↓
Attach Files
  ↓
Schedule Job
```

### Action C — AI Follow-Up
```
AI Suggestion surfaced on Dashboard
  ↓
Review recommendation + "Why this?"
  ↓
Approve AI-drafted message
  ↓
Send SMS / Email
  ↓
Customer responds / books / pays
```

---

## 3. Dispatcher Flow

**Default landing:** Dispatch Board
**Goal:** Keep schedule full → assign right tech → reduce gaps

### Action A — Assign Job
```
Unscheduled Job in queue
  ↓
Drag to Technician slot
  ↓
Job Scheduled
  ↓
Tech Notified
  ↓
Customer Reminder queued
```

### Action B — Auto-Fit
```
Select unscheduled job
  ↓
Click Auto-Fit
  ↓
AI suggests best technician + time slot (urgency + revenue + proximity)
  ↓
Apply or override
```

### Action C — Convert Approved Estimate to Job
```
Approved Estimate in queue
  ↓
Convert to Job
  ↓
Select date/time
  ↓
Assign Technician
  ↓
Job Scheduled
```

### Action D — Inline Quick Create
```
Click empty slot on dispatch board
  ↓
Inline job create (no modal)
  ↓
Select customer / property / asset
  ↓
Assign technician
  ↓
Job Scheduled
```

---

## 4. Technician Mobile Flow

**Default landing:** Today's Jobs
**Goal:** Know next job → complete work → capture notes/forms/photos → upsell → sign → invoice

### Job Execution
```
Select Job from Today's list
  ↓
View Job Detail (customer, property, asset, tasks, notes)
  ↓
Tap "On The Way"
  ↓
Customer SMS notification sent automatically
  ↓
Arrive → Start Job
  ↓
Time Tracking starts automatically
  ↓
Complete Tasks (checklist)
  ↓
Add Notes
  ↓
Take Photos / Upload Files
  ↓
Files attach to: Job, Customer, Asset
```

### Upsell / Quote (Critical Revenue Path)
```
AI Suggestion appears OR Tech identifies additional work
  ↓
Add Product from catalog
  ↓
Create Estimate (line items pre-filled from AI)
  ↓
Show Customer on device
  ↓
Customer E-Signs approval
  ↓
Work completed
```

### Job Completion
```
Mark Complete
  ↓
Stop Time Tracking
  ↓
Capture final signature
  ↓
Invoice generated or queued
  ↓
Payment link sent to customer
```

---

## 5. Invoice + Payment Flow

```
Job Completed
  ↓
Invoice Created (from job + products)
  ↓
Send to Customer (Stripe payment link)
  ↓
Customer Pays online
  ↓
Payment captured via Stripe Connect
  ↓
Platform fee taken automatically
  ↓
Company receives remainder
```

---

## 6. Post-Job Automation

All post-job automations are opt-in via Automation Rules settings.
Nothing sends without the company enabling it.

```
Job Completed
  ↓
Review Request sent (if rule enabled)
  ↓
Customer clicks review link
  ↓
Customer leaves Google / Yelp review
  ↓
review_request.completed event emitted
```

---

## 7. AI Revenue Loop

### Trigger Events
```
job.completed          → evaluate-revenue-opportunities
estimate.declined      → evaluate-revenue-opportunities
plan.cancelled         → evaluate-revenue-opportunities
invoice.overdue        → invoice-recovery-check
estimate.sent + 24h    → estimate-follow-up-check (if rule enabled)
nightly cron           → dormant-customer-scan (all companies)
```

### AI Detects
```
Dormant customers (no service > 90 days)
Aging assets (equipment > 10 years old)
Unsold estimates (no response after 24h)
Unpaid invoices (overdue)
Customers without maintenance plans
Seasonal service opportunities
```

### AI Outputs
```
ai_recommendations created with:
  - headline
  - body
  - suggestedAction
  - suggestedMessage (pre-drafted SMS)
  - estimatedRevenue
  - urgencyScore (0-100)
  - "Why this?" reasoning
```

### Owner Acts
```
Dashboard → AI Suggested Actions
  ↓
Review recommendation
  ↓
Click action button (Schedule / Send Follow-Up / Send Payment Link)
  ↓
One-click execution
  ↓
Recommendation marked actioned
  ↓
Cache invalidated
  ↓
New opportunity surfaces
```

---

## System Data Model

```
Customer
  → Property
    → Asset
      → Job (= Work Order)
          → job_tasks          (checklist items)
          → job_products        (catalog items used)
          → file_attachments    (photos, docs, videos)
          → time_entries        (tech clock in/out)
          → estimates           (quotes created during job)
          → invoices            (billing)
          → activity_events     (full audit trail)
          → ai_recommendations  (surfaced opportunities)
```

---

## Notification Flows

All notifications run through `fsm:notifications` BullMQ queue.
Never sent inline in request handlers.

```
job.scheduled        → reminder SMS to customer (24h before, if rule enabled)
technician.on_the_way → OTW SMS to customer (immediate)
job.completed        → review request SMS (if rule enabled)
estimate.sent        → follow-up check queued for 24h (if rule enabled)
invoice.sent         → overdue check queued for dueAt + 1hr
invoice.overdue      → reminder escalation (3 levels, if rule enabled)
plan renewal         → dunning email if payment fails
```

---

## Management + Reporting

### V1 (Built)
```
AI Revenue Center     → where is the money hiding (primary)
Revenue Dashboard     → total opportunity value by category
Recommendation feed   → actionable list sorted by urgency
```

### V1 Simple Stats (Phase 2)
```
Jobs completed (MTD)
Revenue collected (MTD)
Estimates conversion rate
Tech utilization per technician
Unpaid invoice total
Open estimate total
```

### V2 (Do Not Build Yet)
```
Custom reports
Advanced analytics
Job costing (budget vs actuals)
Commission tracking
Revenue trends over time
```

---

## Role Capabilities

| Action | Owner | Admin | Dispatcher | Technician |
|---|---|---|---|---|
| View Dashboard + AI Revenue Center | ✅ | ✅ | ❌ | ❌ |
| Create/send estimates | ✅ | ✅ | ✅ | ✅ |
| Create/schedule jobs | ✅ | ✅ | ✅ | ❌ |
| Access Dispatch Board | ✅ | ✅ | ✅ | ❌ |
| Mobile job execution | ✅ | ✅ | ❌ | ✅ |
| Create/send invoices | ✅ | ✅ | ✅ | ❌ |
| Manage technicians | ✅ | ✅ | ❌ | ❌ |
| Manage product catalog | ✅ | ✅ | ❌ | ❌ |
| View service agreements | ✅ | ✅ | ✅ | ❌ |
| Access settings | ✅ | ✅ | ❌ | ❌ |
| Run imports | ✅ | ✅ | ❌ | ❌ |

---

## Frontend Routes

### Auth
```
/login
/signup  (handled via CSV import wizard onboarding)
/reset-password
```

### Role Entry
```
/dashboard          → Owner / Manager landing
/dispatch           → Dispatcher landing
/mobile/jobs        → Technician landing
```

### Core App
```
/dashboard
/dispatch
/customers
/customers/[id]
/jobs
/jobs/[id]
/estimates
/estimates/new
/estimates/[id]
/invoices
/invoices/[id]
/products           → Product catalog
/service-agreements
/service-agreements/[id]
/ai-revenue-center
/review-requests
/settings
/settings/payments
/settings/automation
/settings/users
/settings/review-links
```

### Mobile (Tech App)
```
/mobile/jobs
/mobile/jobs/[id]
/mobile/jobs/[id]/tasks
/mobile/jobs/[id]/complete
/mobile/signature
```

### Public (No Auth)
```
/estimates/[token]           → Customer estimate approval
/pay/[token]                 → Customer payment page
/review/[token]              → Customer review landing
```

---

## V1 Feature List (Final)

### ✅ Must Have — Backend Done
- Auth, multi-tenant, roles
- Customers, properties, assets
- Jobs (work orders) full lifecycle
- Technicians
- Estimates with Good/Better/Best
- Invoices + Stripe payments
- Stripe Connect (platform fee)
- Service agreements + subscriptions
- AI Revenue Engine (5 recommendation types)
- AI Revenue Dashboard
- SMS campaigns with human approval
- CSV import with AI column mapping
- BullMQ workers for all async
- Automation rules (opt-in)
- Activity events on everything

### ✅ Must Have — Schema Done, Backend Needed (Phase 2B)
- Product catalog
- Job tasks
- Job products + upsell flow
- Time tracking
- File attachments (all entities)
- On-the-way notifications
- Review requests

### 🔶 V1.5
- Basic reporting numbers
- Team management (user invites)
- Service agreement enrollment UI
- Review link settings
- Upsell approval flow (mobile)

### ❌ V2
- Advanced analytics / custom reports
- Job costing
- Inventory
- Commission / payroll
- Route optimization
- Crew management (multi-tech)
