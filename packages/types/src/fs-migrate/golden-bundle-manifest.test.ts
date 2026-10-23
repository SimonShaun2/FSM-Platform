import { describe, expect, it } from "vitest";

import { goldenImportBundleManifestSchema } from "./golden-bundle-manifest.js";

describe("goldenImportBundleManifestSchema", () => {
  it("accepts a minimal multi-file manifest", () => {
    const parsed = goldenImportBundleManifestSchema.parse({
      fixtureId: "jobber-v1",
      sourceSystem: "jobber",
      label: "Jobber golden bundle",
      description: "Synthetic Jobber export bundle for CI.",
      files: [
        {
          relativePath: "clients.csv",
          entityType: "customers",
          presetEntityHint: "customers"
        },
        {
          relativePath: "jobs.csv",
          entityType: "jobs",
          presetEntityHint: "customers",
          joinLink: {
            parentFile: "clients.csv",
            localColumn: "Client ID",
            parentColumn: "Client ID"
          },
          businessDateColumn: "Completed On"
        }
      ],
      mediaRelativePaths: []
    });

    expect(parsed.fixtureId).toBe("jobber-v1");
    expect(parsed.files).toHaveLength(2);
  });
});
