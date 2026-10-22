const RETRYABLE_POSTGRES_CODES = new Set(["40001", "40P01", "55P03"]);

function readPostgresErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function readPostgresErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return "";
}

export function isRetryablePostgresError(error: unknown): boolean {
  const code = readPostgresErrorCode(error);
  if (code && RETRYABLE_POSTGRES_CODES.has(code)) {
    return true;
  }

  const message = readPostgresErrorMessage(error).toLowerCase();
  return message.includes("deadlock") || message.includes("serialization failure") || message.includes("could not serialize");
}
