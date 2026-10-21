import { AppError, ErrorCode } from "@fsm/types";

export type ReportingDateInterpretation = "company_local_days" | "utc_instant";

export interface ResolvedReportingPeriod {
  start: Date;
  end: Date;
  timeZone: string;
  dateInterpretation: ReportingDateInterpretation;
}

function getZonedParts(dateValue: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(dateValue);

  let hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");

  if (hour === 24) {
    hour = 0;
  }

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "0"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "0"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "0"),
    hour,
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? "0"),
    second: Number(parts.find((part) => part.type === "second")?.value ?? "0")
  };
}

function addDaysToDateOnly(dateOnly: string, days: number): string {
  const [year, month, day] = dateOnly.split("-").map((value) => Number.parseInt(value, 10));
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));

  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utcDate.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function zonedLocalTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string
): Date {
  let utcMillis = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = getZonedParts(new Date(utcMillis), timeZone);
    const asUtcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const desiredUtcMillis = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
    utcMillis += desiredUtcMillis - asUtcMillis;
  }

  return new Date(utcMillis);
}

function zonedDayBoundary(dateOnly: string, timeZone: string, boundary: "start" | "end"): Date {
  const [year, month, day] = dateOnly.split("-").map((value) => Number.parseInt(value, 10));

  if (!year || !month || !day) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "startDate and endDate must be valid ISO dates");
  }

  if (boundary === "start") {
    return zonedLocalTimeToUtc(year, month, day, 0, 0, 0, 0, timeZone);
  }

  const nextDay = addDaysToDateOnly(dateOnly, 1);
  const startOfNextDay = zonedDayBoundary(nextDay, timeZone, "start");

  return new Date(startOfNextDay.getTime() - 1);
}

function parseInstant(value: string): Date {
  const parsed = new Date(value.trim());

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "startDate and endDate must be valid ISO dates");
  }

  return parsed;
}

export function resolveReportingPeriod(
  startDate: string,
  endDate: string,
  timeZone: string
): ResolvedReportingPeriod {
  const startTrimmed = startDate.trim();
  const endTrimmed = endDate.trim();
  const isDateOnly =
    /^\d{4}-\d{2}-\d{2}$/u.test(startTrimmed) && /^\d{4}-\d{2}-\d{2}$/u.test(endTrimmed);

  if (isDateOnly) {
    return {
      start: zonedDayBoundary(startTrimmed, timeZone, "start"),
      end: zonedDayBoundary(endTrimmed, timeZone, "end"),
      timeZone,
      dateInterpretation: "company_local_days"
    };
  }

  return {
    start: parseInstant(startTrimmed),
    end: parseInstant(endTrimmed),
    timeZone,
    dateInterpretation: "utc_instant"
  };
}
