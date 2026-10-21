import type { BookingAvailabilityRecord } from "@/src/hooks/booking.hooks";

export interface EstimateSlotOption {
  key: string;
  date: string;
  window: BookingAvailabilityRecord["window"];
  start: string;
  end: string;
  labelDate: string;
  labelTime: string;
}

export function formatEstimateSlotLabels(startIso: string): { labelDate: string; labelTime: string } {
  const start = new Date(startIso);
  const labelDate = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  const labelTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  return { labelDate, labelTime };
}

export function flattenAvailabilitySlots(
  availabilityByDate: Array<{ date: string; slots: BookingAvailabilityRecord[] }>,
  limit = 8
): EstimateSlotOption[] {
  const options: EstimateSlotOption[] = [];

  for (const day of availabilityByDate) {
    for (const slot of day.slots) {
      const { labelDate, labelTime } = formatEstimateSlotLabels(slot.start);
      options.push({
        key: `${slot.start}-${slot.end}`,
        date: day.date,
        window: slot.window,
        start: slot.start,
        end: slot.end,
        labelDate,
        labelTime
      });

      if (options.length >= limit) {
        return options;
      }
    }
  }

  return options;
}

export function buildUpcomingIsoDates(count: number, from = new Date()): string[] {
  const dates: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const next = new Date(from);
    next.setUTCDate(next.getUTCDate() + index);
    dates.push(next.toISOString().slice(0, 10));
  }

  return dates;
}
