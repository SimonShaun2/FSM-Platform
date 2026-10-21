const PUBLIC_API_PREFIX = "/api/v1/public";

const ENCODED_DOT_SEGMENT = /^(?:\.|%2e|%2E)$/i;
const ENCODED_DOT_DOT_SEGMENT = /^(?:\.{2}|%2e%2e|%2E%2E|%2e%2E|%2E%2e)$/i;

export function isPublicApiProxyPath(pathname: string): boolean {
  return pathname === PUBLIC_API_PREFIX || pathname.startsWith(`${PUBLIC_API_PREFIX}/`);
}

function segmentIsTraversal(segment: string): boolean {
  if (ENCODED_DOT_DOT_SEGMENT.test(segment)) {
    return true;
  }

  if (ENCODED_DOT_SEGMENT.test(segment)) {
    return true;
  }

  let decoded = segment;

  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return true;
  }

  return decoded === ".." || decoded === ".";
}

function haystackHasTraversal(haystack: string): boolean {
  if (haystack.includes("\\") || haystack.includes("..")) {
    return true;
  }

  if (/%2e%2e/i.test(haystack)) {
    return true;
  }

  let decodedPath = haystack;

  try {
    decodedPath = decodeURI(haystack);
  } catch {
    return true;
  }

  if (decodedPath.includes("..")) {
    return true;
  }

  const segments = haystack.split("/").filter(Boolean);

  return segments.some(segmentIsTraversal);
}

/**
 * Reject path traversal on the Next.js public API proxy prefix (Security follow-up).
 */
export function hasPublicApiPathTraversal(pathname: string): boolean {
  if (!isPublicApiProxyPath(pathname)) {
    return false;
  }

  return haystackHasTraversal(pathname);
}

/** Middleware: also inspect raw request URL (Next may normalize pathname). */
export function hasPublicApiPathTraversalInRequest(requestUrl: string, pathname: string): boolean {
  if (!isPublicApiProxyPath(pathname) && !requestUrl.includes("/api/v1/public")) {
    return false;
  }

  return haystackHasTraversal(pathname) || haystackHasTraversal(requestUrl);
}

export function assertSafePublicApiRequestPath(path: string): void {
  if (!path.startsWith(`${PUBLIC_API_PREFIX}/`)) {
    return;
  }

  if (hasPublicApiPathTraversal(path)) {
    throw new Error("Invalid public API path");
  }
}
