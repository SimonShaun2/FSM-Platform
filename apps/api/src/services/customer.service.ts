import { and, eq, isNull } from "drizzle-orm";

import {
  assets,
  customers,
  db,
  emitEventWithExecutor,
  maintenancePlans,
  properties,
  users
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CreateCustomerInput,
  type Customer,
  type CustomerWithGraph,
  type ListCustomersQuery,
  type PaginatedResult,
  type UpdateCustomerInput
} from "@fsm/types";

import {
  CreateCustomerSchema,
  ListCustomersQuerySchema,
  SearchCustomersQuerySchema,
  UpdateCustomerSchema
} from "../routes/customers/schemas.js";

const MAX_RESULT_WINDOW = 10_000;

type CustomerRow = typeof customers.$inferSelect;
type PropertyRow = typeof properties.$inferSelect;
type AssetRow = typeof assets.$inferSelect;
type MaintenancePlanRow = typeof maintenancePlans.$inferSelect;
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

function normalizeOptionalEmail(value: string | undefined): string | null | undefined {
  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined || normalizedValue === null) {
    return normalizedValue;
  }

  return normalizedValue.toLowerCase();
}

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }

  return tags
    .map((tag) => tag.trim())
    .filter((tag, index, values) => tag.length > 0 && values.indexOf(tag) === index);
}

function normalizeSearchValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function matchesCustomerSearch(customer: CustomerRow, search: string): boolean {
  const haystacks = [
    customer.firstName,
    customer.lastName,
    customer.displayName,
    customer.email,
    customer.phone,
    customer.altPhone
  ];

  return haystacks.some((value) => normalizeSearchValue(value).includes(search));
}

function matchesTagFilter(customer: CustomerRow, tags: string[]): boolean {
  const customerTags = customer.tags ?? [];
  return tags.some((tag) => customerTags.includes(tag));
}

function compareNullableStrings(left: string | null, right: string | null, sortOrder: "asc" | "desc"): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return sortOrder === "asc" ? 1 : -1;
  }

  if (right === null) {
    return sortOrder === "asc" ? -1 : 1;
  }

  return sortOrder === "asc" ? left.localeCompare(right) : right.localeCompare(left);
}

function compareNullableNumbers(left: number | string | null, right: number | string | null, sortOrder: "asc" | "desc"): number {
  const leftNumber = left === null ? null : Number(left);
  const rightNumber = right === null ? null : Number(right);

  if (leftNumber === rightNumber) {
    return 0;
  }

  if (leftNumber === null) {
    return sortOrder === "asc" ? 1 : -1;
  }

  if (rightNumber === null) {
    return sortOrder === "asc" ? -1 : 1;
  }

  return sortOrder === "asc" ? leftNumber - rightNumber : rightNumber - leftNumber;
}

function compareDates(left: Date, right: Date, sortOrder: "asc" | "desc"): number {
  return sortOrder === "asc" ? left.getTime() - right.getTime() : right.getTime() - left.getTime();
}

function sortCustomersList(
  list: CustomerRow[],
  sortBy: NonNullable<ListCustomersQuery["sortBy"]>,
  sortOrder: NonNullable<ListCustomersQuery["sortOrder"]>
): CustomerRow[] {
  return [...list].sort((left, right) => {
    switch (sortBy) {
      case "lastName":
        return compareNullableStrings(left.lastName, right.lastName, sortOrder);
      case "lastServiceDate":
        return compareNullableStrings(left.lastServiceDate, right.lastServiceDate, sortOrder);
      case "lifetimeValue":
        return compareNullableNumbers(left.lifetimeValue, right.lifetimeValue, sortOrder);
      case "createdAt":
        return compareDates(left.createdAt, right.createdAt, sortOrder);
    }
  });
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

async function listCustomerProperties(
  companyId: string,
  customerId: string,
  executor: SelectExecutor
): Promise<PropertyRow[]> {
  return executor
    .select()
    .from(properties)
    .where(and(eq(properties.companyId, companyId), eq(properties.customerId, customerId), isNull(properties.deletedAt)))
    .limit(MAX_RESULT_WINDOW);
}

async function listCustomerAssets(
  companyId: string,
  customerId: string,
  executor: SelectExecutor
): Promise<AssetRow[]> {
  return executor
    .select()
    .from(assets)
    .where(and(eq(assets.companyId, companyId), eq(assets.customerId, customerId), isNull(assets.deletedAt)))
    .limit(MAX_RESULT_WINDOW);
}

function buildCustomerGraph(customer: CustomerRow, propertyRows: PropertyRow[], assetRows: AssetRow[]): CustomerWithGraph {
  const assetsByPropertyId = new Map<string, AssetRow[]>();

  for (const asset of assetRows) {
    const existingAssets = assetsByPropertyId.get(asset.propertyId) ?? [];
    existingAssets.push(asset);
    assetsByPropertyId.set(asset.propertyId, existingAssets);
  }

  return {
    ...customer,
    properties: propertyRows.map((property) => ({
      ...property,
      assets: assetsByPropertyId.get(property.id) ?? []
    }))
  };
}

export async function listCustomers(
  companyId: string,
  query: ListCustomersQuery
): Promise<PaginatedResult<Customer>> {
  const parsedQuery = ListCustomersQuerySchema.parse(query);
  const companyCustomers = await db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
    .limit(MAX_RESULT_WINDOW);
  const normalizedSearch = parsedQuery.search ? normalizeSearchValue(parsedQuery.search) : null;
  const normalizedTags = parsedQuery.tags ? normalizeTags(parsedQuery.tags) ?? [] : null;

  let filteredCustomers = companyCustomers.filter((customer) => {
    if (normalizedSearch && !matchesCustomerSearch(customer, normalizedSearch)) {
      return false;
    }

    if (normalizedTags && normalizedTags.length > 0 && !matchesTagFilter(customer, normalizedTags)) {
      return false;
    }

    return true;
  });

  if (parsedQuery.hasActiveMaintenancePlan !== undefined) {
    const companyPlans = await db
      .select()
      .from(maintenancePlans)
      .where(and(eq(maintenancePlans.companyId, companyId), isNull(maintenancePlans.deletedAt)))
      .limit(MAX_RESULT_WINDOW);
    const activePlanCustomerIds = new Set(
      companyPlans.filter((plan) => plan.status === "active").map((plan) => plan.customerId)
    );

    filteredCustomers = filteredCustomers.filter((customer) =>
      parsedQuery.hasActiveMaintenancePlan ? activePlanCustomerIds.has(customer.id) : !activePlanCustomerIds.has(customer.id)
    );
  }

  const sortedCustomers = sortCustomersList(filteredCustomers, parsedQuery.sortBy, parsedQuery.sortOrder);
  const total = sortedCustomers.length;
  const offset = (parsedQuery.page - 1) * parsedQuery.limit;
  const paginatedCustomers = sortedCustomers.slice(offset, offset + parsedQuery.limit);

  return {
    data: paginatedCustomers,
    total,
    page: parsedQuery.page,
    limit: parsedQuery.limit,
    totalPages: Math.ceil(total / parsedQuery.limit)
  };
}

export async function searchCustomers(companyId: string, query: string): Promise<Customer[]> {
  const parsedQuery = SearchCustomersQuerySchema.parse({ q: query });
  const normalizedQuery = normalizeSearchValue(parsedQuery.q);
  const companyCustomers = await db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
    .limit(MAX_RESULT_WINDOW);

  return companyCustomers.filter((customer) => matchesCustomerSearch(customer, normalizedQuery)).slice(0, 10);
}

export async function getCustomer(companyId: string, customerId: string): Promise<CustomerWithGraph> {
  const customer = await getCustomerRecord(companyId, customerId, db);
  const [propertyRows, assetRows] = await Promise.all([
    listCustomerProperties(companyId, customerId, db),
    listCustomerAssets(companyId, customerId, db)
  ]);

  return buildCustomerGraph(customer, propertyRows, assetRows);
}

export async function createCustomer(
  companyId: string,
  actorId: string,
  input: CreateCustomerInput
): Promise<Customer> {
  const parsedInput = CreateCustomerSchema.parse(input);
  const normalizedTags = normalizeTags(parsedInput.tags) ?? [];

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const insertedCustomers = await tx
      .insert(customers)
      .values({
        companyId,
        firstName: parsedInput.firstName.trim(),
        lastName: parsedInput.lastName.trim(),
        displayName: normalizeOptionalString(parsedInput.displayName) ?? null,
        email: normalizeOptionalEmail(parsedInput.email) ?? null,
        phone: normalizeOptionalString(parsedInput.phone) ?? null,
        altPhone: normalizeOptionalString(parsedInput.altPhone) ?? null,
        leadSource: normalizeOptionalString(parsedInput.leadSource) ?? null,
        tags: normalizedTags,
        internalNotes: normalizeOptionalString(parsedInput.internalNotes) ?? null,
        prefersSms: parsedInput.prefersSms ?? true,
        prefersEmail: parsedInput.prefersEmail ?? true,
        doNotContact: parsedInput.doNotContact ?? false,
        firstServiceDate: null
      })
      .returning();
    const customer = insertedCustomers[0];

    if (!customer) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create customer");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "customer.created",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "customer",
      entityId: customer.id,
      customerId: customer.id,
      payload: {
        email: customer.email,
        phone: customer.phone
      },
      summary: `Customer ${customer.firstName} ${customer.lastName} created`
    });

    return customer;
  });
}

export async function updateCustomer(
  companyId: string,
  actorId: string,
  customerId: string,
  input: UpdateCustomerInput
): Promise<Customer> {
  const parsedInput = UpdateCustomerSchema.parse(input);
  const existingCustomer = await getCustomerRecord(companyId, customerId, db);
  const normalizedTags = parsedInput.tags ? normalizeTags(parsedInput.tags) ?? [] : undefined;
  const updateValues = {
    ...(parsedInput.firstName !== undefined ? { firstName: parsedInput.firstName.trim() } : {}),
    ...(parsedInput.lastName !== undefined ? { lastName: parsedInput.lastName.trim() } : {}),
    ...(parsedInput.displayName !== undefined ? { displayName: normalizeOptionalString(parsedInput.displayName) ?? null } : {}),
    ...(parsedInput.email !== undefined ? { email: normalizeOptionalEmail(parsedInput.email) ?? null } : {}),
    ...(parsedInput.phone !== undefined ? { phone: normalizeOptionalString(parsedInput.phone) ?? null } : {}),
    ...(parsedInput.altPhone !== undefined ? { altPhone: normalizeOptionalString(parsedInput.altPhone) ?? null } : {}),
    ...(parsedInput.leadSource !== undefined ? { leadSource: normalizeOptionalString(parsedInput.leadSource) ?? null } : {}),
    ...(normalizedTags !== undefined ? { tags: normalizedTags } : {}),
    ...(parsedInput.internalNotes !== undefined ? { internalNotes: normalizeOptionalString(parsedInput.internalNotes) ?? null } : {}),
    ...(parsedInput.prefersSms !== undefined ? { prefersSms: parsedInput.prefersSms } : {}),
    ...(parsedInput.prefersEmail !== undefined ? { prefersEmail: parsedInput.prefersEmail } : {}),
    ...(parsedInput.doNotContact !== undefined ? { doNotContact: parsedInput.doNotContact } : {})
  };

  if (Object.keys(updateValues).length === 0) {
    return existingCustomer;
  }

  return db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const updatedCustomers = await tx
      .update(customers)
      .set({
        ...updateValues,
        updatedAt: new Date()
      })
      .where(and(eq(customers.companyId, companyId), eq(customers.id, customerId), isNull(customers.deletedAt)))
      .returning();
    const updatedCustomer = updatedCustomers[0];

    if (!updatedCustomer) {
      throw new AppError(ErrorCode.NOT_FOUND, "Customer not found");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "customer.updated",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "customer",
      entityId: updatedCustomer.id,
      customerId: updatedCustomer.id,
      payload: updateValues,
      summary: `Customer ${updatedCustomer.firstName} ${updatedCustomer.lastName} updated`
    });

    return updatedCustomer;
  });
}

export async function deleteCustomer(companyId: string, actorId: string, customerId: string): Promise<void> {
  const existingCustomer = await getCustomerRecord(companyId, customerId, db);

  await db.transaction(async (tx) => {
    const actor = await getActor(companyId, actorId, tx);
    const [propertyRows, assetRows] = await Promise.all([
      listCustomerProperties(companyId, customerId, tx),
      listCustomerAssets(companyId, customerId, tx)
    ]);
    const deletedAt = new Date();

    await tx
      .update(customers)
      .set({
        deletedAt,
        updatedAt: deletedAt
      })
      .where(and(eq(customers.companyId, companyId), eq(customers.id, customerId), isNull(customers.deletedAt)));

    await tx
      .update(properties)
      .set({
        deletedAt,
        updatedAt: deletedAt
      })
      .where(and(eq(properties.companyId, companyId), eq(properties.customerId, customerId), isNull(properties.deletedAt)));

    await tx
      .update(assets)
      .set({
        deletedAt,
        updatedAt: deletedAt
      })
      .where(and(eq(assets.companyId, companyId), eq(assets.customerId, customerId), isNull(assets.deletedAt)));

    for (const asset of assetRows) {
      await emitEventWithExecutor(tx, {
        companyId,
        eventType: "asset.deleted",
        actorId,
        actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
        entityType: "asset",
        entityId: asset.id,
        customerId,
        payload: {
          propertyId: asset.propertyId
        },
        summary: `Asset ${asset.name} deleted`
      });
    }

    for (const property of propertyRows) {
      await emitEventWithExecutor(tx, {
        companyId,
        eventType: "property.deleted",
        actorId,
        actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
        entityType: "property",
        entityId: property.id,
        customerId,
        payload: {
          addressLine1: property.addressLine1
        },
        summary: `Property ${property.addressLine1} deleted`
      });
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "customer.deleted",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "customer",
      entityId: existingCustomer.id,
      customerId: existingCustomer.id,
      summary: `Customer ${existingCustomer.firstName} ${existingCustomer.lastName} deleted`
    });
  });
}
