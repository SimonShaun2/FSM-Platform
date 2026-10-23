import { and, eq, isNull, sql } from "drizzle-orm";

import { companies, db, type Database } from "@fsm/db";
import { AppError, ErrorCode } from "@fsm/types";

import type { ClerkVerifiedSession } from "../lib/clerk-auth.js";
import { readClerkOrganizationIdFromSettings } from "../lib/clerk-company-settings.js";

export { readClerkOrganizationIdFromSettings };

type SelectExecutor = Pick<Database, "select">;

type CompanyRow = typeof companies.$inferSelect;
type UserRow = Awaited<ReturnType<typeof db.query.users.findFirst>>;

export async function findCompanyByClerkOrganizationId(
  clerkOrganizationId: string,
  executor: SelectExecutor = db
): Promise<CompanyRow | null> {
  const [company] = await executor
    .select()
    .from(companies)
    .where(
      and(
        isNull(companies.deletedAt),
        sql`${companies.settings} -> 'clerk' ->> 'organizationId' = ${clerkOrganizationId}`
      )
    )
    .limit(1);

  return company ?? null;
}

export async function resolveStaffUserForClerkSession(
  companyId: string,
  session: ClerkVerifiedSession
): Promise<NonNullable<UserRow>> {
  const user =
    (session.email
      ? await db.query.users.findFirst({
          where: (userTable, operators) =>
            operators.and(
              operators.eq(userTable.companyId, companyId),
              operators.eq(userTable.email, session.email ?? ""),
              operators.isNull(userTable.deletedAt)
            )
        })
      : null) ??
    (await db.query.users.findFirst({
      where: (userTable, operators) =>
        operators.and(
          operators.eq(userTable.companyId, companyId),
          operators.isNull(userTable.deletedAt)
        )
    }));

  if (!user || !user.isActive) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "No active staff user for Clerk organization");
  }

  return user;
}
