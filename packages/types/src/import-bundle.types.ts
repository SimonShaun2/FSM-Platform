/** FS-MIGRATE M2 — multi-file onboarding bundle (ADR import lineage) */

export type ImportBundleStatus = "open" | "preview" | "importing" | "completed" | "failed";

export type ImportBundleFileRole =
  | "customers"
  | "properties"
  | "jobs"
  | "invoices"
  | "equipment"
  | "payments"
  | "unknown";

export interface ImportBundleFileDescriptor {
  fileName: string;
  role: ImportBundleFileRole;
  mimeType: string;
  byteSize: number;
  importSessionId?: string | null;
}

export interface ImportBundleProgress {
  filesTotal: number;
  filesMapped: number;
  chunksCommitted: number;
  chunksTotal: number | null;
}

export interface ImportBundleContract {
  id: string;
  companyId: string;
  status: ImportBundleStatus;
  sourceSystem: string | null;
  files: ImportBundleFileDescriptor[];
  progress: ImportBundleProgress;
  createdAt: string;
  updatedAt: string;
}
