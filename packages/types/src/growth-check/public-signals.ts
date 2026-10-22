import type { GrowthCheckFindingConfidence, GrowthCheckFindingStatus } from "./types.js";

export interface PublicSignalEvaluation {
  status: GrowthCheckFindingStatus;
  confidence: GrowthCheckFindingConfidence;
  summary: string;
}

export function evaluatePublicHttpSignal(signalId: string, html: string, statusCode: number): PublicSignalEvaluation {
  if (statusCode < 200 || statusCode >= 400) {
    return {
      status: "fail",
      confidence: "high",
      summary: `HTTP response status ${statusCode}`
    };
  }

  const lower = html.toLowerCase();

  switch (signalId) {
    case "https_reachable":
      return {
        status: "pass",
        confidence: "high",
        summary: "Homepage responded successfully"
      };
    case "html_title_present":
      return /<title>[^<]+<\/title>/iu.test(html)
        ? { status: "pass", confidence: "high", summary: "Title element present" }
        : { status: "warning", confidence: "medium", summary: "Title element missing" };
    case "contact_pattern_present":
      return /(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|contact)/iu.test(html)
        ? { status: "pass", confidence: "medium", summary: "Contact pattern detected on page" }
        : { status: "warning", confidence: "low", summary: "No obvious contact pattern detected" };
    case "booking_cta_present":
      return /(book\s+now|schedule|get\s+a\s+quote|request\s+service)/iu.test(lower)
        ? { status: "pass", confidence: "medium", summary: "Booking-related call-to-action language found" }
        : { status: "warning", confidence: "low", summary: "No booking call-to-action language detected" };
    default:
      return {
        status: "unknown",
        confidence: "low",
        summary: "Signal not implemented"
      };
  }
}

export function evaluatePrivateOpsCheck(label: string): PublicSignalEvaluation {
  return {
    status: "unknown",
    confidence: "low",
    summary: `${label} requires private operational data and is not evaluated in a public scan`
  };
}
