import { describe, expect, it } from "vitest";

import { MIGRATE_ONBOARDING_SOURCE_CATALOG } from "@fsm/types";

import {
  GOLDEN_IMPORT_BUNDLE_MANIFESTS,
  assertGoldenImportBundleManifest,
  validateGoldenImportBundleManifest
} from "./import-golden-bundles/index.js";

describe("FS-MIGRATE golden import bundles (CI fixtures)", () => {
  it("covers every onboarding source in the catalog", () => {
    const catalogIds = MIGRATE_ONBOARDING_SOURCE_CATALOG.map((entry) => entry.id);
    const manifestIds = GOLDEN_IMPORT_BUNDLE_MANIFESTS.map((entry) => entry.sourceSystem);

    expect(manifestIds.sort()).toEqual(catalogIds.sort());
  });

  it("validates each manifest (files, joins, generic mapping, QB presets, history depth)", () => {
    for (const manifest of GOLDEN_IMPORT_BUNDLE_MANIFESTS) {
      assertGoldenImportBundleManifest(manifest);
    }
  });

  it("requires price book files for Service Fusion and Jobber epic §6 fixtures", () => {
    for (const source of ["service_fusion", "jobber"] as const) {
      const manifest = GOLDEN_IMPORT_BUNDLE_MANIFESTS.find((entry) => entry.sourceSystem === source);
      expect(manifest).toBeDefined();
      expect(manifest?.files.some((file) => file.entityType === "products")).toBe(true);
      expect(manifest?.requiredHistorySpanYears).toBeGreaterThanOrEqual(2);
    }
  });

  it("includes media paths for Service Fusion file-batch smoke tests", () => {
    const manifest = GOLDEN_IMPORT_BUNDLE_MANIFESTS.find((entry) => entry.sourceSystem === "service_fusion");
    expect(manifest?.mediaRelativePaths.length).toBeGreaterThanOrEqual(2);
  });

  it("returns structured issues instead of throwing when validation fails", () => {
    const manifest = GOLDEN_IMPORT_BUNDLE_MANIFESTS[0];
    const result = validateGoldenImportBundleManifest({
      ...manifest,
      files: manifest.files.map((file) =>
        file.relativePath === "customers.csv"
          ? { ...file, joinLink: { parentFile: "missing.csv", localColumn: "x", parentColumn: "y" } }
          : file
      )
    });

    expect(result.issues.length).toBeGreaterThan(0);
  });
});
