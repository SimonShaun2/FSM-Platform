import { describe, expect, it } from "vitest";

import { flattenAvailabilitySlots, formatEstimateSlotLabels } from "./estimate-slot.utils";

describe("estimate-slot.utils", () => {
  it("formats slot labels for display", () => {
    const labels = formatEstimateSlotLabels("2026-10-28T13:00:00.000Z");
    expect(labels.labelDate.length).toBeGreaterThan(0);
    expect(labels.labelTime.length).toBeGreaterThan(0);
  });

  it("flattens availability across days with a limit", () => {
    const slots = flattenAvailabilitySlots(
      [
        {
          date: "2026-10-28",
          slots: [
            {
              date: "2026-10-28",
              window: "morning",
              start: "2026-10-28T13:00:00.000Z",
              end: "2026-10-28T14:00:00.000Z",
              technicianIds: ["tech-1"]
            }
          ]
        },
        {
          date: "2026-10-29",
          slots: [
            {
              date: "2026-10-29",
              window: "afternoon",
              start: "2026-10-29T17:00:00.000Z",
              end: "2026-10-29T18:00:00.000Z",
              technicianIds: ["tech-2"]
            }
          ]
        }
      ],
      1
    );

    expect(slots).toHaveLength(1);
    expect(slots[0]?.window).toBe("morning");
  });
});
