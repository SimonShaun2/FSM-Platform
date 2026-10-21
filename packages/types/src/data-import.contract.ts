import type { ImportEntityType, ImportSessionStatus, ValidationError } from "./import.types.js";

/** FS-11 contract ID — documentation mirror for consumers */
export const DATA_IMPORT_CONTRACT_ID = "fsm.data-import.v1";

/** API response shape for import session (contract v1) */
export interface ImportSessionContractV1 {
  id: string;
  status: ImportSessionStatus;
  entityType: ImportEntityType;
  fileName: string;
  totalRows: number | null;
  validRows: number | null;
  errorRows: number | null;
  importedRows: number | null;
  skippedRows: number | null;
  duplicateRows: number | null;
  columnMappings: Record<string, string | null>;
  completedAt: string | null;
  rolledBackAt: string | null;
  createdAt: string;
}

export type ImportValidationErrorContractV1 = ValidationError;
