import { ErrorCode } from "./errors.js";

/**
 * Maps {@link ErrorCode} to HTTP status for API responses (ADR-FS-3 U5 / FS-37).
 */
export function getHttpStatusForErrorCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.UNAUTHORIZED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.POLICY_DENIED:
      return 403;
    case ErrorCode.VALIDATION_ERROR:
      return 400;
    case ErrorCode.CONFLICT:
      return 409;
    case ErrorCode.CONSENT_REQUIRED:
      return 409;
    case ErrorCode.INTERNAL_ERROR:
      return 500;
  }
}
