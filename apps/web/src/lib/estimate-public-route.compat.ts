/**
 * FS-36 — public vs private estimate URL contract (web).
 *
 * Canonical public customer approval path: `/approve/:approvalToken`
 * Authenticated staff estimate detail: `/estimates/:estimateId` (UUID)
 *
 * Compatibility (deliberate, Security-reviewed):
 * - Legacy outbound links used `/estimates/:approvalToken` while the app also maps
 *   `/estimates/:param` to the private detail route. Middleware cannot infer token vs
 *   estimate id from the path segment alone (approval tokens are base64url, not UUID-shaped).
 * - We do NOT add a catch-all redirect from `/estimates/:segment` → `/approve/:segment`.
 *   That would risk hijacking valid private URLs or exposing the wrong surface.
 * - Generators (`buildEstimatePublicPath`, notification `approvalUrl`) emit `/approve/...` only.
 * - Already-delivered emails/SMS with the old path: customers must use a newly sent link
 *   (resend estimate) unless product later adds an explicit, token-validated redirect
 *   (e.g. API lookup), which is out of scope for this narrow route fix.
 */
export const ESTIMATE_PUBLIC_APPROVAL_PATH_PREFIX = "/approve";
