import { and, eq, isNull } from "drizzle-orm";

import { featureFlags } from "@fsm/config/feature-flags";
import { customers, db, maintenancePlans } from "@fsm/db";
import { AppError, ErrorCode } from "@fsm/types";

export type LoyaltyReminderRuleFamily = "plan_cadence" | "lapsed_reactivation";

export interface LoyaltyReminderCandidate {
  ruleFamily: LoyaltyReminderRuleFamily;
  maintenancePlanId: string;
  customerId: string;
  customerName: string;
  planName: string;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  daysUntilDue: number | null;
  dryRun: boolean;
}

function parseIsoDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid date");
  }
  return date;
}

function daysBetweenUtc(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function listLoyaltyReminderCandidates(
  companyId: string,
  input: { horizonDays: number }
): Promise<{ candidates: LoyaltyReminderCandidate[]; dryRun: boolean }> {
  // FEATURE FLAG: loyalty-reminders-enabled — FS-72 (default false)
  if (!featureFlags.loyaltyRemindersEnabled) {
    return { candidates: [], dryRun: true };
  }

  const horizonDays = Math.min(Math.max(input.horizonDays, 1), 90);
  const today = todayUtc();
  const horizonEnd = new Date(today);
  horizonEnd.setUTCDate(horizonEnd.getUTCDate() + horizonDays);

  const plans = await db
    .select()
    .from(maintenancePlans)
    .where(
      and(
        eq(maintenancePlans.companyId, companyId),
        eq(maintenancePlans.status, "active"),
        isNull(maintenancePlans.deletedAt)
      )
    );

  const customerRows = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName
    })
    .from(customers)
    .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)));

  const customerNameById = new Map(
    customerRows.map((row) => [row.id, `${row.firstName} ${row.lastName}`.trim()])
  );

  const dryRun = featureFlags.loyaltyRemindersDryRun;

  const candidates: LoyaltyReminderCandidate[] = [];

  for (const plan of plans) {
    if (!plan.nextServiceDate) {
      continue;
    }

    const dueDate = parseIsoDate(plan.nextServiceDate);
    if (dueDate.getTime() > horizonEnd.getTime()) {
      continue;
    }

    const daysUntilDue = daysBetweenUtc(today, dueDate);

    candidates.push({
      ruleFamily: daysUntilDue < 0 ? "lapsed_reactivation" : "plan_cadence",
      maintenancePlanId: plan.id,
      customerId: plan.customerId,
      customerName: customerNameById.get(plan.customerId) ?? "Unknown customer",
      planName: plan.name,
      nextServiceDate: plan.nextServiceDate,
      lastServiceDate: plan.lastServiceDate ?? null,
      daysUntilDue,
      dryRun
    });
  }

  candidates.sort((left, right) => {
    const leftDays = left.daysUntilDue ?? 999;
    const rightDays = right.daysUntilDue ?? 999;
    return leftDays - rightDays;
  });

  return { candidates, dryRun };
}
