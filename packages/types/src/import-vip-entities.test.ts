import { describe, expect, it } from "vitest";

import type { ImportEntityType } from "./import.types.js";

describe("VIP import entity types", () => {
  it("includes tier and membership rows for FS-MIGRATE catalog", () => {
    const entities: ImportEntityType[] = ["vip_membership_tiers", "vip_memberships"];
    expect(entities).toHaveLength(2);
  });
});
