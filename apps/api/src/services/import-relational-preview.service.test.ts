import { describe, expect, it } from "vitest";

import { buildCustomerPropertyPreviewGraph } from "./import-relational-preview.service.js";

describe("import-relational-preview.service", () => {
  it("links properties to customers by customer key", () => {
    const graph = buildCustomerPropertyPreviewGraph(
      [
        { row: 2, customerKey: "C-1", displayName: "Acme" },
        { row: 3, customerKey: "C-2", displayName: "Beta" }
      ],
      [
        { row: 2, propertyKey: "P-1", customerKey: "C-1", label: "Main St" },
        { row: 3, propertyKey: "P-2", customerKey: "C-9", label: "Orphan" }
      ]
    );

    expect(graph.edges).toHaveLength(1);
    expect(graph.orphanPropertyCount).toBe(1);
    expect(graph.unmatchedCustomerKeys).toEqual(["C-2"]);
  });
});
