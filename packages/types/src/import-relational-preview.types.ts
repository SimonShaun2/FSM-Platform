import type { ColumnMapping } from "./import.types.js";

export type RelationalPreviewNodeKind = "customer" | "property" | "job";

export interface RelationalPreviewNode {
  id: string;
  kind: RelationalPreviewNodeKind;
  label: string;
  sourceRow: number;
}

/** Customer (vendor id) → property (vendor id). */
export interface RelationalPreviewEdge {
  fromCustomerId: string;
  toPropertyId: string;
  joinKey: string;
}

/** Property (vendor id) → job (vendor id). */
export interface RelationalPropertyJobEdge {
  fromPropertyId: string;
  toJobId: string;
  joinKey: string;
}

export type RelationalJoinIssueCode =
  | "duplicate_customer_key"
  | "duplicate_property_key"
  | "duplicate_job_key"
  | "missing_join_key"
  | "orphan_property"
  | "orphan_job";

export interface RelationalJoinIssue {
  code: RelationalJoinIssueCode;
  message: string;
  sourceRow?: number;
  field?: string;
  joinKey?: string;
}

export interface RelationalPreviewGraphStats {
  customerCount: number;
  propertyCount: number;
  jobCount: number;
  linkedPropertyCount: number;
  linkedJobCount: number;
}

export interface RelationalPreviewGraph {
  customers: RelationalPreviewNode[];
  properties: RelationalPreviewNode[];
  jobs: RelationalPreviewNode[];
  edges: RelationalPreviewEdge[];
  propertyJobEdges: RelationalPropertyJobEdge[];
  orphanPropertyCount: number;
  orphanJobCount: number;
  unmatchedCustomerKeys: string[];
  unmatchedPropertyKeys: string[];
  joinIssues: RelationalJoinIssue[];
  stats: RelationalPreviewGraphStats;
}

export type ImportBundleFileKind = "customers" | "properties" | "jobs";

export interface ImportBundleFileRef {
  importSessionId: string;
  kind: ImportBundleFileKind;
  fileName: string;
}

export interface ImportBundleRelationalPreview {
  bundleId: string;
  files: ImportBundleFileRef[];
  graph: RelationalPreviewGraph;
}

export interface RelationalPreviewFieldKeys {
  sourceId: string;
  displayName?: string;
  customerSourceId?: string;
  propertySourceId?: string;
  label?: string;
}

export interface MappedImportPreviewRow {
  row: number;
  fields: Record<string, string | null>;
}

export interface CustomerPreviewRow {
  row: number;
  customerKey: string;
  displayName: string;
}

export interface PropertyPreviewRow {
  row: number;
  propertyKey: string;
  customerKey: string;
  label: string;
}

export interface JobPreviewRow {
  row: number;
  jobKey: string;
  propertyKey: string;
  label: string;
}

export interface BuildRelationalPreviewGraphInput {
  customerRows: CustomerPreviewRow[];
  propertyRows: PropertyPreviewRow[];
  jobRows?: JobPreviewRow[];
}

export interface TabularRelationalPreviewInput {
  bundleId: string;
  files: ImportBundleFileRef[];
  customerMappedRows: MappedImportPreviewRow[];
  propertyMappedRows: MappedImportPreviewRow[];
  jobMappedRows?: MappedImportPreviewRow[];
  fieldKeys: {
    customers: RelationalPreviewFieldKeys;
    properties: RelationalPreviewFieldKeys;
    jobs?: RelationalPreviewFieldKeys;
  };
  columnMappings?: {
    customers?: ColumnMapping;
    properties?: ColumnMapping;
    jobs?: ColumnMapping;
  };
}
