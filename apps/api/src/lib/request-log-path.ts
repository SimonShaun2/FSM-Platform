/**
 * Request URLs for structured logs must not include secrets (e.g. SSE `access_token` query).
 */
export function requestPathForLog(rawUrl: string): string {
  const questionIndex = rawUrl.indexOf("?");
  if (questionIndex === -1) {
    return rawUrl;
  }

  return rawUrl.slice(0, questionIndex);
}

export function redactAccessTokenInUrl(rawUrl: string): string {
  const questionIndex = rawUrl.indexOf("?");
  if (questionIndex === -1) {
    return rawUrl;
  }

  const pathname = rawUrl.slice(0, questionIndex);
  const query = rawUrl.slice(questionIndex + 1);
  const params = new URLSearchParams(query);

  if (params.has("access_token")) {
    params.set("access_token", "[REDACTED]");
  }

  const redactedQuery = params.toString();
  return redactedQuery.length > 0 ? `${pathname}?${redactedQuery}` : pathname;
}
