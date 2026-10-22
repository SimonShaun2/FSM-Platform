import { AppError, ErrorCode } from "../errors.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "metadata.google.internal"
]);

const PRIVATE_IPV4_PATTERN =
  /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|0\.)/u;

export function normalizeGrowthCheckTargetUrl(rawUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "targetUrl must be a valid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "targetUrl must use http or https");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new AppError(ErrorCode.FORBIDDEN, "targetUrl hostname is not allowed");
  }

  if (PRIVATE_IPV4_PATTERN.test(hostname)) {
    throw new AppError(ErrorCode.FORBIDDEN, "targetUrl hostname is not allowed");
  }

  return parsed;
}

export function assertFetchUrlAllowedForScan(targetOrigin: URL, fetchUrl: string): URL {
  const resolved = new URL(fetchUrl, targetOrigin);
  const normalizedTarget = normalizeGrowthCheckTargetUrl(targetOrigin.toString());

  if (resolved.origin !== normalizedTarget.origin) {
    throw new AppError(ErrorCode.FORBIDDEN, "Fetch URL must stay on the scan target origin");
  }

  return resolved;
}
