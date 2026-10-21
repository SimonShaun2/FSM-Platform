# ADR-0003: Stripe Connect Charge Model

**Status:** Proposed
**Owner:** BE-02 / TL-01
**Date:** 2026-08-21
**Supersedes:** None
**Superseded by:** None
**Blocks:** Sprint 8

---

## Problem

The platform must choose how Stripe Connect charges flow between customers, connected service businesses, and the platform. This affects merchant of record, dispute liability, refund behavior, reporting, taxes, platform economics, and connected-account experience.

## Current Approach

The current codebase uses Stripe Connect concepts, but Sprint 0 has not yet completed payment architecture and security review. Founder and possibly legal input is required before the model is accepted.

## Proposed Approach

Evaluate direct charges, destination charges, and separate charges and transfers before Sprint 8. Choose the model that best matches the intended business structure and liability posture.

## Benefit

A recorded charge model prevents payment flows from being implemented inconsistently across invoices, memberships, deposits, refunds, disputes, and reporting.

## Migration Cost

Potentially high. A model change can require database changes, webhook changes, Stripe account configuration changes, migration of payment metadata, updated accounting reports, and revised operational runbooks.

## Operational Impact

The decision affects onboarding, Stripe dashboard behavior, payout monitoring, dispute response, refund handling, reconciliation, and support.

## Security Impact

The accepted model must preserve webhook idempotency, prevent cross-tenant payment updates, avoid manual payment state mutation outside trusted webhook flows, and avoid exposing payment credentials.

## Alternatives Considered

- Direct charges on connected accounts.
- Destination charges from the platform.
- Separate charges and transfers.
- Delay Stripe Connect depth and use a simpler temporary payment model.

## Decision

Proposed only. Founder input is required on merchant-of-record posture and dispute/refund liability. Legal review may be required before acceptance.

## Consequences

Sprint 8 payment work is blocked until this ADR is accepted. Any payment code before then must avoid locking the system into a charge model that cannot be migrated safely.
