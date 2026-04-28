import { and, eq, isNull } from "drizzle-orm";

import {
  assets,
  customers,
  db,
  emitEventWithExecutor,
  properties,
  users
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CreatePropertyInput,
  type Property,
  type PropertyWithAssets,
  type UpdatePropertyInput
} from "@fsm/types";

import {
  CreatePropertySchema,
  UpdatePropertySchema
} from "../routes/customers/schemas.js";

const MAX_RESULT_WINDOW = 10_000;

type CustomerRow = typeof customers.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type AssetRow = typeof assets.$inferSelect;
type UserRow = typeof users.$inferSelect;
type SelectExecutor = Pick<typeof db, "select">;
type TransactionExecutor = Pick<typeof db, "select" | "insert" | "update">;

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

async function listPropertyAssets(
  companyId: string,
  customerId: string,
  propertyId: string,
  executor: SelectExecutor
): Promise<AssetRow[]> {
  return executor
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

export async function listProperties(companyId: string, customerId: string): Promise<Property[]> {
  await getCustomerRecord(companyId, customerId, db);

  return db
    .select()
    .from(properties)
    .where(and(eq(properties.companyId, companyId), eq(properties.customerId, customerId), isNull(properties.deletedAt)))
    .limit(MAX_RESULT_WINDOW);
}

export async function getProperty(
  companyId: string,
  customerId: string,
  propertyId: string
): Promise<PropertyWithAssets> {
  await getCustomerRecord(companyId, customerId, db);
  const property = await getPropertyRecord(companyId, customerId, propertyId, db);
  const propertyAssets = await listPropertyAssets(companyId, customerId, propertyId, db);

  return {
    ...property,
    assets: propertyAssets
  };
}

export async function createProperty(
  companyId: string,
  actorId: string,
  customerId: string,
  input: CreatePropertyInput
): Promise<Property> {
  const parsedInput = CreatePropertySchema.parse(input);
  await getCustomerRecord(companyId, customerId, db);

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);

    if (parsedInput.isPrimary === true) {
      await tx
        .update(properties)
        .set({
          isPrimary: false,
          updatedAt: new Date()
        })
        .where(and(eq(properties.companyId, companyId), eq(properties.customerId, customerId), isNull(properties.deletedAt)));
    }

    const insertedProperties = await tx
      .insert(properties)
      .values({
        companyId,
        customerId,
        addressLine1: parsedInput.addressLine1.trim(),
        addressLine2: normalizeOptionalString(parsedInput.addressLine2) ?? null,
        city: parsedInput.city.trim(),
        state: parsedInput.state.trim(),
        zip: parsedInput.zip.trim(),
        country: normalizeOptionalString(parsedInput.country) ?? "US",
        type: parsedInput.type,
        sqft: parsedInput.sqft ?? null,
        yearBuilt: parsedInput.yearBuilt ?? null,
        accessNotes: normalizeOptionalString(parsedInput.accessNotes) ?? null,
        notes: normalizeOptionalString(parsedInput.notes) ?? null,
        isPrimary: parsedInput.isPrimary ?? false
      })
      .returning();
    const property = insertedProperties[0];

    if (!property) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create property");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "property.created",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "property",
      entityId: property.id,
      customerId,
      payload: {
        addressLine1: property.addressLine1,
        isPrimary: property.isPrimary
      },
      summary: `Property ${property.addressLine1} created`
    });

    return property;
  });
}

export async function updateProperty(
  companyId: string,
  actorId: string,
  customerId: string,
  propertyId: string,
  input: UpdatePropertyInput
): Promise<Property> {
  const parsedInput = UpdatePropertySchema.parse(input);
  const existingProperty = await getPropertyRecord(companyId, customerId, propertyId, db);
  const updateValues = {
    ...(parsedInput.addressLine1 !== undefined ? { addressLine1: parsedInput.addressLine1.trim() } : {}),
    ...(parsedInput.addressLine2 !== undefined ? { addressLine2: normalizeOptionalString(parsedInput.addressLine2) ?? null } : {}),
    ...(parsedInput.city !== undefined ? { city: parsedInput.city.trim() } : {}),
    ...(parsedInput.state !== undefined ? { state: parsedInput.state.trim() } : {}),
    ...(parsedInput.zip !== undefined ? { zip: parsedInput.zip.trim() } : {}),
    ...(parsedInput.country !== undefined ? { country: normalizeOptionalString(parsedInput.country) ?? "US" } : {}),
    ...(parsedInput.type !== undefined ? { type: parsedInput.type } : {}),
    ...(parsedInput.sqft !== undefined ? { sqft: parsedInput.sqft } : {}),
    ...(parsedInput.yearBuilt !== undefined ? { yearBuilt: parsedInput.yearBuilt } : {}),
    ...(parsedInput.accessNotes !== undefined ? { accessNotes: normalizeOptionalString(parsedInput.accessNotes) ?? null } : {}),
    ...(parsedInput.notes !== undefined ? { notes: normalizeOptionalString(parsedInput.notes) ?? null } : {}),
    ...(parsedInput.isPrimary !== undefined ? { isPrimary: parsedInput.isPrimary } : {})
  };

  if (Object.keys(updateValues).length === 0) {
    return existingProperty;
  }

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);

    if (parsedInput.isPrimary === true) {
      await tx
        .update(properties)
        .set({
          isPrimary: false,
          updatedAt: new Date()
        })
        .where(and(eq(properties.companyId, companyId), eq(properties.customerId, customerId), isNull(properties.deletedAt)));
    }

    const updatedProperties = await tx
      .update(properties)
      .set({
        ...updateValues,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(properties.companyId, companyId),
          eq(properties.customerId, customerId),
          eq(properties.id, propertyId),
          isNull(properties.deletedAt)
        )
      )
      .returning();
    const updatedProperty = updatedProperties[0];

    if (!updatedProperty) {
      throw new AppError(ErrorCode.NOT_FOUND, "Property not found");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "property.updated",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "property",
      entityId: updatedProperty.id,
      customerId,
      payload: updateValues,
      summary: `Property ${updatedProperty.addressLine1} updated`
    });

    return updatedProperty;
  });
}

export async function deleteProperty(
  companyId: string,
  actorId: string,
  customerId: string,
  propertyId: string
): Promise<void> {
  await getCustomerRecord(companyId, customerId, db);
  const existingProperty = await getPropertyRecord(companyId, customerId, propertyId, db);

  await db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const propertyAssets = await listPropertyAssets(companyId, customerId, propertyId, tx);
    const deletedAt = new Date();

    await tx
      .update(properties)
      .set({
        deletedAt,
        updatedAt: deletedAt
      })
      .where(
        and(
          eq(properties.companyId, companyId),
          eq(properties.customerId, customerId),
          eq(properties.id, propertyId),
          isNull(properties.deletedAt)
        )
      );

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
          isNull(assets.deletedAt)
        )
      );

    for (const asset of propertyAssets) {
      await emitEventWithExecutor(tx, {
        companyId,
        eventType: "asset.deleted",
        actorId,
        actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
        entityType: "asset",
        entityId: asset.id,
        customerId,
        payload: {
          propertyId
        },
        summary: `Asset ${asset.name} deleted`
      });
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "property.deleted",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "property",
      entityId: existingProperty.id,
      customerId,
      summary: `Property ${existingProperty.addressLine1} deleted`
    });
  });
}
