import { addDays, differenceInCalendarDays, format, parseISO, subDays } from "date-fns";

import { JOB_SOURCE_REPORTING_MAX_RANGE_DAYS } from "@fsm/types";

export function formatDateOnly(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function getDefaultJobSourceReportingRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const start = subDays(today, 29);

  return {
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(today)
  };
}

export function getJobSourceReportingMaxEndDate(startDate: string): string {
  return formatDateOnly(addDays(parseISO(startDate), JOB_SOURCE_REPORTING_MAX_RANGE_DAYS - 1));
}

export function getJobSourceReportingMinStartDate(endDate: string): string {
  return formatDateOnly(subDays(parseISO(endDate), JOB_SOURCE_REPORTING_MAX_RANGE_DAYS - 1));
}

export function isJobSourceReportingRangeValid(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate || startDate > endDate) {
    return false;
  }

  const inclusiveDays = differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;

  return inclusiveDays <= JOB_SOURCE_REPORTING_MAX_RANGE_DAYS;
}

export function clampJobSourceReportingRange(startDate: string, endDate: string): {
  startDate: string;
  endDate: string;
} {
  if (!startDate || !endDate) {
    return { startDate, endDate };
  }

  let nextStart = startDate;
  let nextEnd = endDate;

  if (nextStart > nextEnd) {
    nextEnd = nextStart;
  }

  const maxEnd = getJobSourceReportingMaxEndDate(nextStart);

  if (nextEnd > maxEnd) {
    nextEnd = maxEnd;
  }

  const minStart = getJobSourceReportingMinStartDate(nextEnd);

  if (nextStart < minStart) {
    nextStart = minStart;
  }

  return { startDate: nextStart, endDate: nextEnd };
}
