import { and, eq, isNull, sql } from "drizzle-orm";

import { db, estimates } from "@fsm/db";

const ESTIMATE_NUMBER_PREFIX = "EST-";
const ESTIMATE_NUMBER_PADDING = 4;
const MAX_ESTIMATE_NUMBER_WINDOW = 10_000;

type EstimateNumberExecutor = Pick<typeof db, "select"> &
  Partial<Pick<typeof db, "execute">>;

function parseEstimateNumberSuffix(estimateNumber: string | null): number {
  if (!estimateNumber || !estimateNumber.startsWith(ESTIMATE_NUMBER_PREFIX)) {
    return 0;
  }

  const suffix = Number.parseInt(estimateNumber.slice(ESTIMATE_NUMBER_PREFIX.length), 10);
  return Number.isFinite(suffix) ? suffix : 0;
}

async function loadLockedEstimateNumbers(
  executor: EstimateNumberExecutor,
  companyId: string
): Promise<Array<{ estimateNumber: string | null }>> {
  if (executor.execute) {
    const result = await executor.execute(
      sql`
        select estimate_number as "estimateNumber"
        from estimates
        where company_id = ${companyId}
          and deleted_at is null
        order by created_at desc
        for update
      `
    );

    return result as unknown as Array<{ estimateNumber: string | null }>;
  }

  const rows = await executor
    .select()
    .from(estimates)
    .where(and(eq(estimates.companyId, companyId), isNull(estimates.deletedAt)))
    .limit(MAX_ESTIMATE_NUMBER_WINDOW);

  return rows.map((row) => ({
    estimateNumber: row.estimateNumber
  }));
}

export async function generateEstimateNumber(
  companyId: string,
  executor: EstimateNumberExecutor = db
): Promise<string> {
  const rows = await loadLockedEstimateNumbers(executor, companyId);
  const maxSuffix = rows.reduce((highestSuffix, row) => {
    return Math.max(highestSuffix, parseEstimateNumberSuffix(row.estimateNumber));
  }, 0);
  const nextSuffix = maxSuffix + 1;

  return `${ESTIMATE_NUMBER_PREFIX}${String(nextSuffix).padStart(ESTIMATE_NUMBER_PADDING, "0")}`;
}
