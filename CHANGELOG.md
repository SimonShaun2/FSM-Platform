# Changelog

All notable repository-level changes are recorded here.

## Unreleased

### Changed

- 2026-10-21: E.. CoS operating model — `dev` integration branch, `main` promotion-only, peer/QA/Security/batch CI then E.. CoS merge; retired Gayle gate language in controlling docs.

### Added

- FSM-0001 repository reconciliation audit under `docs/audit/REPOSITORY-RECONCILIATION.md`.
- Sprint 0 control documents: `PROJECT_STATE.md`, `TEAM.md`, `SPRINT_ROADMAP.md`,
  `GITHUB_WORKFLOW.md`, and `tickets/`.
- FSM-0013 GitHub project infrastructure record under
  `docs/audit/GITHUB-PROJECT-INFRASTRUCTURE.md`.
- FSM-0014 ADR process, template, and initial ADR records under `docs/adr/`.
- GitHub issue and pull request templates under `.github/`.
- Restored annotated milestone tag `v1.0.0` on the Phase 1 boundary commit.

### Changed

- FS-1 Reviewer 1 governance remediation: `tickets/INDEX.md`, `WORKFLOW.md`, audit/control docs, `docs/reference/WORKFLOW/*` (reconciliation register, repo canonical name `SimonShaun2/Renvani`, finalized integration/batch CI packet, proposed `BATCH-FS1-GOV-001` registry).
- Updated `AGENTS.md` and `CODEX.md` to the FSM Platform V2 operating model.
- Tightened `.gitignore` for local caches, environment files, generated artifacts, and build output.
