import { and, eq, isNull } from "drizzle-orm";
import { Decimal } from "decimal.js";

import {
  companies,
  db,
  emitEventWithExecutor,
  jobs,
  scheduleSlots,
  technicians,
  users
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type AvailabilityResult,
  type CreateTechnicianInput,
  type ListTechniciansQuery,
  type PaginatedResult,
  type PerformanceSummary,
  type TechnicianAvailableDay,
  type Technician,
  type TechnicianDetail,
  type UpdateTechnicianInput
} from "@fsm/types";

const MAX_RESULT_WINDOW = 10_000;
const MAX_AVAILABILITY_RANGE_DAYS = 30;
const DEFAULT_HOURS_PER_DAY = "8";
const DEFAULT_AVAILABLE_DAYS: TechnicianAvailableDay[] = ["mon", "tue", "wed", "thu", "fri"];
const ALL_AVAILABLE_DAYS: TechnicianAvailableDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DEFAULT_CALENDAR_COLOR = "#6366f1";
const DEFAULT_TECHNICIAN_STATUS = "active";
const DEFAULT_LIST_PAGE = 1;
const DEFAULT_LIST_LIMIT = 25;
const DEFAULT_LIST_SORT_BY = "firstName";
const DEFAULT_LIST_SORT_ORDER = "asc";

type CompanyRow = typeof companies.$inferSelect;
type TechnicianRow = typeof technicians.$inferSelect;
type UserRow = typeof users.$inferSelect;
type JobRow = typeof jobs.$inferSelect;
type ScheduleSlotRow = typeof scheduleSlots.$inferSelect;
type SelectExecutor = Pick<typeof db, "select">;
type NormalizedListTechniciansQuery = {
  status?: ListTechniciansQuery["status"];
  skills: string[];
  sortBy: NonNullable<ListTechniciansQuery["sortBy"]>;
  sortOrder: NonNullable<ListTechniciansQuery["sortOrder"]>;
  page: number;
  limit: number;
};

function buildActorName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function normalizeOptionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeOptionalEmail(value: string | undefined): string | null | undefined {
  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined || normalizedValue === null) {
    return normalizedValue;
  }

  return normalizedValue.toLowerCase();
}

function normalizeStringArray(values: string[] | undefined): string[] | undefined {
  if (values === undefined) {
    return undefined;
  }

  const normalizedValues: string[] = [];

  for (const value of values) {
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0 || normalizedValues.includes(normalizedValue)) {
      continue;
    }

    normalizedValues.push(normalizedValue);
  }

  return normalizedValues;
}

function normalizeAvailableDays(values: string[] | undefined): TechnicianAvailableDay[] | undefined {
  const normalizedValues = normalizeStringArray(values);

  if (normalizedValues === undefined) {
    return undefined;
  }

  const allowedDays = new Set<TechnicianAvailableDay>(ALL_AVAILABLE_DAYS);
  const result: TechnicianAvailableDay[] = [];

  for (const value of normalizedValues) {
    const normalizedValue = value.toLowerCase() as TechnicianAvailableDay;

    if (!allowedDays.has(normalizedValue) || result.includes(normalizedValue)) {
      continue;
    }

    result.push(normalizedValue);
  }

  return result;
}

function parseHoursPerDay(value: string | null): number {
  const numericValue = Number(value ?? DEFAULT_HOURS_PER_DAY);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : Number(DEFAULT_HOURS_PER_DAY);
}

function getWeekdayKey(dateValue: Date): TechnicianAvailableDay {
  const weekdayKeys: TechnicianAvailableDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  return weekdayKeys[dateValue.getUTCDay()] ?? "mon";
}

function mapTechnicianRow(row: TechnicianRow): Technician {
  return {
    ...row,
    availableDays: normalizeAvailableDays(row.availableDays ?? undefined) ?? null
  };
}

function parseDateKey(dateValue: string): Date {
  return new Date(`${dateValue}T00:00:00.000Z`);
}

function normalizeListTechniciansQuery(query: ListTechniciansQuery): NormalizedListTechniciansQuery {
  return {
    status: query.status,
    skills: normalizeStringArray(query.skills) ?? [],
    sortBy: query.sortBy ?? DEFAULT_LIST_SORT_BY,
    sortOrder: query.sortOrder ?? DEFAULT_LIST_SORT_ORDER,
    page: query.page ?? DEFAULT_LIST_PAGE,
    limit: query.limit ?? DEFAULT_LIST_LIMIT
  };
}

function normalizeCreateTechnicianInput(input: CreateTechnicianInput) {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizeOptionalEmail(input.email) ?? null,
    phone: input.phone.trim(),
    skills: normalizeStringArray(input.skills) ?? [],
    serviceAreaIds: normalizeStringArray(input.serviceAreaIds) ?? [],
    serviceZipCodes: normalizeStringArray(input.serviceZipCodes) ?? [],
    availableDays: normalizeAvailableDays(input.availableDays) ?? [...DEFAULT_AVAILABLE_DAYS],
    hoursPerDay: input.hoursPerDay ?? Number(DEFAULT_HOURS_PER_DAY),
    status: input.status ?? DEFAULT_TECHNICIAN_STATUS,
    calendarColor: input.calendarColor ?? DEFAULT_CALENDAR_COLOR,
    notes: normalizeOptionalString(input.notes) ?? null,
    userId: input.userId
  };
}

function normalizeUpdateTechnicianInput(input: UpdateTechnicianInput) {
  return {
    firstName: input.firstName !== undefined ? input.firstName.trim() : undefined,
    lastName: input.lastName !== undefined ? input.lastName.trim() : undefined,
    email: input.email !== undefined ? normalizeOptionalEmail(input.email) ?? null : undefined,
    phone: input.phone !== undefined ? input.phone.trim() : undefined,
    skills: input.skills !== undefined ? normalizeStringArray(input.skills) ?? [] : undefined,
    serviceAreaIds:
      input.serviceAreaIds !== undefined ? normalizeStringArray(input.serviceAreaIds) ?? [] : undefined,
    serviceZipCodes:
      input.serviceZipCodes !== undefined ? normalizeStringArray(input.serviceZipCodes) ?? [] : undefined,
    availableDays:
      input.availableDays !== undefined ? normalizeAvailableDays(input.availableDays) ?? [...DEFAULT_AVAILABLE_DAYS] : undefined,
    hoursPerDay: input.hoursPerDay,
    status: input.status,
    calendarColor: input.calendarColor,
    notes: input.notes !== undefined ? normalizeOptionalString(input.notes) ?? null : undefined,
    userId: input.userId
  };
}

function normalizeAvailabilityRange(startDate: string, endDate: string) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  if (end.getTime() < start.getTime()) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "endDate must be on or after startDate");
  }

  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (dayCount > MAX_AVAILABILITY_RANGE_DAYS) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Date range must be 30 days or fewer");
  }

  return { startDate, endDate };
}

function listDateRange(startDate: string, endDate: string): string[] {
  const result: string[] = [];
  const current = parseDateKey(startDate);
  const last = parseDateKey(endDate);

  while (current.getTime() <= last.getTime()) {
    result.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

function formatDateInTimeZone(dateValue: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(dateValue);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function calculateMinutesBetween(startTime: Date, endTime: Date): number {
  return Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60_000));
}

function matchesSkillsFilter(technician: TechnicianRow, requestedSkills: string[]): boolean {
  const technicianSkills = new Set((technician.skills ?? []).map((skill) => skill.toLowerCase()));

  return requestedSkills.some((skill) => technicianSkills.has(skill.toLowerCase()));
}

function compareStrings(left: string, right: string, sortOrder: "asc" | "desc"): number {
  return sortOrder === "asc" ? left.localeCompare(right) : right.localeCompare(left);
}

function compareNumbers(left: number, right: number, sortOrder: "asc" | "desc"): number {
  return sortOrder === "asc" ? left - right : right - left;
}

function compareDates(left: Date, right: Date, sortOrder: "asc" | "desc"): number {
  return sortOrder === "asc" ? left.getTime() - right.getTime() : right.getTime() - left.getTime();
}

function sortTechniciansList(
  list: TechnicianRow[],
  sortBy: NonNullable<ListTechniciansQuery["sortBy"]>,
  sortOrder: NonNullable<ListTechniciansQuery["sortOrder"]>
): TechnicianRow[] {
  return [...list].sort((left, right) => {
    switch (sortBy) {
      case "firstName": {
        const firstNameComparison = compareStrings(left.firstName, right.firstName, sortOrder);
        return firstNameComparison !== 0
          ? firstNameComparison
          : compareStrings(left.lastName, right.lastName, sortOrder);
      }
      case "totalJobsCompleted":
        return compareNumbers(left.totalJobsCompleted ?? 0, right.totalJobsCompleted ?? 0, sortOrder);
      case "createdAt":
        return compareDates(left.createdAt, right.createdAt, sortOrder);
    }
  });
}

function toCurrencyString(value: Decimal): string {
  return value.toFixed(2);
}

async function getCompanyRecord(companyId: string, executor: SelectExecutor): Promise<CompanyRow> {
  const [company] = await executor
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) {
    throw new AppError(ErrorCode.NOT_FOUND, "Company not found");
  }

  return company;
}

async function getActor(companyId: string, actorId: string, executor: SelectExecutor): Promise<UserRow | null> {
  const [actor] = await executor
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, actorId), isNull(users.deletedAt)))
    .limit(1);

  return actor ?? null;
}

async function getUserRecord(companyId: string, userId: string, executor: SelectExecutor): Promise<UserRow> {
  const [user] = await executor
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, "User not found");
  }

  return user;
}

async function getTechnicianRecord(
  companyId: string,
  technicianId: string,
  executor: SelectExecutor
): Promise<Technician> {
  const [technician] = await executor
    .select()
    .from(technicians)
    .where(and(eq(technicians.companyId, companyId), eq(technicians.id, technicianId), isNull(technicians.deletedAt)))
    .limit(1);

  if (!technician) {
    throw new AppError(ErrorCode.NOT_FOUND, "Technician not found");
  }

  return mapTechnicianRow(technician);
}

async function listCompanyJobsForTechnician(
  companyId: string,
  technicianId: string,
  executor: SelectExecutor
): Promise<JobRow[]> {
  return executor
    .select()
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.technicianId, technicianId), isNull(jobs.deletedAt)))
    .limit(MAX_RESULT_WINDOW);
}

async function listCompanyScheduleSlotsForTechnician(
  companyId: string,
  technicianId: string,
  executor: SelectExecutor
): Promise<ScheduleSlotRow[]> {
  return executor
    .select()
    .from(scheduleSlots)
    .where(
      and(eq(scheduleSlots.companyId, companyId), eq(scheduleSlots.technicianId, technicianId), isNull(scheduleSlots.deletedAt))
    )
    .limit(MAX_RESULT_WINDOW);
}

function assertTechnicianUserRole(user: UserRow): void {
  if (user.role !== "technician") {
    throw new AppError(ErrorCode.CONFLICT, "User must have the technician role");
  }
}

async function getLinkableUserForCreate(
  companyId: string,
  userId: string,
  executor: SelectExecutor
): Promise<UserRow> {
  const user = await getUserRecord(companyId, userId, executor);

  assertTechnicianUserRole(user);

  if (user.technicianId) {
    throw new AppError(ErrorCode.CONFLICT, "User is already linked to a technician");
  }

  return user;
}

async function getLinkableUserForTechnician(
  companyId: string,
  technician: TechnicianRow,
  userId: string,
  executor: SelectExecutor
): Promise<UserRow> {
  const user = await getUserRecord(companyId, userId, executor);

  assertTechnicianUserRole(user);

  if (technician.userId && technician.userId !== userId) {
    throw new AppError(ErrorCode.CONFLICT, "Technician is already linked to a different user");
  }

  if (user.technicianId && user.technicianId !== technician.id) {
    throw new AppError(ErrorCode.CONFLICT, "User is already linked to a different technician");
  }

  return user;
}

export async function listTechnicians(
  companyId: string,
  query: ListTechniciansQuery
): Promise<PaginatedResult<Technician>> {
  const normalizedQuery = normalizeListTechniciansQuery(query);
  const companyTechnicians = await db
    .select()
    .from(technicians)
    .where(and(eq(technicians.companyId, companyId), isNull(technicians.deletedAt)))
    .limit(MAX_RESULT_WINDOW);

  const filteredTechnicians = companyTechnicians.filter((technician) => {
    if (normalizedQuery.status && technician.status !== normalizedQuery.status) {
      return false;
    }

    if (normalizedQuery.skills.length > 0 && !matchesSkillsFilter(technician, normalizedQuery.skills)) {
      return false;
    }

    return true;
  });

  const sortedTechnicians = sortTechniciansList(
    filteredTechnicians,
    normalizedQuery.sortBy,
    normalizedQuery.sortOrder
  );
  const total = sortedTechnicians.length;
  const offset = (normalizedQuery.page - 1) * normalizedQuery.limit;

  return {
    data: sortedTechnicians.slice(offset, offset + normalizedQuery.limit).map(mapTechnicianRow),
    total,
    page: normalizedQuery.page,
    limit: normalizedQuery.limit,
    totalPages: Math.ceil(total / normalizedQuery.limit)
  };
}

export async function getTechnician(companyId: string, technicianId: string): Promise<TechnicianDetail> {
  const technician = await getTechnicianRecord(companyId, technicianId, db);
  const [company, technicianJobs] = await Promise.all([
    getCompanyRecord(companyId, db),
    listCompanyJobsForTechnician(companyId, technicianId, db)
  ]);
  const todayKey = formatDateInTimeZone(new Date(), company.timezone);
  const todayJobCount = technicianJobs.filter((job) => {
    if (job.status === "cancelled" || !job.scheduledStart) {
      return false;
    }

    return formatDateInTimeZone(job.scheduledStart, company.timezone) === todayKey;
  }).length;
  const activeJobCount = technicianJobs.filter((job) => job.status === "in_progress").length;

  return {
    ...technician,
    todayJobCount,
    activeJobCount
  };
}

export async function createTechnician(
  companyId: string,
  actorId: string,
  input: CreateTechnicianInput
): Promise<Technician> {
  const normalizedInput = normalizeCreateTechnicianInput(input);

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const linkedUser =
      normalizedInput.userId !== undefined
        ? await getLinkableUserForCreate(companyId, normalizedInput.userId, tx)
        : null;
    const insertedTechnicians = await tx
      .insert(technicians)
      .values({
        companyId,
        userId: linkedUser?.id ?? null,
        firstName: normalizedInput.firstName,
        lastName: normalizedInput.lastName,
        email: normalizedInput.email,
        phone: normalizedInput.phone,
        skills: normalizedInput.skills,
        serviceAreaIds: normalizedInput.serviceAreaIds,
        serviceZipCodes: normalizedInput.serviceZipCodes,
        availableDays: normalizedInput.availableDays,
        hoursPerDay: String(normalizedInput.hoursPerDay),
        status: normalizedInput.status,
        calendarColor: normalizedInput.calendarColor,
        notes: normalizedInput.notes
      })
      .returning();
    const technician = insertedTechnicians[0];

    if (!technician) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create technician");
    }

    if (linkedUser) {
      await tx
        .update(users)
        .set({
          technicianId: technician.id,
          updatedAt: new Date()
        })
        .where(and(eq(users.companyId, companyId), eq(users.id, linkedUser.id), isNull(users.deletedAt)));
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "technician.created",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "technician",
      entityId: technician.id,
      payload: {
        userId: technician.userId,
        status: technician.status,
        skills: technician.skills ?? []
      },
      summary: `Technician ${technician.firstName} ${technician.lastName} created`
    });

    return mapTechnicianRow(technician);
  });
}

export async function updateTechnician(
  companyId: string,
  actorId: string,
  technicianId: string,
  input: UpdateTechnicianInput
): Promise<Technician> {
  const normalizedInput = normalizeUpdateTechnicianInput(input);
  const existingTechnician = await getTechnicianRecord(companyId, technicianId, db);
  const updateValues = {
    ...(normalizedInput.firstName !== undefined ? { firstName: normalizedInput.firstName } : {}),
    ...(normalizedInput.lastName !== undefined ? { lastName: normalizedInput.lastName } : {}),
    ...(normalizedInput.email !== undefined ? { email: normalizedInput.email } : {}),
    ...(normalizedInput.phone !== undefined ? { phone: normalizedInput.phone } : {}),
    ...(normalizedInput.skills !== undefined ? { skills: normalizedInput.skills } : {}),
    ...(normalizedInput.serviceAreaIds !== undefined ? { serviceAreaIds: normalizedInput.serviceAreaIds } : {}),
    ...(normalizedInput.serviceZipCodes !== undefined ? { serviceZipCodes: normalizedInput.serviceZipCodes } : {}),
    ...(normalizedInput.availableDays !== undefined ? { availableDays: normalizedInput.availableDays } : {}),
    ...(normalizedInput.hoursPerDay !== undefined ? { hoursPerDay: String(normalizedInput.hoursPerDay) } : {}),
    ...(normalizedInput.status !== undefined ? { status: normalizedInput.status } : {}),
    ...(normalizedInput.calendarColor !== undefined ? { calendarColor: normalizedInput.calendarColor } : {}),
    ...(normalizedInput.notes !== undefined ? { notes: normalizedInput.notes } : {})
  };

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    let linkUserId: string | undefined;

    if (normalizedInput.userId !== undefined) {
      const linkableUser = await getLinkableUserForTechnician(
        companyId,
        existingTechnician,
        normalizedInput.userId,
        tx
      );
      linkUserId = linkableUser.id;

      if (existingTechnician.userId !== linkUserId) {
        await tx
          .update(users)
          .set({
            technicianId: existingTechnician.id,
            updatedAt: new Date()
          })
          .where(and(eq(users.companyId, companyId), eq(users.id, linkUserId), isNull(users.deletedAt)));
      }
    }

    const fullUpdateValues = {
      ...updateValues,
      ...(linkUserId !== undefined ? { userId: linkUserId } : {})
    };

    if (Object.keys(fullUpdateValues).length === 0) {
      return existingTechnician;
    }

    const updatedTechnicians = await tx
      .update(technicians)
      .set({
        ...fullUpdateValues,
        updatedAt: new Date()
      })
      .where(and(eq(technicians.companyId, companyId), eq(technicians.id, technicianId), isNull(technicians.deletedAt)))
      .returning();
    const updatedTechnician = updatedTechnicians[0];

    if (!updatedTechnician) {
      throw new AppError(ErrorCode.NOT_FOUND, "Technician not found");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "technician.updated",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "technician",
      entityId: updatedTechnician.id,
      payload: fullUpdateValues,
      summary: `Technician ${updatedTechnician.firstName} ${updatedTechnician.lastName} updated`
    });

    return mapTechnicianRow(updatedTechnician);
  });
}

export async function deleteTechnician(companyId: string, actorId: string, technicianId: string): Promise<void> {
  const existingTechnician = await getTechnicianRecord(companyId, technicianId, db);
  const linkedUserId = existingTechnician.userId;

  await db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const deletedAt = new Date();

    await tx
      .update(technicians)
      .set({
        userId: null,
        deletedAt,
        updatedAt: deletedAt
      })
      .where(and(eq(technicians.companyId, companyId), eq(technicians.id, technicianId), isNull(technicians.deletedAt)));

    if (linkedUserId) {
      await tx
        .update(users)
        .set({
          technicianId: null,
          updatedAt: deletedAt
        })
        .where(and(eq(users.companyId, companyId), eq(users.id, linkedUserId), isNull(users.deletedAt)));
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "technician.deleted",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "technician",
      entityId: existingTechnician.id,
      payload: {
        userId: linkedUserId
      },
      summary: `Technician ${existingTechnician.firstName} ${existingTechnician.lastName} deleted`
    });
  });
}

export async function getTechnicianAvailability(
  companyId: string,
  technicianId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityResult> {
  const normalizedRange = normalizeAvailabilityRange(startDate, endDate);
  const technician = await getTechnicianRecord(companyId, technicianId, db);
  const company = await getCompanyRecord(companyId, db);
  const rangeDates = listDateRange(normalizedRange.startDate, normalizedRange.endDate);
  const companyScheduleSlots = await listCompanyScheduleSlotsForTechnician(companyId, technicianId, db);
  const technicianHoursPerDay = parseHoursPerDay(technician.hoursPerDay);
  const availableDays = new Set((technician.availableDays ?? DEFAULT_AVAILABLE_DAYS).map((value) => value.toLowerCase()));

  const slotsByDate = new Map<string, ScheduleSlotRow[]>();

  for (const slot of companyScheduleSlots) {
    const slotDateKey = formatDateInTimeZone(slot.startTime, company.timezone);

    if (slotDateKey < normalizedRange.startDate || slotDateKey > normalizedRange.endDate) {
      continue;
    }

    const existingSlots = slotsByDate.get(slotDateKey) ?? [];
    existingSlots.push(slot);
    slotsByDate.set(slotDateKey, existingSlots);
  }

    return {
      technicianId: technician.id,
      startDate: normalizedRange.startDate,
      endDate: normalizedRange.endDate,
      days: rangeDates.map((dateKey) => {
      const daySlots = [...(slotsByDate.get(dateKey) ?? [])].sort(
        (left, right) => left.startTime.getTime() - right.startTime.getTime()
      );
      const totalBookedMinutes = daySlots.reduce(
        (sum, slot) => sum + calculateMinutesBetween(slot.startTime, slot.endTime),
        0
      );
      const isAvailableDay = availableDays.has(getWeekdayKey(parseDateKey(dateKey)));
      const totalAvailableMinutes = isAvailableDay ? Math.round(technicianHoursPerDay * 60) : 0;

      return {
        date: dateKey,
        totalBookedMinutes,
        availableMinutes: Math.max(0, totalAvailableMinutes - totalBookedMinutes),
        slots: daySlots.map((slot) => ({
          id: slot.id,
          jobId: slot.jobId,
          isBlockedTime: slot.isBlockedTime,
          blockReason: slot.blockReason,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isConfirmed: slot.isConfirmed
        }))
      };
    })
  };
}

export async function getTechnicianPerformance(
  companyId: string,
  technicianId: string
): Promise<PerformanceSummary> {
  const technician = await getTechnicianRecord(companyId, technicianId, db);
  const technicianJobs = await listCompanyJobsForTechnician(companyId, technicianId, db);
  const now = new Date();
  const last30DayThreshold = new Date(now.getTime() - 30 * 86_400_000);
  const completedJobsLast30Days = technicianJobs.filter((job) => {
    if (job.status !== "completed") {
      return false;
    }

    const completionDate = job.actualEnd ?? job.updatedAt;
    return completionDate.getTime() >= last30DayThreshold.getTime();
  });
  const revenueLast30Days = completedJobsLast30Days.reduce(
    (sum, job) => sum.add(new Decimal(job.invoiceTotal ?? "0")),
    new Decimal(0)
  );
  const averageTicket = completedJobsLast30Days.length === 0
    ? new Decimal(0)
    : revenueLast30Days.div(completedJobsLast30Days.length);

  return {
    technicianId: technician.id,
    totalJobsCompleted: technician.totalJobsCompleted ?? 0,
    avgJobDurationMinutes: technician.avgJobDurationMinutes ?? null,
    estimateCloseRate: technician.estimateCloseRate ?? null,
    avgTicketValue: technician.avgTicketValue ?? null,
    last30Days: {
      jobsCompleted: completedJobsLast30Days.length,
      revenue: toCurrencyString(revenueLast30Days),
      avgTicket: toCurrencyString(averageTicket)
    }
  };
}

export async function linkUserToTechnician(
  companyId: string,
  actorId: string,
  technicianId: string,
  userId: string
): Promise<Technician> {
  const existingTechnician = await getTechnicianRecord(companyId, technicianId, db);

  if (existingTechnician.userId === userId) {
    const existingUser = await getUserRecord(companyId, userId, db);

    if (existingUser.technicianId === technicianId) {
      return existingTechnician;
    }
  }

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const linkableUser = await getLinkableUserForTechnician(companyId, existingTechnician, userId, tx);
    const updatedTechnicians = await tx
      .update(technicians)
      .set({
        userId: linkableUser.id,
        updatedAt: new Date()
      })
      .where(and(eq(technicians.companyId, companyId), eq(technicians.id, technicianId), isNull(technicians.deletedAt)))
      .returning();
    const updatedTechnician = updatedTechnicians[0];

    if (!updatedTechnician) {
      throw new AppError(ErrorCode.NOT_FOUND, "Technician not found");
    }

    await tx
      .update(users)
      .set({
        technicianId: updatedTechnician.id,
        updatedAt: new Date()
      })
      .where(and(eq(users.companyId, companyId), eq(users.id, linkableUser.id), isNull(users.deletedAt)));

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "technician.updated",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "technician",
      entityId: updatedTechnician.id,
      payload: {
        userId: updatedTechnician.userId
      },
      summary: `Technician ${updatedTechnician.firstName} ${updatedTechnician.lastName} linked to a user`
    });

    return mapTechnicianRow(updatedTechnician);
  });
}
