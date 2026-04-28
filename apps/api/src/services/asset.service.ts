import { and, eq, isNull } from "drizzle-orm";

import {
  assets,
  customers,
  db,
  emitEventWithExecutor,
  jobs,
  maintenancePlans,
  properties,
  users
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type Asset,
  type AssetWithJobCount,
  type CreateAssetInput,
  type UpdateAssetInput
} from "@fsm/types";

import {
  CreateAssetSchema,
  UpdateAssetSchema
} from "../routes/customers/schemas.js";

const MAX_RESULT_WINDOW = 10_000;

type CustomerRow = typeof customers.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type AssetRow = typeof assets.$inferSelect;
type JobRow = typeof jobs.$inferSelect;
type MaintenancePlanRow = typeof maintenancePlans.$inferSelect;
type UserRow = typeof users.$inferSelect;
type SelectExecutor = Pick<typeof db, "select">;

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

function addMonthsToIsoDate(dateValue: string, monthsToAdd: number): string {
  const [yearPart, monthPart, dayPart] = dateValue.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCMonth(date.getUTCMonth() + monthsToAdd);

  return date.toISOString().slice(0, 10);
}

function calculateNextServiceDate(dateValue: string, frequency: MaintenancePlanRow["frequency"]): string {
  switch (frequency) {
    case "monthly":
      return addMonthsToIsoDate(dateValue, 1);
    case "bi_monthly":
      return addMonthsToIsoDate(dateValue, 2);
    case "quarterly":
      return addMonthsToIsoDate(dateValue, 3);
    case "bi_annual":
      return addMonthsToIsoDate(dateValue, 6);
    case "annual":
      return addMonthsToIsoDate(dateValue, 12);
  }
}

async function getActor(companyId: string, actorId: string, executor: SelectExecutor): Promise<UserRow | null> {
  const [actor] = await executor
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, actorId), isNull(users.deletedAt)))
    .limit(1);

  return actor ?? null;
}

async function getCustomerRecord(
  companyId: string,
  customerId: string,
  executor: SelectExecutor
): Promise<CustomerRow> {
  const [customer] = await executor
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), eq(customers.id, customerId), isNull(customers.deletedAt)))
    .limit(1);

  if (!customer) {
    throw new AppError(ErrorCode.NOT_FOUND, "Customer not found");
  }

  return customer;
}

async function getPropertyRecord(
  companyId: string,
  customerId: string,
  propertyId: string,
  executor: SelectExecutor
): Promise<PropertyRow> {
  const [property] = await executor
    .select()
    .from(properties)
    .where(
      and(
        eq(properties.companyId, companyId),
        eq(properties.customerId, customerId),
        eq(properties.id, propertyId),
        isNull(properties.deletedAt)
      )
    )
    .limit(1);

  if (!property) {
    throw new AppError(ErrorCode.NOT_FOUND, "Property not found");
  }

  return property;
}

async function getAssetRecord(
  companyId: string,
  customerId: string,
  propertyId: string,
  assetId: string,
  executor: SelectExecutor
): Promise<AssetRow> {
  const [asset] = await executor
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.companyId, companyId),
        eq(assets.customerId, customerId),
        eq(assets.propertyId, propertyId),
        eq(assets.id, assetId),
        isNull(assets.deletedAt)
      )
    )
    .limit(1);

  if (!asset) {
    throw new AppError(ErrorCode.NOT_FOUND, "Asset not found");
  }

  return asset;
}

async function findActiveMaintenancePlanForAsset(
  companyId: string,
  customerId: string,
  propertyId: string,
  assetId: string,
  executor: SelectExecutor
): Promise<MaintenancePlanRow | null> {
  const companyPlans = await executor
    .select()
    .from(maintenancePlans)
    .where(and(eq(maintenancePlans.companyId, companyId), eq(maintenancePlans.customerId, customerId), isNull(maintenancePlans.deletedAt)))
    .limit(MAX_RESULT_WINDOW);

  return (
    companyPlans.find((plan) => {
      if (plan.status !== "active") {
        return false;
      }

      if (plan.propertyId !== null && plan.propertyId !== propertyId) {
        return false;
      }

      return (plan.assetIds ?? []).includes(assetId);
    }) ?? null
  );
}

export async function listAssets(companyId: string, customerId: string, propertyId: string): Promise<Asset[]> {
  await getCustomerRecord(companyId, customerId, db);
  await getPropertyRecord(companyId, customerId, propertyId, db);

  return db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.companyId, companyId),
        eq(assets.customerId, customerId),
        eq(assets.propertyId, propertyId),
        isNull(assets.deletedAt)
      )
    )
    .limit(MAX_RESULT_WINDOW);
}

export async function getAsset(
  companyId: string,
  customerId: string,
  propertyId: string,
  assetId: string
): Promise<AssetWithJobCount> {
  await getCustomerRecord(companyId, customerId, db);
  await getPropertyRecord(companyId, customerId, propertyId, db);
  const asset = await getAssetRecord(companyId, customerId, propertyId, assetId, db);
  const relatedJobs = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.assetId, assetId), isNull(jobs.deletedAt)))
    .limit(MAX_RESULT_WINDOW);

  return {
    ...asset,
    jobCount: relatedJobs.length
  };
}

export async function createAsset(
  companyId: string,
  actorId: string,
  customerId: string,
  propertyId: string,
  input: CreateAssetInput
): Promise<Asset> {
  const parsedInput = CreateAssetSchema.parse(input);
  await getCustomerRecord(companyId, customerId, db);
  await getPropertyRecord(companyId, customerId, propertyId, db);

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const insertedAssets = await tx
      .insert(assets)
      .values({
        companyId,
        customerId,
        propertyId,
        name: parsedInput.name.trim(),
        assetType: parsedInput.assetType.trim(),
        brand: normalizeOptionalString(parsedInput.brand) ?? null,
        model: normalizeOptionalString(parsedInput.model) ?? null,
        serialNumber: normalizeOptionalString(parsedInput.serialNumber) ?? null,
        installDate: parsedInput.installDate ?? null,
        warrantyExpiration: parsedInput.warrantyExpiration ?? null,
        condition: parsedInput.condition ?? null,
        conditionNotes: normalizeOptionalString(parsedInput.conditionNotes) ?? null,
        notes: normalizeOptionalString(parsedInput.notes) ?? null
      })
      .returning();
    const asset = insertedAssets[0];

    if (!asset) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create asset");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "asset.created",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "asset",
      entityId: asset.id,
      customerId,
      payload: {
        propertyId,
        assetType: asset.assetType
      },
      summary: `Asset ${asset.name} created`
    });

    return asset;
  });
}

export async function updateAsset(
  companyId: string,
  actorId: string,
  customerId: string,
  propertyId: string,
  assetId: string,
  input: UpdateAssetInput
): Promise<Asset> {
  const parsedInput = UpdateAssetSchema.parse(input);
  await getCustomerRecord(companyId, customerId, db);
  await getPropertyRecord(companyId, customerId, propertyId, db);
  const existingAsset = await getAssetRecord(companyId, customerId, propertyId, assetId, db);

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const maintenancePlan =
      parsedInput.lastServiceDate !== undefined
        ? await findActiveMaintenancePlanForAsset(companyId, customerId, propertyId, assetId, tx)
        : null;
    const computedNextServiceDate =
      parsedInput.lastServiceDate !== undefined &&
      maintenancePlan &&
      parsedInput.nextServiceDate === undefined
        ? calculateNextServiceDate(parsedInput.lastServiceDate, maintenancePlan.frequency)
        : undefined;
    const updateValues = {
      ...(parsedInput.name !== undefined ? { name: parsedInput.name.trim() } : {}),
      ...(parsedInput.assetType !== undefined ? { assetType: parsedInput.assetType.trim() } : {}),
      ...(parsedInput.brand !== undefined ? { brand: normalizeOptionalString(parsedInput.brand) ?? null } : {}),
      ...(parsedInput.model !== undefined ? { model: normalizeOptionalString(parsedInput.model) ?? null } : {}),
      ...(parsedInput.serialNumber !== undefined ? { serialNumber: normalizeOptionalString(parsedInput.serialNumber) ?? null } : {}),
      ...(parsedInput.installDate !== undefined ? { installDate: parsedInput.installDate } : {}),
      ...(parsedInput.warrantyExpiration !== undefined ? { warrantyExpiration: parsedInput.warrantyExpiration } : {}),
      ...(parsedInput.condition !== undefined ? { condition: parsedInput.condition } : {}),
      ...(parsedInput.conditionNotes !== undefined ? { conditionNotes: normalizeOptionalString(parsedInput.conditionNotes) ?? null } : {}),
      ...(parsedInput.notes !== undefined ? { notes: normalizeOptionalString(parsedInput.notes) ?? null } : {}),
      ...(parsedInput.lastServiceDate !== undefined ? { lastServiceDate: parsedInput.lastServiceDate } : {}),
      ...(parsedInput.nextServiceDate !== undefined ? { nextServiceDate: parsedInput.nextServiceDate } : {}),
      ...(computedNextServiceDate !== undefined ? { nextServiceDate: computedNextServiceDate } : {}),
      ...(parsedInput.photoUrls !== undefined ? { photoUrls: parsedInput.photoUrls } : {})
    };

    if (Object.keys(updateValues).length === 0) {
      return existingAsset;
    }

    const updatedAssets = await tx
      .update(assets)
      .set({
        ...updateValues,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(assets.companyId, companyId),
          eq(assets.customerId, customerId),
          eq(assets.propertyId, propertyId),
          eq(assets.id, assetId),
          isNull(assets.deletedAt)
        )
      )
      .returning();
    const updatedAsset = updatedAssets[0];

    if (!updatedAsset) {
      throw new AppError(ErrorCode.NOT_FOUND, "Asset not found");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "asset.updated",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "asset",
      entityId: updatedAsset.id,
      customerId,
      payload: updateValues,
      summary: `Asset ${updatedAsset.name} updated`
    });

    if (parsedInput.lastServiceDate !== undefined) {
      await emitEventWithExecutor(tx, {
        companyId,
        eventType: "asset.serviced",
        actorId,
        actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
        entityType: "asset",
        entityId: updatedAsset.id,
        customerId,
        payload: {
          lastServiceDate: updatedAsset.lastServiceDate,
          nextServiceDate: updatedAsset.nextServiceDate
        },
        summary: `Asset ${updatedAsset.name} serviced`
      });
    }

    return updatedAsset;
  });
}

export async function deleteAsset(
  companyId: string,
  actorId: string,
  customerId: string,
  propertyId: string,
  assetId: string
): Promise<void> {
  await getCustomerRecord(companyId, customerId, db);
  await getPropertyRecord(companyId, customerId, propertyId, db);
  const existingAsset = await getAssetRecord(companyId, customerId, propertyId, assetId, db);

  await db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const deletedAt = new Date();

    await tx
      .update(assets)
      .set({
        deletedAt,
        updatedAt: deletedAt
      })
      .where(
        and(
          eq(assets.companyId, companyId),
          eq(assets.customerId, customerId),
          eq(assets.propertyId, propertyId),
          eq(assets.id, assetId),
          isNull(assets.deletedAt)
        )
      );

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "asset.deleted",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "asset",
      entityId: existingAsset.id,
      customerId,
      payload: {
        propertyId
      },
      summary: `Asset ${existingAsset.name} deleted`
    });
  });
}
