# FS-4 — TrayLoop pattern reuse inventory (read-only)

**Status:** Inform FS-40 / adapter ADRs — **not** approved for blind port  
**Source repo:** `SimonShaun2/SimonShaun2` branch `dev/trayloop` (external; verify head at port time)  
**Renvani SoR:** [ADR-FS-41](../adr/ADR-FS-41-renvani-sor-integrations-addendum.md) — CSV/import-first; no live FSM competitor sync

| TrayLoop pattern | Renvani target | Disposition | FS owner |
| --- | --- | --- | --- |
| Quote / direct storefront flow | Revenue agent + FS-17 intake | **Adapt** via contracts | FS-17, FS-31 |
| Consent + outbound guard | FS-13 / FS-8 | **Adapt** — Security gate | FS-13, FS-8 |
| Approval + audit trail | Agent control plane + FS-14 | **Adapt** | FS-12, FS-14 |
| AI sales / follow-up copy | `packages/ai` + human review | **Adapt** — no autonomous send | FS-11+ |
| Growth Advisor metrics | Owner agent / FS-76 | **Evaluate** | Pair 5 |
| Payment / tenant wiring | Stripe Connect in Renvani | **Do not copy** — use Renvani webhook + ADR-0003 | FS-88, FS-94 |

**Rule:** Each **Keep/Adapt/Discard** needs TL + Security on the FS board before implementation. TrayLoop tandem WIP rules do not override Renvani `GITHUB_WORKFLOW.md`.
