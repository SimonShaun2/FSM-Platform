import { describe, expect, it } from "vitest";

import { FEATURE_TILES, HERO_COPY, MARKETING_BRAND, MARKETING_META, WORKFLOW_STEPS } from "./marketing-copy";

describe("marketing-copy", () => {
  it("uses Renvani branding for getrenvani.com", () => {
    expect(MARKETING_BRAND.name).toBe("Renvani");
    expect(MARKETING_BRAND.domain).toBe("getrenvani.com");
  });

  it("includes hero and workflow content from marketing Figma", () => {
    expect(HERO_COPY.headline).toContain("revenue");
    expect(WORKFLOW_STEPS).toHaveLength(5);
    expect(FEATURE_TILES.length).toBeGreaterThanOrEqual(8);
  });

  it("defines SEO metadata", () => {
    expect(MARKETING_META.title.length).toBeGreaterThan(10);
    expect(MARKETING_META.description).toMatch(/Renvani/i);
  });
});
