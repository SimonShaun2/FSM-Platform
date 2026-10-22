import { and, eq, isNull } from "drizzle-orm";

import {
  bookingRequests,
  companies,
  db,
  scheduleSlots,
  technicians
} from "@fsm/db";
import {
  AppError,
  type BookingRequest,
  type ConfirmSchedulingOptionInput,
  ErrorCode,
  type ListSchedulingOptionsQuery,
  type SchedulingNoAvailability,
  type SchedulingOption,
  type SchedulingOptionsResult,
  type SelectSchedulingOptionInput
} from "@fsm/types";

import {
  confirmBookingRequest,
  getBookingAvailability,
  getBookingRequest,
  holdBookingSlotForOperator
} from "./booking.service.js";
import { assertNonTerminalBookingRequest } from "./booking-request-guards.js";

const BOOKING_SLOT_HOLD_NOTE_PREFIX = "booking_hold:";
/** Post-job travel buffer applied when evaluating capacity (FS-23). */
export const SCHEDULING_TRAVEL_BUFFER_MINUTES = 30;

type TechnicianRow = typeof technicians.$inferSelect;
type BookingRequestRow = typeof bookingRequests.$inferSelect;
type SelectExecutor = Pick<typeof db, "select">;

function buildBookingSlotHoldNote(bookingRequestId: string): string {
  return `${BOOKING_SLOT_HOLD_NOTE_PREFIX}${bookingRequestId}`;
}

function buildOptionId(technicianId: string, scheduledStart: string, scheduledEnd: string): string {
  return `${technicianId}:${scheduledStart}:${scheduledEnd}`;
}

function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (60 * 1000));
}

function intervalsOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date
): boolean {
  return leftStart.getTime() < rightEnd.getTime() && leftEnd.getTime() > rightStart.getTime();
}

function normalizeSkillToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/gu, "_");
}

function technicianSkillsMatch(
  technician: TechnicianRow,
  booking: BookingRequestRow
): { skillsMatch: boolean; matchedSkills: string[] } {
  const requiredTokens = [booking.serviceCategory, booking.serviceType]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map(normalizeSkillToken);

  const skillTokens = (technician.skills ?? []).map(normalizeSkillToken);

  if (requiredTokens.length === 0 || skillTokens.length === 0) {
    return { skillsMatch: true, matchedSkills: skillTokens };
  }

  const matchedSkills = skillTokens.filter((skill) =>
    requiredTokens.some((required) => skill.includes(required) || required.includes(skill))
  );

  return {
    skillsMatch: matchedSkills.length > 0,
    matchedSkills
  };
}

async function technicianHasBufferedCapacity(
  companyId: string,
  technicianId: string,
  scheduledStart: Date,
  scheduledEnd: Date,
  travelBufferMinutes: number,
  executor: SelectExecutor,
  ignoreBookingRequestId?: string
): Promise<boolean> {
  const bufferedEnd = new Date(scheduledEnd.getTime() + travelBufferMinutes * 60 * 1000);
  const ignoreNote = ignoreBookingRequestId ? buildBookingSlotHoldNote(ignoreBookingRequestId) : null;

  const companySlots = await executor
    .select()
    .from(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.companyId, companyId),
        eq(scheduleSlots.technicianId, technicianId),
        isNull(scheduleSlots.deletedAt)
      )
    );

  const conflict = companySlots.some((slot) => {
    if (ignoreNote && slot.notes === ignoreNote) {
      return false;
    }

    return intervalsOverlap(scheduledStart, bufferedEnd, slot.startTime, slot.endTime);
  });

  return !conflict;
}

async function getCompanyTimeZone(companyId: string, executor: SelectExecutor): Promise<string> {
  const [company] = await executor
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) {
    throw new AppError(ErrorCode.NOT_FOUND, "Company not found");
  }

  return company.timezone;
}

async function assertActiveHoldMatchesSelection(
  companyId: string,
  bookingRequestId: string,
  input: ConfirmSchedulingOptionInput,
  executor: SelectExecutor
): Promise<void> {
  const holdNote = buildBookingSlotHoldNote(bookingRequestId);
  const holds = await executor
    .select()
    .from(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.companyId, companyId),
        eq(scheduleSlots.notes, holdNote),
        isNull(scheduleSlots.deletedAt)
      )
    );

  const activeHold = holds.find((slot) => !slot.isConfirmed);

  if (!activeHold) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "Scheduling confirmation requires an active in-platform slot hold before commitment (FS-23)"
    );
  }

  const scheduledStart = new Date(input.scheduledStart);
  const scheduledEnd = new Date(input.scheduledEnd);

  if (
    activeHold.technicianId !== input.technicianId ||
    activeHold.startTime.getTime() !== scheduledStart.getTime() ||
    activeHold.endTime.getTime() !== scheduledEnd.getTime()
  ) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "Confirmation must match the active slot hold; select the option again before confirming"
    );
  }
}

export async function listSchedulingOptionsForBookingRequest(
  companyId: string,
  bookingRequestId: string,
  query: ListSchedulingOptionsQuery = {}
): Promise<SchedulingOptionsResult> {
  const bookingRow = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.companyId, companyId),
          eq(bookingRequests.id, bookingRequestId),
          isNull(bookingRequests.deletedAt)
        )
      )
      .limit(1);

    if (!row) {
      throw new AppError(ErrorCode.NOT_FOUND, "Booking request not found");
    }

    return row;
  });

  const timeZone = await getCompanyTimeZone(companyId, db);

  if (bookingRow.status !== "pending") {
    return {
      bookingRequestId,
      timeZone,
      options: [],
      noAvailability: {
        code: "booking_not_pending",
        message: "Scheduling options are only available for pending booking requests"
      },
      commitmentRecorded: bookingRow.status === "confirmed"
    };
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) {
    throw new AppError(ErrorCode.NOT_FOUND, "Company not found");
  }

  const technicianRows = await db
    .select()
    .from(technicians)
    .where(and(eq(technicians.companyId, companyId), isNull(technicians.deletedAt)));

  const zipTechnicians = technicianRows.filter((technician) =>
    (technician.serviceZipCodes ?? []).includes(bookingRow.zip.trim())
  );

  if (zipTechnicians.length === 0) {
    return {
      bookingRequestId,
      timeZone,
      options: [],
      noAvailability: {
        code: "no_technicians_in_service_area",
        message: "No technicians are assigned to this service area zip code"
      },
      commitmentRecorded: false
    };
  }

  const windows = await getBookingAvailability(company.slug, bookingRow.zip, query.startDate);
  const options: SchedulingOption[] = [];

  for (const window of windows) {
    const scheduledStart = new Date(window.start);
    const scheduledEnd = new Date(window.end);
    const durationMinutes = minutesBetween(scheduledStart, scheduledEnd);

    for (const technicianId of window.technicianIds) {
      const technician = technicianRows.find((row) => row.id === technicianId);

      if (!technician) {
        continue;
      }

      const { skillsMatch, matchedSkills } = technicianSkillsMatch(technician, bookingRow);

      if (!skillsMatch) {
        continue;
      }

      const hasCapacity = await technicianHasBufferedCapacity(
        companyId,
        technicianId,
        scheduledStart,
        scheduledEnd,
        SCHEDULING_TRAVEL_BUFFER_MINUTES,
        db,
        bookingRequestId
      );

      if (!hasCapacity) {
        continue;
      }

      options.push({
        optionId: buildOptionId(technicianId, window.start, window.end),
        technicianId,
        scheduledStart: window.start,
        scheduledEnd: window.end,
        window: window.window,
        durationMinutes,
        travelBufferMinutes: SCHEDULING_TRAVEL_BUFFER_MINUTES,
        skillsMatch,
        matchedSkills
      });
    }
  }

  let noAvailability: SchedulingNoAvailability | null = null;

  if (options.length === 0) {
    const skillCapable = zipTechnicians.some(
      (technician) => technicianSkillsMatch(technician, bookingRow).skillsMatch
    );

    noAvailability = skillCapable
      ? {
          code: "no_open_windows",
          message: "No open windows remain after applying duration, travel buffer, and existing schedule holds"
        }
      : {
          code: "no_skill_match",
          message: "No technicians match the required service skills for this booking"
        };
  }

  const holdNote = buildBookingSlotHoldNote(bookingRequestId);
  const activeHolds = await db
    .select()
    .from(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.companyId, companyId),
        eq(scheduleSlots.notes, holdNote),
        isNull(scheduleSlots.deletedAt)
      )
    );

  const commitmentRecorded =
    activeHolds.some((slot) => !slot.isConfirmed) || Boolean(bookingRow.jobId);

  return {
    bookingRequestId,
    timeZone,
    options,
    noAvailability,
    commitmentRecorded
  };
}

export async function selectSchedulingOptionForBookingRequest(
  companyId: string,
  actorId: string,
  bookingRequestId: string,
  input: SelectSchedulingOptionInput
): Promise<{ bookingRequest: BookingRequest; hold: Awaited<ReturnType<typeof holdBookingSlotForOperator>>["hold"] }> {
  const booking = await getBookingRequest(companyId, bookingRequestId);
  assertNonTerminalBookingRequest(booking.status, "held");

  const startDate = input.scheduledStart.slice(0, 10);
  const options = await listSchedulingOptionsForBookingRequest(companyId, bookingRequestId, { startDate });
  const optionId = buildOptionId(input.technicianId, input.scheduledStart, input.scheduledEnd);
  const matched = options.options.find((option) => option.optionId === optionId);

  if (!matched) {
    throw new AppError(ErrorCode.CONFLICT, "Selected option is not in the current scheduling options list");
  }

  const result = await holdBookingSlotForOperator(companyId, actorId, bookingRequestId, input);

  return result;
}

export async function confirmSchedulingOptionForBookingRequest(
  companyId: string,
  actorId: string,
  bookingRequestId: string,
  input: ConfirmSchedulingOptionInput
): Promise<BookingRequest> {
  await db.transaction(async (tx) => {
    await assertActiveHoldMatchesSelection(companyId, bookingRequestId, input, tx);
  });

  return confirmBookingRequest(companyId, actorId, bookingRequestId, input);
}
