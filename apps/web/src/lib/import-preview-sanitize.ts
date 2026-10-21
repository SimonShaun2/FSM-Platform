import { sanitizeSpreadsheetCell } from "@fsm/types";

/**
 * Defense-in-depth for CSV import UI: strip markup and neutralize spreadsheet formulas
 * before rendering preview / sample cells as text.
 */
export function sanitizeImportPreviewCell(value: string | null | undefined): string {
  const withoutMarkup = sanitizeSpreadsheetCell(value).replace(/<[^>]*>/gu, "");
  return withoutMarkup;
}
