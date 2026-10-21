/**
 * Neutralize spreadsheet formula injection (=, +, -, @, tab, CR) for storage and CSV export.
 * @see docs/contracts/fsm.data-import.v1.md
 */
export function sanitizeSpreadsheetCell(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const withoutCr = value.replace(/\r/g, "");
  if (/^[\t]*[=+\-@]/.test(withoutCr)) {
    return `'${withoutCr}`;
  }

  return withoutCr;
}

export function sanitizeSpreadsheetCellNullable(value: string | null | undefined): string | null {
  const sanitized = sanitizeSpreadsheetCell(value);
  return sanitized.length > 0 ? sanitized : null;
}
