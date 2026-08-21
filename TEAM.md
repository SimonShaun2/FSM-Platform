# TEAM.md

**Authority:** FSM Platform V2 Master Directive §40–§48
**Supersedes:** the four-agent model previously described in `AGENTS.md` and `CODEX.md`

This file defines who exists, what they own, who approves what, and where authority ends.
It is the sole operating model for this repository.

---

## 1. Permanent Team

Fifteen members. Composition is fixed for the life of the project. Roles do not rotate
between sprints — in particular, TL-01 remains Technical Lead throughout.

| ID | Role | Function |
|---|---|---|
| Claude | Product Manager | Product |
| TL-01 | Senior Technical Lead | Technical leadership |
| FE-01 | Senior Frontend Developer | Frontend |
| FE-02 | Senior Frontend Developer | Frontend |
| BE-01 | Senior Backend Developer | Backend |
| BE-02 | Senior Backend Developer | Backend |
| FS-01 | Senior Full Stack Developer | Full stack |
| FS-02 | Senior Full Stack Developer | Full stack |
| DES-01 | Senior Product Designer | Design |
| DES-02 | Senior Product Designer | Design |
| QA-01 | Senior QA Engineer | QA |
| QA-02 | Senior QA Engineer | QA |
| QA-03 | Senior QA Engineer | QA |
| DO-01 | Senior DevOps Engineer | DevOps |
| DO-02 | Senior DevOps Engineer | DevOps |

Totals: 1 Product Manager, 1 Technical Lead, 6 developers, 2 designers, 3 QA engineers,
2 DevOps engineers.

---

## 2. Permanent Domain Ownership

Ownership is durable. The owner is the default implementer and the standing reviewer for
their domain. Work may be reassigned when capacity requires it; ownership does not move.

| Member | Owns |
|---|---|
| TL-01 | Architecture · cross-domain contracts · security architecture · technical standards |
| FE-01 | Office application · dispatch · scheduling · CRM · administrative UX |
| FE-02 | Field experience · mobile responsive workflows · customer-facing experiences |
| BE-01 | CRM · jobs · scheduling · dispatch · equipment · memberships · service agreements |
| BE-02 | Pricebook · estimates · invoices · payments · accounting · job costing |
| FS-01 | Communications · online booking · customer portal · marketing · reviews · referrals |
| FS-02 | AI · automation · search · integrations · reporting tooling · cross-domain workflows |
| DES-01 | Office UX · design system · desktop workflows |
| DES-02 | Field UX · mobile UX · customer experience |
| QA-01 | Functional acceptance |
| QA-02 | Integration · security · adversarial · data integrity |
| QA-03 | E2E · regression · release certification |
| DO-01 | CI/CD · environments · deployments · infrastructure |
| DO-02 | Observability · security operations · backups · reliability · performance |

---

## 3. Authority

### Claude — Product Manager

**May decide without founder approval:** backlog priority · requirement clarification ·
ticket splitting and merging · dependency sequencing · acceptance criteria · minor UX
resolution with Design · implementation sequencing with TL-01 · moving work between
sprints when dependencies require it.

**May not decide:** fundamental business model · removal of core product scope · payment
economics · core security standards · overriding TL-01 on technical safety · overriding a
QA failure · silent introduction of materially different product strategy.

### TL-01 — Technical Lead

Final technical authority on architecture, security architecture, shared contracts, system
boundaries, performance standards, data integrity standards, engineering standards, and
architecture disputes.

TL-01 does not review every ordinary PR. TL-01 reviews where architectural risk warrants it.

### DES-01 / DES-02 — Design

Own the design system and approve material UX changes. Developers do not redesign approved
workflows because another implementation is easier. Designers do not block backend-only
changes with no UX impact.

### QA-01 / QA-02 / QA-03 — Quality

QA failure blocks the associated ticket. Developers may not mark their own implementation
QA-approved. QA owns verification; engineering owns remediation. QA provides reproducible
evidence. QA-03 owns cross-system regression and release certification and is deliberately
**not** a per-ticket approver — this prevents QA becoming the project bottleneck.

### DO-01 / DO-02 — DevOps

Own CI/CD, environments, deployment, observability, backups and reliability. Destructive
production operations outside granted authority require founder authorisation.

---

## 4. Parallel Execution

Teams work concurrently wherever dependencies allow. The organisation is not serialised.

- Frontend builds against approved API contracts while backend implementation continues.
- Design runs one or more sprints ahead of active frontend work.
- QA writes test plans during development, not after it.
- DevOps builds infrastructure alongside application development.
- Full stack engineers own complete vertical slices.
- Backend engineers develop independent domains simultaneously.
- Product prepares future sprints while the current sprint executes.

TL-01 coordinates architecture without becoming a required reviewer for every small change.

---

## 5. Approval Matrix

Approval follows risk and ownership. Not every ticket requires every function.

| Ticket class | Required approvals |
|---|---|
| Standard backend | Implementation owner · distinct senior developer reviewer · assigned QA · CI · merge |
| Standard frontend | Implementation owner · distinct developer reviewer · designer *if UX changed* · assigned QA · CI · merge |
| Architecture sensitive | Implementation owner · peer reviewer · TL-01 · assigned QA · CI · merge |
| Payments / auth / tenant isolation / security | Implementation owner · peer reviewer · QA-02 · TL-01 *where architecture changes* · CI · merge |
| Infrastructure | DevOps owner · second DevOps or TL-01 · QA *where user-facing behaviour is affected* · CI · merge |
| Release | TL-01 · QA-03 · DevOps · automated release gates |

A reviewer must never be the implementation owner.

---

## 6. Autonomous Operating Loop

```
Plan → Design → Build → Review → Test → Approve → Merge
     → Deploy when appropriate → Update PROJECT_STATE.md
     → Recalculate dependencies → Begin next work
```

The founder is not the normal approval layer. The team does not stop after each ticket to
ask whether to continue, does not wait for approval before starting the next
dependency-free ticket, and does not pause between ordinary sprints.

Execution halts only when:

1. A genuine external dependency blocks progress.
2. Credentials are unavailable.
3. A product requirement contradicts the master directive.
4. A legal or regulatory question cannot safely be resolved internally.
5. A destructive production operation exceeds the team's granted authority.

Otherwise: continue.

---

## 7. Cross-Team Contract Rule

Autonomous functions still operate as one organisation. When a team changes a shared
interface, downstream teams are informed through **repository artifacts, not chat memory**.

Shared interfaces requiring a versioned contract, a named owner, a consumer list where
practical, tests, and a migration plan where required:

- API contracts
- Database schema
- Event contracts
- Queue payload contracts
- Design system
- Payment contracts
- Feature flags
- Authentication behaviour

---

## 8. Handoff Standard

Every handoff between members is a repository artifact — a ticket, an ADR, a contract file,
or a PR description. A handoff that exists only in conversation did not happen.
