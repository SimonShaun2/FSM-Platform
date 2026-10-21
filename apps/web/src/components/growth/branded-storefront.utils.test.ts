import { describe, expect, it } from "vitest";

import {
  buildBookPath,
  buildBrandedStorefrontViewModel,
  buildServiceCards
} from "./branded-storefront.utils";

describe("branded-storefront.utils", () => {
  it("builds book path with website attribution", () => {
    expect(buildBookPath("sparkle-co")).toBe("/book/sparkle-co?src=website");
  });

  it("maps offered services into storefront cards", () => {
    const cards = buildServiceCards([
      { label: "Deep clean", priceHint: "from $219" },
      { name: "Recurring", subtitle: "save 10%" }
    ]);

    expect(cards).toHaveLength(2);
    expect(cards[0]?.title).toBe("Deep clean");
  });

  it("falls back to cleaning cards when settings are empty", () => {
    const model = buildBrandedStorefrontViewModel({
      companyName: "Sparkle & Co.",
      companySlug: "sparkle-co",
      bookingSlug: "sparkle-co",
      offeredServices: [],
      availableHoursStart: 8,
      availableHoursEnd: 17,
      availableDays: ["mon"],
      slotDuration: 60,
      maxAdvanceDays: 30,
      googleReviewUrl: null,
      yelpReviewUrl: null,
      facebookReviewUrl: null
    });

    expect(model.serviceCards.length).toBe(4);
    expect(model.bookingSlug).toBe("sparkle-co");
  });
});
