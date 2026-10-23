import { resolveInvoiceLineCatalogId } from "@fsm/db";
import type { ImportSourceSystemId } from "@fsm/types";

/**
 * Resolves a migrated price-book row for invoice line commit (FS-MIGRATE-M5).
 * Invoice import processors call this with the vendor item id from the export.
 */
export async function resolveImportedInvoiceLineCatalogId(
  companyId: string,
  sourceSystem: ImportSourceSystemId,
  vendorItemSourceId: string
): Promise<string | null> {
  const trimmed = vendorItemSourceId.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return resolveInvoiceLineCatalogId(companyId, sourceSystem, trimmed);
}
