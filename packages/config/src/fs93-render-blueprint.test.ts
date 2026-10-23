import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  FS93_RENDER_BLUEPRINT_REF,
  validateFs93RenderBlueprintYaml
} from "./fs93-render-blueprint.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const blueprintPath = join(repoRoot, FS93_RENDER_BLUEPRINT_REF.relativePath);

describe("FS-93 render blueprint reference", () => {
  it("contract anchors Neon + Render API/worker/webhook + Key Value noeviction", () => {
    expect(FS93_RENDER_BLUEPRINT_REF.database.provider).toBe("neon");
    expect(FS93_RENDER_BLUEPRINT_REF.keyValue.maxmemoryPolicy).toBe("noeviction");
    expect(FS93_RENDER_BLUEPRINT_REF.renderServices.api.name).toBe("renvani-api");
    expect(FS93_RENDER_BLUEPRINT_REF.webHost).toBe("vercel");
  });

  it("reference YAML satisfies FS-93 alignment rules", () => {
    const yaml = readFileSync(blueprintPath, "utf8");
    const result = validateFs93RenderBlueprintYaml(yaml);
    expect(result).toEqual({ ok: true });
  });

  it("STACK-12 runbook links FS-93 runbook and Neon region rule", () => {
    const doc = readFileSync(
      join(repoRoot, "docs/infrastructure/STACK-12-render-neon-region.md"),
      "utf8"
    );
    expect(doc).toContain("Neon");
    expect(doc).toContain("FS-93");
    expect(doc).toContain("render-blueprint.render.yaml");
  });
});
