import { normalizeImportText } from "./text.js";

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Business date for FS-MIGRATE (YYYY-MM-DD). Does not substitute ingestion time.
 */
export function normalizeImportBusinessDate(value: string | null | undefined): string | null {
  const normalized = normalizeImportText(value);
  if (!normalized) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const isoDateTime = /^(\d{4}-\d{2}-\d{2})T/.exec(normalized);
  if (isoDateTime?.[1]) {
    return isoDateTime[1];
  }

  const usSlash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  if (usSlash) {
    const month = Number(usSlash[1]);
    const day = Number(usSlash[2]);
    const year = Number(usSlash[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return null;
}
