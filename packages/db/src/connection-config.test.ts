import { describe, expect, it } from "vitest";

import { computeConnectionBudget } from "./connection-config.js";

describe("computeConnectionBudget", () => {
  it("sums replica pools and compares against service ceiling", () => {
    const budget = computeConnectionBudget({
      serviceMaxConnections: 100,
      reservedForAdmin: 10,
      poolMaxPerProcess: 10,
      processes: [
        { role: "api", replicaCount: 3 },
        { role: "worker", replicaCount: 2 },
        { role: "webhook", replicaCount: 1 }
      ]
    });

    expect(budget.aggregateClientConnections).toBe(60);
    expect(budget.headroom).toBe(30);
    expect(budget.withinServiceLimit).toBe(true);
    expect(budget.breakdown).toEqual([
      { role: "api", connections: 30 },
      { role: "worker", connections: 20 },
      { role: "webhook", connections: 10 }
    ]);
  });

  it("flags budgets that exceed the service limit", () => {
    const budget = computeConnectionBudget({
      serviceMaxConnections: 40,
      reservedForAdmin: 5,
      poolMaxPerProcess: 10,
      processes: [{ role: "api", replicaCount: 4 }]
    });

    expect(budget.aggregateClientConnections).toBe(40);
    expect(budget.withinServiceLimit).toBe(false);
    expect(budget.headroom).toBe(-5);
  });
});
