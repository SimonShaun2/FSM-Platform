import { and, eq, isNull } from "drizzle-orm";

import {
  getPlanUsageEntitlements,
  resolveCommercialPlanFromSubscription,
  type PlanResourceLimit,
  type RenvaniPlanUsageEntitlements
} from "@fsm/config/renvani-plan-entitlements";
import type { RenvaniSubscriptionPlan } from "@fsm/config/stripe-pricing";
import { automationRules, companies, db, jobs } from "@fsm/db";
import { AppError, ErrorCode } from "@fsm/types";

import { readRenvaniSubscriptionPlan } from "./company-renvani-plan.js";

export function resolveUsageEntitlementsForSubscription(
  plan: RenvaniSubscriptionPlan | null | undefined
): RenvaniPlanUsageEntitlements {
  return getPlanUsageEntitlements(resolveCommercialPlanFromSubscription(plan));
}

function assertWithinLimit(
  resourceLabel: "jobs" | "automations",
  limit: PlanResourceLimit,
  currentCount: number
): void {
  if (limit === null) {
    return;
  }

  if (currentCount >= limit) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      `Your plan does not allow additional ${resourceLabel}. Remove a cap in plan entitlements or upgrade billing configuration.`
    );
  }
}

export function assertPlanAllowsJobCreation(
  plan: RenvaniSubscriptionPlan | null | undefined,
  activeJobCount: number
): void {
  const entitlements = resolveUsageEntitlementsForSubscription(plan);
  assertWithinLimit("jobs", entitlements.maxJobs, activeJobCount);
}

export function assertPlanAllowsAutomationEnable(
  plan: RenvaniSubscriptionPlan | null | undefined,
  enabledAutomationCount: number
): void {
  const entitlements = resolveUsageEntitlementsForSubscription(plan);
  assertWithinLimit("automations", entitlements.maxAutomations, enabledAutomationCount);
}

async function getCompanyForPlanCheck(companyId: string): Promise<{ settings: unknown }> {
  const [company] = await db
    .select({ settings: companies.settings })
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) {
    throw new AppError(ErrorCode.NOT_FOUND, "Company not found");
  }

  return company;
}

async function countActiveJobs(companyId: string): Promise<number> {
  const rows = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), isNull(jobs.deletedAt)));

  return rows.length;
}

async function countEnabledAutomations(companyId: string): Promise<number> {
  const rows = await db
    .select({ id: automationRules.id })
    .from(automationRules)
    .where(
      and(
        eq(automationRules.companyId, companyId),
        eq(automationRules.isEnabled, true),
        isNull(automationRules.deletedAt)
      )
    );

  return rows.length;
}

/** Enforces plan caps before creating a job (no-op while entitlements are unlimited). */
export async function enforceJobCreationPlanLimit(companyId: string): Promise<void> {
  const company = await getCompanyForPlanCheck(companyId);
  const plan = readRenvaniSubscriptionPlan(company);
  const activeJobCount = await countActiveJobs(companyId);
  assertPlanAllowsJobCreation(plan, activeJobCount);
}

/** Enforces plan caps before enabling an automation rule (no-op while entitlements are unlimited). */
export async function enforceAutomationEnablePlanLimit(companyId: string): Promise<void> {
  const company = await getCompanyForPlanCheck(companyId);
  const plan = readRenvaniSubscriptionPlan(company);
  const enabledCount = await countEnabledAutomations(companyId);
  assertPlanAllowsAutomationEnable(plan, enabledCount);
}
