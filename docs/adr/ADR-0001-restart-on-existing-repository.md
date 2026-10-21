# ADR-0001: Restart On Existing Repository

**Status:** Accepted
**Owner:** TL-01
**Date:** 2026-08-21
**Supersedes:** None
**Superseded by:** None

---

## Problem

The project is being restarted as FSM Platform V2, but the existing repository already contains substantial product work, documentation, migrations, and ticket history. Starting fresh would reduce immediate confusion but would also discard useful implementation context and make it harder to audit what has already been built.

## Current Approach

The existing repository `SimonShaun2/Renvani` (formerly `SimonShaun2/FSM-Platform`) remains the only repository with the committed Phase 1 through Phase 3 work. The local founder-machine working tree also contains uncommitted and unrelated material that must be reconciled during Sprint 0.

## Proposed Approach

Restart on the existing repository, preserve history, and perform Sprint 0 as a mandatory audit and rebaseline phase before new V2 feature work begins.

## Benefit

This preserves implementation history, avoids losing useful code, and forces all keep/refactor/replace/remove decisions to be evidence-based rather than memory-based.

## Migration Cost

The cost is a Sprint 0 audit, repository reconciliation, governance rewrite, schema inventory, route inventory, frontend inventory, worker inventory, test baseline, dependency audit, security review, and final rebaseline decision.

## Operational Impact

The team must treat `origin/main` as incomplete until FSM-0001 is resolved. Work proceeds through auditable branches and PRs instead of direct pushes.

## Security Impact

Repository history and local working-tree files must be scanned for credentials, key material, tenant data, and unrelated project leakage. Any confirmed secret requires rotation before history rewriting is considered.

## Alternatives Considered

- Start a new repository: rejected because it hides useful history and makes reuse decisions guesswork.
- Continue without an audit: rejected because stale documentation and uncommitted local work make the baseline untrustworthy.

## Decision

FSM Platform V2 restarts on the existing `SimonShaun2/Renvani` repository (same history as `FSM-Platform`). Git history is preserved. Sprint 0 is mandatory and blocks new V2 feature work. The prior four-agent model and "thinner system, smarter brain" product boundary are retired in favor of the permanent team model and "Complete when needed. Simple by default."

## Consequences

All existing code must be classified during Sprint 0 before it is trusted. Governance, tickets, project state, and workflow documents must live in the repository rather than chat memory.
