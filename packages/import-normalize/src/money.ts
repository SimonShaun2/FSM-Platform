import { Decimal } from "decimal.js";

const MONEY_SANITIZE = /[^0-9.-]/g;

/**
 * Normalizes currency strings to a fixed two-decimal string (no currency symbol).
 */
export function normalizeImportMoney(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const cleaned = trimmed.replace(MONEY_SANITIZE, "");
  if (cleaned.length === 0 || cleaned === "-" || cleaned === ".") {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed.toFixed(2);
}

/**
 * Parses import money into a non-negative Decimal for ledger math.
 */
export function parseImportMoney(value: string): Decimal | null {
  const trimmed = value.trim().replace(/[$,]/gu, "");
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new Decimal(trimmed);
    if (!parsed.isFinite() || parsed.isNegative()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function formatImportMoney(value: Decimal): string {
  return value.toFixed(2);
}
