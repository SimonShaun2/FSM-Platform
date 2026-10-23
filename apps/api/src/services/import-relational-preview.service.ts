import type { RelationalPreviewEdge, RelationalPreviewGraph, RelationalPreviewNode } from "@fsm/types";

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

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function buildCustomerPropertyPreviewGraph(
  customerRows: CustomerPreviewRow[],
  propertyRows: PropertyPreviewRow[]
): RelationalPreviewGraph {
  const customers: RelationalPreviewNode[] = customerRows.map((row) => ({
    id: row.customerKey,
    kind: "customer",
    label: row.displayName,
    sourceRow: row.row
  }));

  const customerKeySet = new Set(customerRows.map((row) => normalizeKey(row.customerKey)));
  const properties: RelationalPreviewNode[] = [];
  const edges: RelationalPreviewEdge[] = [];
  let orphanPropertyCount = 0;

  for (const propertyRow of propertyRows) {
    const customerKey = normalizeKey(propertyRow.customerKey);
    const propertyNode: RelationalPreviewNode = {
      id: propertyRow.propertyKey,
      kind: "property",
      label: propertyRow.label,
      sourceRow: propertyRow.row
    };
    properties.push(propertyNode);

    if (!customerKeySet.has(customerKey)) {
      orphanPropertyCount += 1;
      continue;
    }

    edges.push({
      fromCustomerId: propertyRow.customerKey,
      toPropertyId: propertyRow.propertyKey,
      joinKey: propertyRow.customerKey
    });
  }

  const linkedCustomerKeys = new Set(edges.map((edge) => normalizeKey(edge.fromCustomerId)));
  const unmatchedCustomerKeys = customerRows
    .map((row) => row.customerKey)
    .filter((key) => !linkedCustomerKeys.has(normalizeKey(key)));

  return {
    customers,
    properties,
    edges,
    orphanPropertyCount,
    unmatchedCustomerKeys
  };
}
