import { randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { Decimal } from "decimal.js";
import pino from "pino";

import {
  db,
  emitEventWithExecutor,
  maintenancePlans,
  serviceAgreementTemplates,
  users
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CreateTemplateInput,
  type ServiceAgreementTemplate,
  type UpdateTemplateInput
} from "@fsm/types";

import {
  archiveStripePrice,
  createServiceAgreementPrice
} from "../lib/stripe.js";

type MaintenancePlanRow = typeof maintenancePlans.$inferSelect;
type ServiceAgreementTemplateRow = typeof serviceAgreementTemplates.$inferSelect;
type UserRow = typeof users.$inferSelect;
type SelectExecutor = Pick<typeof db, "select">;
type TransactionExecutor = Pick<typeof db, "select" | "insert" | "update">;

const logger = pino({
  name: "service-agreement-template-service"
});

function buildActorName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function normalizeOptionalString(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeStringArray(values: string[] | undefined): string[] | undefined {
  if (values === undefined) {
    return undefined;
  }

  const normalizedValues: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0 || normalizedValues.includes(trimmedValue)) {
      continue;
    }

    normalizedValues.push(trimmedValue);
  }

  return normalizedValues;
}

function normalizePriceString(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  return new Decimal(trimmedValue).toFixed(2);
}

function toTemplate(row: ServiceAgreementTemplateRow): ServiceAgreementTemplate {
  return {
    ...row,
    frequency: row.frequency as ServiceAgreementTemplate["frequency"]
  };
}

function buildTemplateSummary(templateName: string, eventLabel: string): string {
  return `Service agreement template ${templateName} ${eventLabel}`;
}

async function getActor(companyId: string, actorId: string, executor: SelectExecutor): Promise<UserRow> {
  const [actor] = await executor
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, actorId), isNull(users.deletedAt)))
    .limit(1);

  if (!actor) {
    throw new AppError(ErrorCode.NOT_FOUND, "User not found");
  }

  return actor;
}

async function getTemplateRecord(
  companyId: string,
  templateId: string,
  executor: SelectExecutor
): Promise<ServiceAgreementTemplateRow> {
  const [template] = await executor
    .select()
    .from(serviceAgreementTemplates)
    .where(
      and(
        eq(serviceAgreementTemplates.companyId, companyId),
        eq(serviceAgreementTemplates.id, templateId),
        isNull(serviceAgreementTemplates.deletedAt)
      )
    )
    .limit(1);

  if (!template) {
    throw new AppError(ErrorCode.NOT_FOUND, "Service agreement template not found");
  }

  return template;
}

async function emitTemplateEvent(
  executor: TransactionExecutor,
  input: {
    template: ServiceAgreementTemplateRow;
    actor: UserRow;
    eventType:
      | "service_agreement_template.created"
      | "service_agreement_template.updated"
      | "service_agreement_template.deleted";
    summary: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  await emitEventWithExecutor(executor, {
    companyId: input.template.companyId,
    eventType: input.eventType,
    actorId: input.actor.id,
    actorName: buildActorName(input.actor.firstName, input.actor.lastName),
    entityType: "service_agreement_template",
    entityId: input.template.id,
    payload: input.payload ?? {},
    summary: input.summary
  });
}

function normalizeCreateTemplateInput(input: CreateTemplateInput) {
  return {
    name: input.name.trim(),
    description: normalizeOptionalString(input.description) ?? null,
    includedServices: normalizeStringArray(input.includedServices) ?? [],
    visitsPerYear: input.visitsPerYear,
    frequency: input.frequency,
    monthlyPrice: normalizePriceString(input.monthlyPrice) ?? null,
    annualPrice: normalizePriceString(input.annualPrice) ?? null,
    applicableAssetTypes: normalizeStringArray(input.applicableAssetTypes) ?? [],
    sortOrder: input.sortOrder ?? 0,
    notes: normalizeOptionalString(input.notes) ?? null
  };
}

function normalizeUpdateTemplateInput(input: UpdateTemplateInput) {
  return {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined ? { description: normalizeOptionalString(input.description) ?? null } : {}),
    ...(input.includedServices !== undefined
      ? { includedServices: normalizeStringArray(input.includedServices) ?? [] }
      : {}),
    ...(input.visitsPerYear !== undefined ? { visitsPerYear: input.visitsPerYear } : {}),
    ...(input.frequency !== undefined ? { frequency: input.frequency } : {}),
    ...(input.monthlyPrice !== undefined ? { monthlyPrice: normalizePriceString(input.monthlyPrice) ?? null } : {}),
    ...(input.annualPrice !== undefined ? { annualPrice: normalizePriceString(input.annualPrice) ?? null } : {}),
    ...(input.applicableAssetTypes !== undefined
      ? { applicableAssetTypes: normalizeStringArray(input.applicableAssetTypes) ?? [] }
      : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    ...(input.notes !== undefined ? { notes: normalizeOptionalString(input.notes) ?? null } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
  };
}

async function listTemplatePlans(
  companyId: string,
  templateId: string,
  executor: SelectExecutor
): Promise<MaintenancePlanRow[]> {
  return executor
    .select()
    .from(maintenancePlans)
    .where(
      and(
        eq(maintenancePlans.companyId, companyId),
        eq(maintenancePlans.serviceAgreementTemplateId, templateId),
        isNull(maintenancePlans.deletedAt)
      )
    );
}

export async function listTemplates(companyId: string): Promise<ServiceAgreementTemplate[]> {
  const rows = await db
    .select()
    .from(serviceAgreementTemplates)
    .where(and(eq(serviceAgreementTemplates.companyId, companyId), isNull(serviceAgreementTemplates.deletedAt)));

  return rows
    .filter((row) => row.isActive)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((row) => toTemplate(row));
}

export async function createTemplate(
  companyId: string,
  actorId: string,
  input: CreateTemplateInput
): Promise<ServiceAgreementTemplate> {
  const templateId = randomUUID();
  const normalizedInput = normalizeCreateTemplateInput(input);
  const createdPriceIds: string[] = [];

  const monthlyPriceId = normalizedInput.monthlyPrice
    ? (await createServiceAgreementPrice({
        companyId,
        templateId,
        name: normalizedInput.name,
        amount: normalizedInput.monthlyPrice,
        interval: "month"
      })).id
    : null;
  if (monthlyPriceId) {
    createdPriceIds.push(monthlyPriceId);
  }

  const annualPriceId = normalizedInput.annualPrice
    ? (await createServiceAgreementPrice({
        companyId,
        templateId,
        name: normalizedInput.name,
        amount: normalizedInput.annualPrice,
        interval: "year"
      })).id
    : null;
  if (annualPriceId) {
    createdPriceIds.push(annualPriceId);
  }

  try {
    const createdTemplate = await db.transaction(async (tx) => {
      const actor = await getActor(companyId, actorId, tx);
      const insertedTemplates = await tx
        .insert(serviceAgreementTemplates)
        .values({
          id: templateId,
          companyId,
          name: normalizedInput.name,
          description: normalizedInput.description,
          includedServices: normalizedInput.includedServices,
          visitsPerYear: normalizedInput.visitsPerYear,
          frequency: normalizedInput.frequency,
          monthlyPrice: normalizedInput.monthlyPrice,
          annualPrice: normalizedInput.annualPrice,
          stripeMthlyPriceId: monthlyPriceId,
          stripeAnnualPriceId: annualPriceId,
          applicableAssetTypes: normalizedInput.applicableAssetTypes,
          sortOrder: normalizedInput.sortOrder,
          notes: normalizedInput.notes,
          isActive: true
        })
        .returning();
      const template = insertedTemplates[0];

      if (!template) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create service agreement template");
      }

      await emitTemplateEvent(tx, {
        template,
        actor,
        eventType: "service_agreement_template.created",
        summary: buildTemplateSummary(template.name, "created")
      });

      return template;
    });

    return toTemplate(createdTemplate);
  } catch (error) {
    for (const priceId of createdPriceIds) {
      try {
        await archiveStripePrice(priceId);
      } catch (archiveError: unknown) {
        logger.error({ err: archiveError, companyId, templateId, priceId }, "Failed to archive created Stripe price after template create error");
      }
    }

    throw error;
  }
}

export async function updateTemplate(
  companyId: string,
  actorId: string,
  templateId: string,
  input: UpdateTemplateInput
): Promise<ServiceAgreementTemplate> {
  const existingTemplate = await getTemplateRecord(companyId, templateId, db);
  const existingMonthlyPriceId = existingTemplate.stripeMthlyPriceId;
  const existingAnnualPriceId = existingTemplate.stripeAnnualPriceId;
  const normalizedInput = normalizeUpdateTemplateInput(input);
  const newMonthlyPrice = normalizedInput.monthlyPrice;
  const newAnnualPrice = normalizedInput.annualPrice;
  const monthlyPriceChanged = newMonthlyPrice !== undefined && newMonthlyPrice !== existingTemplate.monthlyPrice;
  const annualPriceChanged = newAnnualPrice !== undefined && newAnnualPrice !== existingTemplate.annualPrice;
  const createdPriceIds: string[] = [];

  const newMonthlyPriceId =
    monthlyPriceChanged && newMonthlyPrice
      ? (await createServiceAgreementPrice({
          companyId,
          templateId,
          name: normalizedInput.name ?? existingTemplate.name,
          amount: newMonthlyPrice,
          interval: "month"
        })).id
      : undefined;
  if (newMonthlyPriceId) {
    createdPriceIds.push(newMonthlyPriceId);
  }

  const newAnnualPriceId =
    annualPriceChanged && newAnnualPrice
      ? (await createServiceAgreementPrice({
          companyId,
          templateId,
          name: normalizedInput.name ?? existingTemplate.name,
          amount: newAnnualPrice,
          interval: "year"
        })).id
      : undefined;
  if (newAnnualPriceId) {
    createdPriceIds.push(newAnnualPriceId);
  }

  try {
    const updatedTemplate = await db.transaction(async (tx) => {
      const actor = await getActor(companyId, actorId, tx);
      const updatedTemplates = await tx
        .update(serviceAgreementTemplates)
        .set({
          ...(normalizedInput.name !== undefined ? { name: normalizedInput.name } : {}),
          ...(normalizedInput.description !== undefined ? { description: normalizedInput.description } : {}),
          ...(normalizedInput.includedServices !== undefined
            ? { includedServices: normalizedInput.includedServices }
            : {}),
          ...(normalizedInput.visitsPerYear !== undefined ? { visitsPerYear: normalizedInput.visitsPerYear } : {}),
          ...(normalizedInput.frequency !== undefined ? { frequency: normalizedInput.frequency } : {}),
          ...(normalizedInput.monthlyPrice !== undefined ? { monthlyPrice: normalizedInput.monthlyPrice } : {}),
          ...(normalizedInput.annualPrice !== undefined ? { annualPrice: normalizedInput.annualPrice } : {}),
          ...(newMonthlyPriceId !== undefined
            ? { stripeMthlyPriceId: newMonthlyPriceId }
            : monthlyPriceChanged && newMonthlyPrice === null
              ? { stripeMthlyPriceId: null }
              : {}),
          ...(newAnnualPriceId !== undefined
            ? { stripeAnnualPriceId: newAnnualPriceId }
            : annualPriceChanged && newAnnualPrice === null
              ? { stripeAnnualPriceId: null }
              : {}),
          ...(normalizedInput.applicableAssetTypes !== undefined
            ? { applicableAssetTypes: normalizedInput.applicableAssetTypes }
            : {}),
          ...(normalizedInput.sortOrder !== undefined ? { sortOrder: normalizedInput.sortOrder } : {}),
          ...(normalizedInput.notes !== undefined ? { notes: normalizedInput.notes } : {}),
          ...(normalizedInput.isActive !== undefined ? { isActive: normalizedInput.isActive } : {}),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(serviceAgreementTemplates.companyId, companyId),
            eq(serviceAgreementTemplates.id, templateId),
            isNull(serviceAgreementTemplates.deletedAt)
          )
        )
        .returning();
      const template = updatedTemplates[0];

      if (!template) {
        throw new AppError(ErrorCode.NOT_FOUND, "Service agreement template not found");
      }

      await emitTemplateEvent(tx, {
        template,
        actor,
        eventType: "service_agreement_template.updated",
        summary: buildTemplateSummary(template.name, "updated")
      });

      return template;
    });

    if (monthlyPriceChanged && existingMonthlyPriceId) {
      await archiveStripePrice(existingMonthlyPriceId);
    }

    if (annualPriceChanged && existingAnnualPriceId) {
      await archiveStripePrice(existingAnnualPriceId);
    }

    return toTemplate(updatedTemplate);
  } catch (error) {
    for (const priceId of createdPriceIds) {
      try {
        await archiveStripePrice(priceId);
      } catch (archiveError: unknown) {
        logger.error({ err: archiveError, companyId, templateId, priceId }, "Failed to archive created Stripe price after template update error");
      }
    }

    throw error;
  }
}

export async function deleteTemplate(companyId: string, actorId: string, templateId: string): Promise<void> {
  const template = await getTemplateRecord(companyId, templateId, db);
  const plans = await listTemplatePlans(companyId, template.id, db);
  const hasActivePlans = plans.some((plan) => !["cancelled", "expired"].includes(plan.status));

  if (hasActivePlans) {
    throw new AppError(ErrorCode.CONFLICT, "Template has active plans");
  }

  await db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const updatedTemplates = await tx
      .update(serviceAgreementTemplates)
      .set({
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(serviceAgreementTemplates.companyId, companyId),
          eq(serviceAgreementTemplates.id, template.id),
          isNull(serviceAgreementTemplates.deletedAt)
        )
      )
      .returning();
    const deletedTemplate = updatedTemplates[0];

    if (!deletedTemplate) {
      throw new AppError(ErrorCode.NOT_FOUND, "Service agreement template not found");
    }

    await emitTemplateEvent(tx, {
      template: deletedTemplate,
      actor,
      eventType: "service_agreement_template.deleted",
      summary: buildTemplateSummary(deletedTemplate.name, "deleted")
    });
  });
}
