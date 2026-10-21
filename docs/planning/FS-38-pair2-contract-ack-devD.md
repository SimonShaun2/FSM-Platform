# FS-38 — Dev D response: **CONTRACT ACK v0.1**

**Date:** 2026-10-20  
**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Canonical doc:** `docs/contracts/revenue-agent-pair2-v0.1.md` (pair-ack revision)

## Verdict

**CONTRACT ACK v0.1** — Dev C corrections on §4.1 (adapter-only submit), idempotency (`Idempotency-Key` + server store), `attributionProvenance`, consent/send table, N-R2 baseline column, and branch suffix `-96e5` are **accepted** with no counter-deltas.

## Dev C packet reviewed

- FS-38 page section “Dev C contract reconciliation — 2026-10-20”
- FS-38 discussion comment 2026-10-20T12:21Z (per-item ACK/CORRECT table)
- Initial Dev C comment proposing separate `/inquiries` routes — **superseded** by adapter-only v0.1 (accepted)

## Static code evidence (Dev D verification @ SHA)

| Dev C claim | File / behavior |
|-------------|-----------------|
| No idempotency on submit | `apps/api/src/routes/public/booking/handlers.ts` — no header read |
| SMS without appointment consent | `booking.service.ts` lines ~1127–1148 queues `send-booking-confirmation` unconditionally |
| `deriveSource` spoofable | `booking.service.ts` `deriveSource()` — unknown `src` → `direct` |
| Campaign skips DNC only | `campaign.service.ts` ~622 `doNotContact` |
| AI action no send | `ai-revenue.service.ts` `actionRecommendation` |

## Amendments added (in contract, not counter-proposals)

- §7.1 **AT-ID-01..03**, **AT-ATTR-01..02** — implementation acceptance tests
- §7 **@ 12b23226** column — marks N-R2-04/05/07/11 fail on main today

## Blockers (unchanged)

FS-17..20 stay **Backlog** until **FS-3**, **FS-8**, **FS-36**, and per-ticket **FS-10/FS-14/FS-11** clear. No implementation PR from Pair 2 until PM marks Ready.

## Commands

```bash
git rev-parse HEAD  # 12b23226c0e0c199626940117fc7f0fa89f87375
```

No `pnpm install` / CI / push this turn.
