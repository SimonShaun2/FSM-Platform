# GITHUB_WORKFLOW.md

**Authority:** Master Directive §56, §57, §58, §59 · **Owner:** DO-01

How work moves through GitHub. Project state lives in the repository, never in conversation.

---

## 1. Structure

**Milestones** — one per sprint, Sprint 0 through Sprint 22.
**Issues** — one per `FSM-NNNN` ticket, using the §54 issue template.
**Project views** — Backlog · Ready · In Progress · Design Review · Peer Review · QA ·
Blocked · Ready to Merge · Done · Release Candidate.

Full label taxonomy is specified in FSM-0013.

---

## 2. Branches

```
main                          protected · PR required · CI required · no direct push
feature/FSM-NNNN-short-slug   one branch per ticket
fix/FSM-NNNN-short-slug       defect remediation
release/vX.Y.Z                release candidates
```

Branch names carry the ticket ID so work is traceable from branch to issue to PR to changelog.

---

## 3. Readiness Is Computed

A ticket is `Ready` when every dependency is `Done` — never because someone decided it was.
On merge, the dependency graph is recalculated and newly unblocked tickets become `Ready`
and are assigned to their owning role.

Owners pick up `Ready` work in priority order without waiting for instruction.

---

## 4. Pull Requests

Every PR must state:

1. Ticket ID and link
2. Self-review checklist confirmation (`CODEX.md` §6)
3. Shared contract changes, with affected consumers — or explicitly "none"
4. Test evidence
5. Observability added
6. Peer reviewer
7. QA owner

A PR with no ticket is rejected. Approval follows the risk-based matrix in `TEAM.md` §5.
The reviewer must never be the implementation owner.

---

## 5. CI Gates

Tiered per FSM-0010:

| Tier | Trigger | Contents | Budget |
|---|---|---|---|
| 1 | Every commit | Format · lint · typecheck · unit tests · affected build · governance terminology check | < 5 min |
| 2 | Every PR | Integration tests · migration validation · tenant isolation suite · dependency audit · secret scanning · full build | < 15 min |
| 3 | Pre-merge to `main` | E2E · accessibility · performance · API contract tests | < 30 min |
| 4 | Release | Full regression · security scan · artifact generation · release certification | Untimed |

Do not run every expensive suite on every trivial commit. Use intelligent gates that provide
equivalent safety.

---

## 6. Automated Progression

When all required checks pass, without founder confirmation:

1. Merge the PR
2. Close the issue
3. Update `PROJECT_STATE.md`
4. Update `CHANGELOG.md`
5. Update ticket status
6. Recalculate the dependency graph
7. Unlock newly available work
8. Assign next work to the correct persistent owner
9. Continue execution

Stop only for the five conditions in `TEAM.md` §6.

---

## 7. Cross-Team Notification

Changing a shared interface — API contract, schema, event contract, queue payload, design
token, payment contract, feature flag, authentication behaviour — requires, in the PR: the
versioned change, the owner, known consumers, tests, and a migration plan where required.

Notification happens through the PR and the contract file. Not through chat.

---

## 8. Releases

Release branch cut from `main` → Tier 4 gates → certification by TL-01, QA-03 and DevOps →
tag → deploy per `RELEASE_RUNBOOK.md` → `CHANGELOG.md` updated → `PROJECT_STATE.md` updated.

Destructive production operations require founder authorisation. Everything else proceeds
under the team's granted authority.
