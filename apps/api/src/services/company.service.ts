import { and, eq, isNull } from "drizzle-orm";

import { companies, db, emitEventWithExecutor } from "@fsm/db";
import { AppError, ErrorCode } from "@fsm/types";

import { type UpdateCompanyInput, UpdateCompanySchema } from "../routes/company/schemas.js";

type CompanyRecord = typeof companies.$inferSelect;

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
  const parsedInput = UpdateCompanySchema.parse(input);
  const existingCompany = await getCompany(companyId);
  const actor = await db.query.users.findFirst({
    where: (userTable, { and: andOperator, eq: eqOperator, isNull: isNullOperator }) =>
      andOperator(eqOperator(userTable.id, actorId), eqOperator(userTable.companyId, companyId), isNullOperator(userTable.deletedAt))
  });

  const updateValues = {
    ...(parsedInput.name !== undefined ? { name: parsedInput.name } : {}),
    ...(parsedInput.phone !== undefined ? { phone: parsedInput.phone } : {}),
    ...(parsedInput.email !== undefined ? { email: normalizeEmail(parsedInput.email) } : {}),
    ...(parsedInput.website !== undefined ? { website: parsedInput.website } : {}),
    ...(parsedInput.addressLine1 !== undefined ? { addressLine1: parsedInput.addressLine1 } : {}),
    ...(parsedInput.addressLine2 !== undefined ? { addressLine2: parsedInput.addressLine2 } : {}),
    ...(parsedInput.city !== undefined ? { city: parsedInput.city } : {}),
    ...(parsedInput.state !== undefined ? { state: parsedInput.state } : {}),
    ...(parsedInput.zip !== undefined ? { zip: parsedInput.zip } : {}),
    ...(parsedInput.timezone !== undefined ? { timezone: parsedInput.timezone } : {}),
    ...(parsedInput.logoUrl !== undefined ? { logoUrl: parsedInput.logoUrl } : {})
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
