import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import {
  GOLDEN_IMPORT_E2E_EXPECTATIONS,
  GOLDEN_IMPORT_E2E_SOURCE_SYSTEMS
} from "./golden-import-e2e/expectations.js";

const neonCiUrl = process.env.NEON_CI_DATABASE_URL?.trim();
const postgresIntegrationEnabled =
  typeof neonCiUrl === "string" && neonCiUrl.startsWith("postgres");

describe.runIf(postgresIntegrationEnabled)("FS-152 golden import e2e (Neon CI)", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = neonCiUrl;
    process.env.BOOKING_HOLD_TOKEN_SECRET =
      process.env.BOOKING_HOLD_TOKEN_SECRET ?? "booking_hold_test_secret";
  });

  for (const sourceSystem of GOLDEN_IMPORT_E2E_SOURCE_SYSTEMS) {
    it(`runs ${sourceSystem} golden bundle parse → map → commit with lineage`, async () => {
      const { countLineageRows, findLineageRowId, runGoldenImportBundleE2e } = await import(
        "./golden-import-e2e/pipeline.js"
      );

      const companyId = randomUUID();
      await runGoldenImportBundleE2e(companyId, sourceSystem);

      const expectations = GOLDEN_IMPORT_E2E_EXPECTATIONS[sourceSystem];
      for (const entity of expectations) {
        const count = await countLineageRows(companyId, sourceSystem, entity.table);
        expect(count).toBe(entity.count);

        for (const sourceId of entity.sampleSourceIds) {
          const rowId = await findLineageRowId(companyId, sourceSystem, entity.table, sourceId);
          expect(rowId).toBeTruthy();
        }
      }
    });
  }

  it("denies cross-tenant reads of imported lineage rows", async () => {
    const { countLineageRows, findLineageRowId, runGoldenImportBundleE2e } = await import(
      "./golden-import-e2e/pipeline.js"
    );

    const tenantA = randomUUID();
    const tenantB = randomUUID();

    await runGoldenImportBundleE2e(tenantA, "service_fusion");

    const foreignRow = await findLineageRowId(tenantB, "service_fusion", "customers", "SF-CUST-001");
    expect(foreignRow).toBeNull();

    const tenantACount = await countLineageRows(tenantA, "service_fusion", "customers");
    const tenantBCount = await countLineageRows(tenantB, "service_fusion", "customers");
    expect(tenantACount).toBe(2);
    expect(tenantBCount).toBe(0);
  });
});
