import { z } from "zod";

import { STAFF_SESSION_CONTRACT_VERSION } from "./constants.js";

export { STAFF_SESSION_CONTRACT_VERSION };

const uuidSchema = z.string().uuid();

/** Roles enforced server-side on each request (see authenticate plugin). */
export const staffUserRoleSchema = z.enum([
  "owner",
  "admin",
  "dispatcher",
  "office",
  "technician"
]);

export type StaffUserRole = z.infer<typeof staffUserRoleSchema>;

/**
 * Authoritative staff principal attached to a request after authentication.
 * Company scope is always taken from persisted membership, not from client body.
 */
export const staffSessionPrincipalV1Schema = z.object({
  contractVersion: z.literal(STAFF_SESSION_CONTRACT_VERSION),
  userId: uuidSchema,
  companyId: uuidSchema,
  role: staffUserRoleSchema,
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

export type StaffSessionPrincipalV1 = z.infer<typeof staffSessionPrincipalV1Schema>;

/**
 * Minimal access-token claims for the current JWT implementation.
 * `role` in the token is not authoritative; servers must load role from the database.
 */
export const staffAccessTokenClaimsV1Schema = z.object({
  userId: uuidSchema,
  companyId: uuidSchema,
  role: z.string().min(1),
  tokenType: z.literal("access")
});

export type StaffAccessTokenClaimsV1 = z.infer<typeof staffAccessTokenClaimsV1Schema>;

export const staffRefreshTokenClaimsV1Schema = z.object({
  userId: uuidSchema,
  companyId: uuidSchema,
  tokenType: z.literal("refresh")
});

export type StaffRefreshTokenClaimsV1 = z.infer<typeof staffRefreshTokenClaimsV1Schema>;

/**
 * Lifecycle states for future invite/activation work (FS-93 / membership ADR).
 * Not persisted in v0.1 — documentation and test oracles only.
 */
export const staffAccountLifecycleStateSchema = z.enum([
  "active",
  "inactive",
  "invite_pending",
  "invite_expired",
  "suspended"
]);

export type StaffAccountLifecycleState = z.infer<typeof staffAccountLifecycleStateSchema>;

/** Maps current `users.isActive` to the nearest lifecycle state (single-company membership). */
export function mapIsActiveToLifecycleState(isActive: boolean): StaffAccountLifecycleState {
  return isActive ? "active" : "inactive";
}
