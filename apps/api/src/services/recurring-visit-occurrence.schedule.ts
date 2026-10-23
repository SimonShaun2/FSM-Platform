import { Temporal } from "@js-temporal/polyfill";

import type { maintenancePlans } from "@fsm/db";

type MaintenancePlanFrequency = typeof maintenancePlans.$inferSelect.frequency;

const FREQUENCY_MONTH_STEP: Record<MaintenancePlanFrequency, number> = {
  monthly: 1,
  bi_monthly: 2,
  quarterly: 3,
  bi_annual: 6,
  annual: 12
};

function normalizeLocalTime(localTime: string): string {
  const trimmed = localTime.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  return trimmed;
}

export function monthsBetweenOccurrences(frequency: MaintenancePlanFrequency): number {
  return FREQUENCY_MONTH_STEP[frequency];
}

/** Calendar-month occurrence local dates from anchor (index 0 = anchor). */
export function planOccurrenceLocalDates(
  anchorLocalDate: string,
  frequency: MaintenancePlanFrequency,
  count: number
): string[] {
  if (count < 1) {
    return [];
  }

  const step = monthsBetweenOccurrences(frequency);
  const dates: string[] = [];
  let current = Temporal.PlainDate.from(anchorLocalDate);

  for (let index = 0; index < count; index++) {
    dates.push(current.toString());
    current = current.add({ months: step });
  }

  return dates;
}

export function localDateTimeToUtc(
  localDate: string,
  localTime: string,
  timeZone: string
): Date {
  const plainTime = Temporal.PlainTime.from(normalizeLocalTime(localTime));
  const zoned = Temporal.PlainDate.from(localDate).toZonedDateTime({
    timeZone,
    plainTime
  });

  return new Date(zoned.epochMilliseconds);
}
