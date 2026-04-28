import { and, eq, isNull } from "drizzle-orm";

import { companies, db, emitEventWithExecutor } from "@fsm/db";
import { AppError, ErrorCode } from "@fsm/types";

type CompanyRecord = typeof companies.$inferSelect;

interface UpdateCompanyInput {
  name?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
  addressLine1?: string | undefined;
  addressLine2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zip?: string | undefined;
  timezone?: string | undefined;
  logoUrl?: string | undefined;
}

function requireResult<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, message);
  }

  return value;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildActorName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export async function getCompany(companyId: string): Promise<CompanyRecord> {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) {
    throw new AppError(ErrorCode.NOT_FOUND, "Company not found");
  }

  return company;
}

export async function updateCompany(
  companyId: string,
  actorId: string,
  input: UpdateCompanyInput
): Promise<CompanyRecord> {
  const existingCompany = await getCompany(companyId);
  const actor = await db.query.users.findFirst({
    where: (userTable, { and: andOperator, eq: eqOperator, isNull: isNullOperator }) =>
      andOperator(eqOperator(userTable.id, actorId), eqOperator(userTable.companyId, companyId), isNullOperator(userTable.deletedAt))
  });

  const updateValues = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.email !== undefined ? { email: normalizeEmail(input.email) } : {}),
    ...(input.website !== undefined ? { website: input.website } : {}),
    ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
    ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.state !== undefined ? { state: input.state } : {}),
    ...(input.zip !== undefined ? { zip: input.zip } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {})
  };

  if (Object.keys(updateValues).length === 0) {
    return existingCompany;
  }

  return db.transaction(async (tx) => {
    const updatedCompanies = await tx
      .update(companies)
      .set({
        ...updateValues,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId))
      .returning();
    const updatedCompany = requireResult(updatedCompanies[0], "Failed to update company");

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "company.updated",
      actorId,
      actorName: actor ? buildActorName(actor.firstName, actor.lastName) : undefined,
      entityType: "company",
      entityId: companyId,
      payload: updateValues,
      summary: `${updatedCompany.name} company profile updated`
    });

    return updatedCompany;
  });
}
