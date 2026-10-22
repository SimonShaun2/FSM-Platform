import { describe, expect, it } from "vitest";

import { DATA_EXPORT_MANIFEST_V1 } from "./manifest.js";

/**
 * FS-89 AC-6 — documented gaps between export manifest and FS-11 import entities.
 */
describe("FS-11 import vs FS-89 export compatibility", () => {
  it("exports a strict superset of FS-11 import entity types", () => {
    const fs11ImportEntities = new Set(["customers", "jobs"]);
    const exportEntityKeys = Object.keys(DATA_EXPORT_MANIFEST_V1.entities);

    for (const entity of fs11ImportEntities) {
      expect(exportEntityKeys).toContain(entity);
    }

    expect(exportEntityKeys.length).toBeGreaterThan(fs11ImportEntities.size);
  });
});
