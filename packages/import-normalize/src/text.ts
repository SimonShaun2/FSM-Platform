import { sanitizeSpreadsheetCell } from "@fsm/types";

export function normalizeImportText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = sanitizeSpreadsheetCell(value.trim());
  return trimmed.length > 0 ? trimmed : null;
}
