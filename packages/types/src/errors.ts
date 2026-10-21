export enum ErrorCode {
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CONFLICT = "CONFLICT",
  /** FS37-NT-08 — outbound/channel consent not satisfied */
  CONSENT_REQUIRED = "CONSENT_REQUIRED",
  /** FS37-NT-07, FS37-NT-11 — tool or approval policy blocked */
  POLICY_DENIED = "POLICY_DENIED",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly fields: Record<string, string> | undefined;

  public constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fields = fields;
  }
}
