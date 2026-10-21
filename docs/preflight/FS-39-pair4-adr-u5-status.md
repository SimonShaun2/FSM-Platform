# ADR-FS-3 U5 — Pair 4 preflight reference (not ADR closure)

**ADR commit cited:** `095aef90ade8d3d8fa035295243af911831d409d` (`docs/adr/ADR-FS-3-v1-v2-schema-and-governance.md` on FS-3 branch)

**What is true today:**

1. The ADR file at that commit still shows **Status: Proposed** and **FS-3 is not merged** to protected `dev`.
2. **Product Owner** (agent `bc-0da9c117`) and **Security** (agent `bc-3826ae19`) **ACK'd U5** (the `ErrorCode` extension table) in **[PR #19 review comments](https://github.com/SimonShaun2/Renvani/pull/19)** — that is **review acknowledgment**, not ADR merge or FS-3 Done.
3. Pair 4 FS-39 docs map approve/execute failures to the **proposed U5 table** as **preflight spec only** until FS-3 merges and FS-37 lands the enum in `@fsm/types`.

**Do not claim:** ADR closure, FS-3 merged, or runtime `POLICY_DENIED` / `CONSENT_REQUIRED` in production API until those gates clear.
