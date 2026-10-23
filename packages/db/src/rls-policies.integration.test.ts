import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

const neonCiUrl = process.env.NEON_CI_DATABASE_URL?.trim();
const postgresIntegrationEnabled =
  typeof neonCiUrl === "string" && neonCiUrl.startsWith("postgres");

describe.runIf(postgresIntegrationEnabled)("STACK-10 RLS policies (Postgres)", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = neonCiUrl;
    process.env.BOOKING_HOLD_TOKEN_SECRET =
      process.env.BOOKING_HOLD_TOKEN_SECRET ?? "booking_hold_test_secret";
  });

  it("denies cross-tenant reads when session GUC is set", async () => {
    const { db } = await import("./client.js");
    const { customers } = await import("./schema.js");
    const { runTransactionWithTenantSession } = await import("./run-with-tenant-session.js");

    const companyA = randomUUID();
    const companyB = randomUUID();
    const customerA = randomUUID();
    const customerB = randomUUID();

    await db.insert(customers).values([
      {
        id: customerA,
        companyId: companyA,
        firstName: "Tenant",
        lastName: "A",
        email: `a-${companyA.slice(0, 8)}@rls.test`
      },
      {
        id: customerB,
        companyId: companyB,
        firstName: "Tenant",
        lastName: "B",
        email: `b-${companyB.slice(0, 8)}@rls.test`
      }
    ]);

    const visibleForA = await runTransactionWithTenantSession(companyA, async (tx) => {
      return tx.select({ id: customers.id }).from(customers);
    });

    const idsForA = visibleForA.map((row) => row.id);
    expect(idsForA).toContain(customerA);
    expect(idsForA).not.toContain(customerB);

    await runTransactionWithTenantSession(companyA, async (tx) => {
      await tx.delete(customers).where(eq(customers.id, customerA));
    });
    await runTransactionWithTenantSession(companyB, async (tx) => {
      await tx.delete(customers).where(eq(customers.id, customerB));
    });
  });
});
