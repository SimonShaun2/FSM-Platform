# Renvani batch plan — Batches 5–9 (autonomous execution)

**Authority:** Founder standing orders 2026-10-22 **5:26 PM CT** (relay E.. CoS) and **6:24 PM CT MVP-first / cost policy** (relay E.. CoS; PO alignment with Elena)  
**North star:** **Get to MVP** — finish core products on solid FSM infrastructure and the full **Discover → Book → Serve → Repeat** lifecycle.  
**Tech Lead:** Grace (`bc-f58c7cfc-d866-4f13-bbbb-b95c96ea1f27`) — autonomous batch-to-batch for **5 batches** (no per-batch founder/CoS wait; Shaun pre-approved CI + merge to `dev`)  
**Product Owner:** Elena (`bc-0da9c117-da01-40c1-9d2a-29957eaa548f`) — scope, acceptance, and **MVP cut-line** (what ships vs slips)  
**Integration base (planning):** `dev` @ `7c41d2dc282b14ef04c714a406ff9642c1e6b145` (dispatch 2026-10-22 UTC)  
**Hard rules:** no rebase, no force-push, new commit voids sign-offs; never touch `main`; no deploys; no account/credential/resource creation; no live payments or real-customer sends; no Render/Vercel/R2 **provisioning** (FS-93 architecture/docs only until Shaun OK).

**Reporting:** E.. CoS only at each batch merge (PR list + merge SHAs) or a real blocker.

---

## 0. Founder policy — MVP-first, cost-disciplined (2026-10-22 6:24 PM CT)

**Applies to:** Batches 5–9 planning, execution, and Elena's acceptance scope. Grace and pods **filter every new PR, ticket, and vendor choice** through this section before expanding batch rosters.

### Principles

1. **MVP-first:** Merge work that completes or hardens the **Discover → Book → Serve → Repeat** loop on production-grade FSM (tenant-safe data, jobs, dispatch, estimates/invoices, customer comms, agreements where already specced). Defer polish, pilots, GTM-only, and “platform nice-to-have” that does not unblock MVP operators.
2. **Cost-disciplined:** No new **paid service, subscription, or metered vendor SKU** (hosting tier upgrades, new SaaS seats, paid APIs, add-on cloud products) unless:
   - there is a **demonstrated MVP dependency** (feature cannot ship without it),
   - **business justification** is written (who benefits, what breaks without it),
   - **founder-approved budget** is recorded.
   - **Agents and implementers do not add or provision these.** Flag the need to **E.. CoS** with the three bullets above; CoS routes to founder for budget — do not silently expand `environment.json`, Render/Vercel/R2 **paid** tiers, or new third-party accounts.
3. **Deprioritize non-MVP work:** Items marked **⏸ post-MVP** in batch tables below stay out of merge trains unless Elena promotes them with explicit MVP linkage in Notion + batch PR description.
4. **Infrastructure vs MVP:** FS-93 / staging matrix / runbooks remain **design and docs-only** until Shaun OK (unchanged). That supports MVP without provisioning spend.

### Lifecycle map (planning priority)

| Stage | MVP meaning (engineering) | Primary batches / tickets |
| --- | --- | --- |
| **Discover** | Branded site, inquiry/intake, growth signals that feed booking | FS-31, FS-38, FS-17, FS-55/53 (Batch 6–7) |
| **Book** | Booking requests, scheduling agent, holds, public book flow | FS-23, FS-21, FS-87 sync contract (Batch 6–7) |
| **Serve** | Jobs, dispatch, field work, attachments, technician mobile | FS-85/89, dispatch/SSE, FS-87 client (Batch 7–8) |
| **Repeat** | Maintenance plans, reminders, loyalty (FS-72), revenue follow-up | FS-72 spec + impl (Batch 5 doc / Batch 9 impl), FS-14 agent proposals |

### Paid / subscription gate (examples)

| Item | MVP dependency? | Action |
| --- | --- | --- |
| FS-94 Renvani→operator **platform billing** (new Stripe products, metering) | **Not required for operator MVP** on existing Connect model | **⏸ Batch 9** until founder budget + Elena scope; flag E.. CoS — do not open new paid Stripe/platform SKUs in agent runs |
| Staging **provisioning** (Render/R2/Vercel paid tiers) | Design-only for MVP proof | Docs/matrix only (FS-75, FS-93); no provisioning |
| FS-6 design partners, FS-4 TrayLoop inventory refresh | GTM / inform | **⏸ post-MVP** (§6 Notion Ready) |
| FS-82 capacity qualification, FS-35 pilot rubric | Hardening / pilot | **⏸ post-MVP** unless Elena ties to MVP launch checklist |
| FS-83 drill **automation** (beyond docs) | DR evidence | Docs + CI checks in Batch 8; full automation **⏸** unless founder approves ops budget |

### Elena (PO) — MVP cut-line duties

- Own **acceptance per lifecycle stage** above; reject batch scope that does not advance Discover → Book → Serve → Repeat.
- Keep Notion `CI Batch` aligned (§6); **do not** pull FS-6/FS-4/FS-94 into engineering merges without founder + CoS visibility.
- When a ticket implies a **new paid vendor**, add Notion note “**CoS budget flag**” and stop implementation until founder approval.

### Grace (Tech Lead) — execution duties

- Re-order within-batch merge priority: **MVP P0** before **⏸ post-MVP** slots.
- Refuse autonomous expansion of batch rosters with non-MVP work; surface conflicts to E.. CoS.
- Continue migration registry discipline; **no** migration solely for deferred FS-94 until policy gate clears.

---

## 1. Roster (FS-91 + pods)

### Senior developer pairs (implementation owners)

| Pair | Devs | Primary lanes |
| --- | --- | --- |
| **1** | **Ava** (A) + **Marcus** (B) | Backend — identity/session (FS-84), control plane (FS-12/13 support) |
| **2** | **Priya** (C) + **Leo** (D) | Backend — DB ops (FS-80), revenue/scheduling APIs (FS-17, FS-87), migrations |
| **3** | **Sofia** (E) + **Omar** (F) | Backend — isolation (FS-92), media/export (FS-85, FS-89), growth workers |
| **4** | **Ben** (G) + **Nina** (H) | Infra — staging matrix (FS-75), runtime health (FS-79), recovery (FS-83), command center hooks |
| **5** | **Diego** (I) + **Hana** (J) | Infra — secrets/env (FS-76), queues/DLQ (FS-81), branch protection (FS-74) |

### Backend pods (parallel capacity — same pair tickets, split file ownership)

| Pod | Lead | Pair anchor | Focus |
| --- | --- | --- | --- |
| **Backend 1** | **Noah** | Pair 1 | Auth/session services, FS-84 negatives, FS-12 state machine API |
| **Backend 2** | **Aria** | Pair 2 | Transactions, FS-80 helpers, FS-87 sync contracts, migration safety |
| **Backend 3** | **Kai** | Pair 3 | FS-92 proof tests, FS-85/89 storage boundaries, worker idempotency |

### Infrastructure pods

| Pod | Lead | Pair anchor | Focus |
| --- | --- | --- | --- |
| **Infra 1** | **Mila** | Pair 4 | FS-75/79 staging+runtime docs, FS-83 RPO/RTO, observability hooks |
| **Infra 2** | **Ezra** | Pair 5 | FS-76/74/81 runbooks, CI/batch-ci wiring docs, queue policy |
| **Infra 3** | **Iris** | Tech Lead + Pair 4/5 | FS-93/Render reconciliation, migration registry, cross-batch merge order |

### Frontend / design (batch-balanced slices)

| Role | Dev | Typical PRs |
| --- | --- | --- |
| Workflow & web | **Dev E** (legacy roster) / **Marcus** co-own | FS-31 branded acquisition, booking/inquiry UX hardening |
| Acquisition web | **Dev D** / **Leo** co-own | FS-38/17 public flows, growth surfaces |
| Operator UI | **Dev G** / **Ben** co-own | FS-14 command center, FS-55/53 growth UI |
| Design | Designer 1 + 2 | FS-9/47/48 alignment (non-blocking for infra batches) |

### Review, QA, Security (exact-head sign-off)

| Function | Names | Rule |
| --- | --- | --- |
| **Reviewer** | Isaac, Chloe, Victor (rotate per PR) | Architecture/API contract; posted GitHub comment @ full head SHA + agent id |
| **QA** | Lily, Jamal, Zoe, Owen | Commands + UI matrix where applicable; comment @ head SHA |
| **Security** | Sam (`bc-3826ae19-3f55-4c04-aa04-de68bf25cc0a`) | Mandatory for tenant/auth/secrets/money/media; comment @ head SHA |

**Sign-off void:** any new commit on the PR branch before merge.

---

## 2. SQL migration authority

**Registry:** `docs/platform/MIGRATION_NUMBERING_REGISTRY.md` (on PR #59 branch until merged; Tech Lead maintains on `dev` after #59).

| Slot | Assignment | PR |
| --- | --- | --- |
| 0018–0019 | FS-55 growth check | #52 |
| 0020 | FS-17 inquiry idempotency | #53 |
| 0021 | FS-14 agent action params | #55 |
| 0022 | FS-53 growth intake | #56 |
| **0023** | **FS-87 field work sync** | **#75** (renumber from `0018_field_work_sync` — new commit only) |
| **0024** | *Reserved — Batch 6* | FS-85 storage schema (PR #69) — **request before generate** |
| **0025+** | *Unallocated until founder gate* | FS-94 subscription billing — **⏸** per §0 (flag E.. CoS; no generate without budget) |
| **0026+** | Unallocated | Tech Lead only |

**Merge rule:** Within a batch, merge SQL-bearing PRs in **ascending idx** after all non-SQL PRs in that batch unless registry says otherwise.

---

## 3. Batch execution pipeline (each batch)

1. Open or refresh all batch PRs (target 8–10), assign pair + pod leads, migration slots declared in PR description.
2. Reviewer + QA + Security (if applicable) sign at **exact full head SHA** in GitHub PR comments.
3. When **all** batch PRs are open and Security-signed (where required), **start next batch** work in parallel (prep branches only; do not merge batch N+1 until batch N lands).
4. When batch is fully signed: add `batch-ci` label → wait green → mark ready → merge to `dev` in **migration order** with head SHA guard on merge commit message.
5. Post merge summary to E.. CoS (PR numbers + merge SHAs).

---

## 4. Carryovers into Batch 5 (mandatory)

| PR | Ticket | Gate |
| --- | --- | --- |
| [#59](https://github.com/SimonShaun2/Renvani/pull/59) | FS-93 | Docs fully signed; merge early in batch |
| [#76](https://github.com/SimonShaun2/Renvani/pull/76) | FS-93 deployment doc | After #59; Isaac CHANGES addressed @ `d344786…` |
| [#75](https://github.com/SimonShaun2/Renvani/pull/75) | FS-87 | **Renumber to `0023_field_work_sync`** — done @ `79daecd…` (Batch **6** merge) |
| [#54](https://github.com/SimonShaun2/Renvani/pull/54) | FS-72 spec | **Security** sign-off required |
| [#69](https://github.com/SimonShaun2/Renvani/pull/69) | FS-85 storage | Merge **after** [#70](https://github.com/SimonShaun2/Renvani/pull/70) |
| Batch 4 failures | — | Any open Batch 4 PR that fails `batch-ci` is **re-cut** (new commit) and slotted into Batch 5 or 6 — no force-push |

---

## 5. Batch definitions (5–9)

### Batch 5 — `BATCH-FS5-FOUNDATION-004`

**Theme:** Close FS-93 documentation; platform footings (no cloud provisioning); runtime health + secrets + staging **design**.  
**MVP lens (§0):** **P0** — tenant-safe DB/helpers (FS-80), secrets/env contracts (FS-76), runtime health (FS-79) underpin Serve/Repeat. **P0 docs** — FS-93/75/83 design without spend. **P1** — branch protection (FS-74). FS-72 **spec only** (#54) supports Repeat; implementation waits Batch 9.

| # | PR | Ticket | Layer | Owner | Reviewer | QA | Sec |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | #59 | FS-93 | Infra/docs | Iris + Grace | Victor | Owen | Sam |
| 2 | #76 | FS-93 deploy doc | Infra/docs | Iris | Isaac | Lily | Sam |
| 3 | #47 | FS-41 | Docs/platform | Grace | Chloe | Jamal | — |
| 4 | #68 | FS-76 | Infra | Diego+Hana / Ezra | Isaac | Zoe | Sam |
| 5 | #65 | FS-74 | Infra | Diego+Hana | Victor | Owen | — |
| 6 | #64 | FS-83 | Infra | Ben+Nina / Mila | Chloe | Lily | — |
| 7 | #71 | FS-79 | Infra/API | Ben+Nina / Mila | Isaac | Jamal | Sam |
| 8 | #61 | FS-75 | Infra | Ben+Nina | Victor | Zoe | Sam |
| 9 | #63 | FS-80 | Backend | Priya+Leo / Aria | Chloe | Owen | Sam |
| 10 | #54 | FS-72 spec | Product/docs | Nina + Elena | Victor | — | Sam |

**Not in Batch 5 merge:** #75 (0023) until renumber verified; #69 until #70 merged.

**Balance:** ~4 infra docs + 4 infra/runtime + 2 backend/docs.

---

### Batch 6 — `BATCH-FS6-GROWTH-CONTROL-005`

**Theme:** Growth migration chain + agent control plane + identity/isolation proofs.  
**MVP lens (§0):** **P0** — Discover/Book (FS-17 inquiry, FS-55/53 growth intake), human-in-the-loop revenue (FS-14, FS-10), isolation (FS-92), field sync contract (FS-87). **P1** — FS-12/13 session/context depth if not blocking MVP demos.

| # | PR | Ticket | Layer | Owner | Migration |
| --- | --- | --- | --- | --- | --- |
| 1 | #52 | FS-55 | BE+worker | Sofia+Omar / Kai | 0018–0019 |
| 2 | #53 | FS-17 | BE+web | Priya+Leo / Aria | 0020 |
| 3 | #55 | FS-14 | BE+web | Ben+Nina + Dev G | 0021 |
| 4 | #56 | FS-53 | BE | Sofia+Omar | 0022 |
| 5 | #48 | FS-12 | BE | Ava+Marcus / Noah | — |
| 6 | #51 | FS-13 | BE | Ava+Marcus | — |
| 7 | #62 | FS-84 | BE | Ava+Marcus / Noah | — |
| 8 | #67 | FS-92 | BE/tests | Sofia+Omar / Kai | — |
| 9 | #43 | FS-10 | BE | Priya+Leo | — |
| 10 | #75 | FS-87 | BE | Priya+Leo / Aria | **0023** |

**Balance:** 6 backend, 2 frontend-heavy, 2 worker/growth.

---

### Batch 7 — `BATCH-FS7-REVENUE-SCHEDULE-006`

**Theme:** Branded acquisition, scheduling agent, queues, export.  
**MVP lens (§0):** **P0** — Discover + Book (FS-31, FS-23, FS-38 hardening, FS-21 holds). **P1** — FS-89 export, FS-81 queue policy docs, FS-58 proxy hardening. **⏸ post-MVP** — Cloud Agent env notes (#60) unless required for MVP CI only (docs, no new paid env).

| # | PR | Ticket | Layer | Owner |
| --- | --- | --- | --- | --- |
| 1 | #49 | FS-31 | Frontend+API | Dev E + Marcus |
| 2 | #50 | FS-23 | BE+web | Dev H + Ben |
| 3 | #73 | FS-89 | BE | Sofia+Omar / Kai |
| 4 | #74 | FS-81 | Infra/worker | Diego+Hana / Ezra |
| 5 | #70 | FS-85 negatives | BE/tests | Sofia+Omar |
| 6 | *new* | FS-38 web hardening | Frontend | Dev D + Leo |
| 7 | *new* | FS-21 hold follow-up | BE+web | Dev F + Pair 3 |
| 8 | *new* | FS-58 proxy hardening | BE+web | Pair 3 |
| 9 | *new* | Cloud Agent env notes #60 | Docs | Iris |

**Balance:** 3 FE-facing, 4 BE, 2 infra/docs.

---

### Batch 8 — `BATCH-FS8-MEDIA-OFFLINE-007`

**Theme:** Tenant-safe media, offline sync UX, recovery drill evidence.  
**MVP lens (§0):** **P0** — Serve (FS-85/#69 after #70, FS-87 mobile contract, dispatch SSE fallback). **P1** — FS-83 drill **documentation** + CI checks. **⏸ post-MVP** — FS-82 capacity qualification, FS-9 copy-only if not on MVP launch checklist, FS-4 TrayLoop inventory refresh, worker shutdown polish unless blocking production MVP.

| # | PR | Ticket | Layer | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | #69 | FS-85 storage | BE | Sofia+Omar | **After #70**; migration **0024** |
| 2 | *new* | FS-87 mobile client contract | BE/docs | Priya+Leo | Consumes 0023 |
| 3 | *new* | FS-83 drill automation | Infra | Mila | Docs + CI checks only |
| 4 | *new* | FS-82 capacity qualification | QA+Platform | Ezra + Owen | Test plan + thresholds |
| 5 | *new* | FS-9 inquiry copy alignment | Frontend | Dev E + Designer 1 | FS-38 checklist |
| 6 | *new* | Dispatch SSE fallback | BE+web | Ben + Dev G | Per BUILD_LAYERS |
| 7 | *new* | Worker graceful shutdown follow-up | Infra | Diego | FS-79 related |
| 8 | *new* | FS-4 TrayLoop inventory refresh | Docs | Grace | Inform only |

---

### Batch 9 — `BATCH-FS9-RETENTION-BILLING-008`

**Theme:** **Repeat** lifecycle — loyalty/maintenance plans (FS-72); billing boundary docs; defer paid platform billing.  
**MVP lens (§0):** **P0** — FS-72 implementation from #54 spec (maintenance plans + reminders UI slice). **P1** — FS-88 operator→customer payments **boundary doc** (no new SKUs). **⏸ post-MVP / CoS gate** — FS-94 Renvani→operator billing, FS-94 migration, Stripe webhook matrix expansion, FS-35 pilot rubric (founder budget + Elena promotion required). FS-92 staging re-run after FS-85 stays **P1** security regression only.

| # | Work | Ticket | Layer | Owner |
| --- | --- | --- | --- | --- |
| 1 | Implement FS-72 from #54 spec | FS-72 | BE+worker+web | Pair 4 + Dev G | **P0 Repeat** |
| 2 | FS-94 Renvani→operator billing | FS-94 | BE+webhook | Priya+Leo / Aria | **⏸ §0 — CoS/founder budget** |
| 3 | FS-88 operator→customer payments boundary doc | FS-88 | Docs | Grace + Sam | **P1** |
| 4 | FS-94 migration | — | DB | Tech Lead | **⏸ §0 — no slot until gate** |
| 5 | Maintenance plan UI slice | FS-72 | Frontend | Dev E | **P0** |
| 6 | Stripe webhook matrix update | FS-94 | Infra/docs | Iris | **⏸ §0** |
| 7 | FS-92 staging re-run post-FS-85 | FS-92 | Tests | Kai | **P1** |
| 8 | FS-35 pilot rubric tie-in | FS-35 | Product | Elena | **⏸ post-MVP** |

**Balance:** 3 BE, 2 FE, 2 docs/infra, 1 product.

---

## 6. Notion board alignment (Ready / In Progress)

**Pulled 2026-10-22 UTC** from Field Service Build Board:

- **Ready (true):** FS-4 TrayLoop inventory, FS-6 design partners (GTM — **⏸ post-MVP** per §0; not in engineering batches 5–9 unless Elena + founder explicitly promote with CoS note).
- **In Progress / staged (Batch 4 carry):** FS-12, FS-13, FS-14, FS-17, FS-23, FS-31, FS-41, FS-53, FS-55.
- **Platform In Progress:** FS-75, FS-76, FS-80, FS-84, FS-92, FS-93 (In Review).

**PO action (Elena):** Set `CI Batch` on cards to `BATCH-FS5-FOUNDATION-004` … `BATCH-FS9-RETENTION-BILLING-008` as batches dispatch; tag each card with lifecycle stage (**Discover / Book / Serve / Repeat**) and **MVP P0 vs ⏸ post-MVP** per §0; keep FS-6/FS-4/FS-94 out of merge trains unless founder + CoS budget path is satisfied.

---

## 7. Dependencies (do not merge out of order)

```mermaid
flowchart TD
  B5[Batch 5 FS-93 docs + platform]
  B6[Batch 6 migrations 0018-0023 + control plane]
  B7[Batch 7 revenue schedule FE]
  B8[Batch 8 FS-85 0024 + offline]
  B9[Batch 9 FS-72 Repeat FS-94 gated]
  B5 --> B6
  B6 --> B7
  B7 --> B8
  B8 --> B9
  P70[#70 FS-85 negatives] --> P69[#69 FS-85 storage]
  P59[#59 FS-93] --> P76[#76 deploy doc]
```

---

## 8. Autonomous execution start (Grace — immediate)

1. **Apply §0 on every batch:** MVP P0 merges before ⏸ post-MVP; any paid vendor → stop and flag E.. CoS (do not provision).
2. **Batch 5:** Chase Security + Reviewer + QA sign-offs on #59, #76, #54; confirm #75 renumber commit on #75; hold #69.
3. **Parallel prep:** Batch 6 owners rebase **via new commits** onto post–Batch-5 `dev` (no force-push); declare migration slots in PR bodies.
4. **Migration registry:** Land registry from #59 with Batch 5; update **0024+** reservations as PRs open; **no FS-94 migration** until §0 founder gate.
5. **Do not** provision staging or cloud resources until Shaun OK (FS-75 remains design/matrix).
6. **Elena sync:** After §0 lands in this doc, PO confirms MVP P0 list per batch in Notion before Batch 7+ scope expands.

---

## 9. Document history

| Date | Change |
| --- | --- |
| 2026-10-22 | Initial Batches 5–9 plan — Grace + Elena (founder 5:26 PM CT standing orders) |
| 2026-10-22 | Notion: [Batches 5–9 plan](https://app.notion.com/p/401317b92d1581f7bf59f91174e32f43); docs PR [#78](https://github.com/SimonShaun2/Renvani/pull/78) |
| 2026-10-22 | §0 Founder MVP-first / cost policy (6:24 PM CT) — lifecycle map, paid-vendor gate, batch P0/⏸ labels, Elena cut-line; FS-94 deferred pending CoS/founder budget |
