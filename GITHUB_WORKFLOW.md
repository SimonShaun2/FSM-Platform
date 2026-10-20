# GITHUB_WORKFLOW.md

**Authority:** Founder FSM direction, TEAM.md and the [Field Service Build Board](https://app.notion.com/p/74b3a1145d3f49d586ac6cdbf174ceb2). **Owner:** Platform 1 with Technical Lead and Gayle. This replaces the unmerged draft's automatic per-commit/per-PR CI and auto-merge provisions.

## 1. Traceability and readiness

A ticket carries acceptance, dependencies, risk, pair ownership, split, contract/consumers, evidence, PR, exact head, batch, gate verdict and next action. The current Notion board is the execution queue; legacy FSM-NNNN GitHub issues and the older V2 sprint plan need explicit mapping rather than silent substitution. A dependency-cleared ticket becomes Ready after Product Owner and Technical Lead contract/risk acceptance, not merely because a status formula says Done. One In Progress ticket and at most two waiting PRs per pair; fixes first. Open drafts stay In Progress.

## 2. Branches

Main is protected and is not a direct-write workspace. The official FSM integration branch, protection and how existing PR #1 (currently based on main) is retargeted are a pending governance decision. Until resolved, keep PR #1 draft and do not merge it into main. Do not infer a branch name from TrayLoop. Feature/fix branches identify the board ticket, branch point and merge order. No rebase, force-push or direct push to an integration or production branch.

## 3. Tandem PR packet

The Product Owner specifies acceptance and non-goals. Two senior developers on the same ticket agree a versioned contract, consumer list, file/section ownership, test ownership and merge order before code. Partners edit different files or meaningful test/oracle/docs slices, cross-review, and report combined local commands/results. Every PR states ticket, base/head SHA, shared contracts and migration, self-review, observability, independent reviewer, assigned QA, Security need and batch membership. A chat claim or a local artifact in an isolated Cursor VM is not a shared handoff. The reviewer cannot be an implementer.

## 4. CI batches and exact-head gate

CI is only initiated through an **approved batch**. Before the single authorized run, record exact batch membership, PR heads, integration ancestry, expected commands, budget/time limit and owner. No standalone per-commit, per-PR or draft CI. Platform records the run URL and conclusion at that head. A local green test is not CI. Do not use an automated merge-on-green path.

QA posts reproducible commands, output and UI evidence against the exact head. The distinct reviewer covers code and shared contract. Security signs high-risk tenant, auth, consent, agent action, payment or gate authority changes. Design accepts material UX. Technical Lead accepts architecture contracts. Gayle issues a derived exact-head PASS only after all required evidence and approved batch CI. A new head invalidates affected sign-offs; a failed gate creates a bounded fix card for the original pair and fresh review. A comment labeled PASS cannot publish or substitute for a protected gate.

## 5. Integration, completion and release

After Gayle PASS, the authorized integration merge updates the board and repository state with exact merge SHA and evidence. Done means the approved implementation is merged to the integration branch and acceptance is met. Production is a separate founder promotion with release certification by Technical Lead, QA 4, Platform and Security by risk. No deployment, Vercel or public website setup from these tickets. Live payments and Stripe are deferred to the end and require separate founder authorization.

The Chief of Staff observes Cursor, GitHub and Notion evidence, fills the next dependency-cleared pair capacity, and maintains reviewer/QA/Design/Platform work. Do not claim a session is still executing merely because its chat exists.
