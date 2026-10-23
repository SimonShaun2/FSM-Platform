import { describe, expect, it } from "vitest";

import {
  FEATURE_TILES,
  HERO_COPY,
  HERO_STATS,
  MARKETING_BRAND,
  MARKETING_META,
  MARKETING_VIEWPORTS,
  PROBLEM_CARDS,
  WORKFLOW_STEPS
} from "./marketing-copy";

describe("marketing-copy", () => {
  it("uses Renvani branding for getrenvani.com", () => {
    expect(MARKETING_BRAND.name).toBe("Renvani");
    expect(MARKETING_BRAND.domain).toBe("getrenvani.com");
  });

  it("includes hero, problem, workflow, and feature content for Figma parity (TICKET-036b)", () => {
    expect(HERO_COPY.headline).toContain("revenue");
    expect(HERO_STATS).toHaveLength(3);
    expect(PROBLEM_CARDS).toHaveLength(6);
    expect(WORKFLOW_STEPS).toHaveLength(9);
    expect(FEATURE_TILES).toHaveLength(16);
  });

  it("documents responsive evidence breakpoints", () => {
    expect(MARKETING_VIEWPORTS).toEqual({ mobile: 390, tablet: 768, desktop: 1440 });
  });

  it("defines SEO metadata", () => {
    expect(MARKETING_META.title.length).toBeGreaterThan(10);
    expect(MARKETING_META.description).toMatch(/Renvani/i);
  });
});
