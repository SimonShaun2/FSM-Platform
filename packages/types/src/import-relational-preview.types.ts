export interface RelationalPreviewNode {
  id: string;
  kind: "customer" | "property";
  label: string;
  sourceRow: number;
}

export interface RelationalPreviewEdge {
  fromCustomerId: string;
  toPropertyId: string;
  joinKey: string;
}

export interface RelationalPreviewGraph {
  customers: RelationalPreviewNode[];
  properties: RelationalPreviewNode[];
  edges: RelationalPreviewEdge[];
  orphanPropertyCount: number;
  unmatchedCustomerKeys: string[];
}
