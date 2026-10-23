import { and, eq, isNull } from "drizzle-orm";

import {
  companies,
  db,
  maintenancePlans,
  maintenanceVisits,
  recurringVisitOccurrences,
  recurringVisitSeries
} from "@fsm/db";

import {
  localDateTimeToUtc,
  planOccurrenceLocalDates
} from "./recurring-visit-occurrence.schedule.js";

type TransactionExecutor = Pick<typeof db, "select" | "insert" | "update">;
type MaintenancePlanRow = typeof maintenancePlans.$inferSelect;
type MaintenanceVisitRow = typeof maintenanceVisits.$inferSelect;
type RecurringVisitSeriesRow = typeof recurringVisitSeries.$inferSelect;

export const DEFAULT_RECURRING_OCCURRENCE_HORIZON = 6;

export async function resolveCompanyTimeZone(
  companyId: string,
  executor: TransactionExecutor
): Promise<string> {
  const [company] = await executor
    .select({ timezone: companies.timezone })
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  return company?.timezone?.trim() || "America/Chicago";
}

export async function getRecurringVisitSeriesForCompany(
  companyId: string,
  seriesId: string,
  executor: TransactionExecutor = db
): Promise<RecurringVisitSeriesRow | null> {
  const [series] = await executor
    .select()
    .from(recurringVisitSeries)
    .where(
      and(
        eq(recurringVisitSeries.companyId, companyId),
        eq(recurringVisitSeries.id, seriesId),
        isNull(recurringVisitSeries.deletedAt)
      )
    )
    .limit(1);

  return series ?? null;
}

export async function ensureRecurringVisitSeriesForMaintenancePlan(
  companyId: string,
  plan: MaintenancePlanRow,
  anchorVisit: MaintenanceVisitRow,
  executor: TransactionExecutor
): Promise<RecurringVisitSeriesRow> {
  const existing = await executor
    .select()
    .from(recurringVisitSeries)
    .where(
      and(
        eq(recurringVisitSeries.companyId, companyId),
        eq(recurringVisitSeries.maintenancePlanId, plan.id),
        eq(recurringVisitSeries.status, "active"),
        isNull(recurringVisitSeries.deletedAt)
      )
    )
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const timeZone = await resolveCompanyTimeZone(companyId, executor);
  const anchorLocalDate =
    anchorVisit.scheduledDate ??
    new Date().toISOString().slice(0, 10);

  const inserted = await executor
    .insert(recurringVisitSeries)
    .values({
      companyId,
      customerId: plan.customerId,
      propertyId: plan.propertyId,
      maintenancePlanId: plan.id,
      anchorMaintenanceVisitId: anchorVisit.id,
      timeZone,
      frequency: plan.frequency,
      anchorLocalDate,
      status: "active",
      externalSchedulerAuthoritative: false,
      notes: `Series from maintenance plan ${plan.id}`
    })
    .returning();

  const series = inserted[0];
  if (!series) {
    throw new Error("Failed to create recurring visit series");
  }

  return series;
}

export type GenerateOccurrencesResult = {
  requested: number;
  inserted: number;
  totalActive: number;
};

export async function generateRecurringVisitOccurrences(
  companyId: string,
  seriesId: string,
  count: number,
  executor: TransactionExecutor = db
): Promise<GenerateOccurrencesResult> {
  if (count < 1) {
    return { requested: 0, inserted: 0, totalActive: 0 };
  }

  const series = await getRecurringVisitSeriesForCompany(companyId, seriesId, executor);
  if (!series) {
    throw new Error("Recurring visit series not found for tenant");
  }

  if (series.externalSchedulerAuthoritative) {
    return { requested: count, inserted: 0, totalActive: 0 };
  }

  const localDates = planOccurrenceLocalDates(series.anchorLocalDate, series.frequency, count);
  let inserted = 0;

  for (let occurrenceIndex = 0; occurrenceIndex < localDates.length; occurrenceIndex++) {
    const scheduledLocalDate = localDates[occurrenceIndex];
    if (!scheduledLocalDate) {
      continue;
    }

    const scheduledAtUtc = localDateTimeToUtc(
      scheduledLocalDate,
      series.localTime,
      series.timeZone
    );

    const [existing] = await executor
      .select({ id: recurringVisitOccurrences.id })
      .from(recurringVisitOccurrences)
      .where(
        and(
          eq(recurringVisitOccurrences.companyId, companyId),
          eq(recurringVisitOccurrences.seriesId, series.id),
          eq(recurringVisitOccurrences.occurrenceIndex, occurrenceIndex),
          isNull(recurringVisitOccurrences.deletedAt)
        )
      )
      .limit(1);

    if (existing) {
      continue;
    }

    const rows = await executor
      .insert(recurringVisitOccurrences)
      .values({
        companyId,
        seriesId: series.id,
        occurrenceIndex,
        scheduledLocalDate,
        scheduledAtUtc,
        status: "scheduled",
        maintenanceVisitId: occurrenceIndex === 0 ? series.anchorMaintenanceVisitId : null
      })
      .returning({ id: recurringVisitOccurrences.id });

    if (rows.length > 0) {
      inserted += 1;
    }
  }

  const activeRows = await executor
    .select({ id: recurringVisitOccurrences.id })
    .from(recurringVisitOccurrences)
    .where(
      and(
        eq(recurringVisitOccurrences.companyId, companyId),
        eq(recurringVisitOccurrences.seriesId, seriesId),
        isNull(recurringVisitOccurrences.deletedAt)
      )
    );

  return {
    requested: count,
    inserted,
    totalActive: activeRows.length
  };
}
