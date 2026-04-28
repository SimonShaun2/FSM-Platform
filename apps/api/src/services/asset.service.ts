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
        name: input.name.trim(),
        assetType: input.assetType.trim(),
        brand: normalizeOptionalString(input.brand) ?? null,
        model: normalizeOptionalString(input.model) ?? null,
        serialNumber: normalizeOptionalString(input.serialNumber) ?? null,
        installDate: input.installDate ?? null,
        warrantyExpiration: input.warrantyExpiration ?? null,
        condition: input.condition ?? null,
        conditionNotes: normalizeOptionalString(input.conditionNotes) ?? null,
        notes: normalizeOptionalString(input.notes) ?? null
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
  await getCustomerRecord(companyId, customerId, db);
  await getPropertyRecord(companyId, customerId, propertyId, db);
  const existingAsset = await getAssetRecord(companyId, customerId, propertyId, assetId, db);

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const maintenancePlan =
      input.lastServiceDate !== undefined
        ? await findActiveMaintenancePlanForAsset(companyId, customerId, propertyId, assetId, tx)
        : null;
    const computedNextServiceDate =
      input.lastServiceDate !== undefined &&
      maintenancePlan &&
      input.nextServiceDate === undefined
        ? calculateNextServiceDate(input.lastServiceDate, maintenancePlan.frequency)
        : undefined;
    const updateValues = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.assetType !== undefined ? { assetType: input.assetType.trim() } : {}),
      ...(input.brand !== undefined ? { brand: normalizeOptionalString(input.brand) ?? null } : {}),
      ...(input.model !== undefined ? { model: normalizeOptionalString(input.model) ?? null } : {}),
      ...(input.serialNumber !== undefined ? { serialNumber: normalizeOptionalString(input.serialNumber) ?? null } : {}),
      ...(input.installDate !== undefined ? { installDate: input.installDate } : {}),
      ...(input.warrantyExpiration !== undefined ? { warrantyExpiration: input.warrantyExpiration } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.conditionNotes !== undefined ? { conditionNotes: normalizeOptionalString(input.conditionNotes) ?? null } : {}),
      ...(input.notes !== undefined ? { notes: normalizeOptionalString(input.notes) ?? null } : {}),
      ...(input.lastServiceDate !== undefined ? { lastServiceDate: input.lastServiceDate } : {}),
      ...(input.nextServiceDate !== undefined ? { nextServiceDate: input.nextServiceDate } : {}),
      ...(computedNextServiceDate !== undefined ? { nextServiceDate: computedNextServiceDate } : {}),
      ...(input.photoUrls !== undefined ? { photoUrls: input.photoUrls } : {})
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

    if (input.lastServiceDate !== undefined) {
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
