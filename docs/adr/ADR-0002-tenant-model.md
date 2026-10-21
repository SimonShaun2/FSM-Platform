# ADR-0002: Tenant Model

**Status:** Proposed
**Owner:** TL-01
**Date:** 2026-08-21
**Supersedes:** None
**Superseded by:** None
**Blocks:** Sprint 2

---

## Problem

FSM Platform V2 must support owner-operators, small teams, multi-crew businesses, multi-location businesses, and larger organizations without rebuilding tenant isolation later.

## Current Approach

The current codebase primarily scopes records by `companyId`. Sprint 0 has not yet completed schema, route, service, and security inventories, so the actual isolation guarantees are not fully verified.

## Proposed Approach

Use FSM-0011 and FSM-0009 findings to decide the accepted tenant model. The decision must cover organization, business unit, location, role, permission, and support-impersonation boundaries.

## Benefit

A recorded tenant model gives every future route, query, worker job, integration, and report a shared isolation contract.

## Migration Cost

Unknown until FSM-0004, FSM-0009, and FSM-0011 are complete. The decision may require schema changes, migration scripts, test fixtures, and tenant-isolation regression tests.

## Operational Impact

The accepted model will constrain auth middleware, service signatures, background job payloads, logging, support workflows, and analytics.

## Security Impact

This is a security-critical decision. It determines cross-tenant access guarantees, authorization boundaries, and adversarial test coverage. QA-02 must review before acceptance.

## Alternatives Considered

- Keep `companyId` only.
- Add organization plus location hierarchy.
- Add organization, business units, locations, and custom roles.
- Defer hierarchy until customers request it.

## Decision

Proposed only. This ADR must not be marked accepted until FSM-0011 supplies domain-model evidence and FSM-0009 supplies security findings.

## Consequences

Sprint 2 cannot begin until this ADR is accepted. Any interim tenant-related code should be treated as provisional and must not make irreversible schema assumptions.
