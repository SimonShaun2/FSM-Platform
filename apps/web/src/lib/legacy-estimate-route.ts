/**
 * FS-36 D3 — GET-only legacy `/estimates/:approvalToken` recovery (middleware).
 * Validates tokens via the same public API as the customer page before redirecting.
 */

export const LEGACY_ESTIMATE_RESERVED_SEGMENTS = new Set(["new"]);

/** RFC 4122 UUID path segment (staff estimate id). */
const RFC4122_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Matches `randomBytes(24).toString("base64url")` (32 chars) with schema headroom to 100. */
const APPROVAL_TOKEN_SHAPE = /^[A-Za-z0-9_-]{32,100}$/;

export type LegacyEstimateGetPathClass =
  | { kind: "not-legacy" }
  | { kind: "staff-estimate" }
  | { kind: "reserved" }
  | { kind: "invalid-token-shape" }
  | { kind: "legacy-token"; token: string };

export function isRfc4122UuidSegment(segment: string): boolean {
  return RFC4122_UUID.test(segment);
}

export function isEstimateApprovalTokenShape(segment: string): boolean {
  if (isRfc4122UuidSegment(segment)) {
    return false;
  }

  return APPROVAL_TOKEN_SHAPE.test(segment);
}

export function classifyLegacyEstimateGetPath(pathname: string): LegacyEstimateGetPathClass {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length !== 2 || segments[0] !== "estimates") {
    return { kind: "not-legacy" };
  }

  const segment = segments[1];

  if (LEGACY_ESTIMATE_RESERVED_SEGMENTS.has(segment)) {
    return { kind: "reserved" };
  }

  if (isRfc4122UuidSegment(segment)) {
    return { kind: "staff-estimate" };
  }

  if (!isEstimateApprovalTokenShape(segment)) {
    return { kind: "invalid-token-shape" };
  }

  return { kind: "legacy-token", token: segment };
}

export function getPublicApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

/** True only when the public estimate exists and is eligible (same as GET public API 2xx). */
export async function isPublicEstimateTokenValid(apiBaseUrl: string, token: string): Promise<boolean> {
  const url = `${apiBaseUrl}/api/v1/public/estimates/${encodeURIComponent(token)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    return response.ok;
  } catch {
    return false;
  }
}

export type LegacyEstimateGetRecovery =
  | { action: "continue" }
  | { action: "redirect-approve"; token: string }
  | { action: "rewrite-approve"; token: string }
  | { action: "not-found" };

/**
 * Middleware recovery decision for GET `/estimates/:segment` (legacy customer links).
 * Tech Lead / Security: network or API errors fail closed (no 307).
 */
export async function resolveLegacyEstimateGetRecovery(
  pathname: string,
  apiBaseUrl: string
): Promise<LegacyEstimateGetRecovery> {
  const classified = classifyLegacyEstimateGetPath(pathname);

  switch (classified.kind) {
    case "not-legacy":
    case "staff-estimate":
    case "reserved":
      return { action: "continue" };
    case "invalid-token-shape":
      return { action: "not-found" };
    case "legacy-token": {
      const valid = await isPublicEstimateTokenValid(apiBaseUrl, classified.token);

      if (valid) {
        return { action: "redirect-approve", token: classified.token };
      }

      return { action: "rewrite-approve", token: classified.token };
    }
    default:
      return { action: "continue" };
  }
}
