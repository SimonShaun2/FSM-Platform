import { normalizeImportText } from "./text.js";

/**
 * Strips formatting and returns digits-only phone strings for dedupe keys.
 */
export function normalizeImportPhone(value: string | null | undefined): string | null {
  const normalized = normalizeImportText(value);

  if (!normalized) {
    return null;
  }

  const digitsOnly = normalized.replace(/\D+/gu, "");
  return digitsOnly.length > 0 ? digitsOnly : null;
}
