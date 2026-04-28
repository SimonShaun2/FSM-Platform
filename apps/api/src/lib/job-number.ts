import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db, jobs } from "@fsm/db";

const JOB_NUMBER_PREFIX = "JOB-";
const JOB_NUMBER_PADDING = 4;
const MAX_JOB_NUMBER_WINDOW = 10_000;

type JobNumberExecutor = Pick<typeof db, "select"> &
  Partial<Pick<typeof db, "execute">>;

function parseJobNumberSuffix(jobNumber: string | null): number {
  if (!jobNumber || !jobNumber.startsWith(JOB_NUMBER_PREFIX)) {
    return 0;
  }

  const suffix = Number.parseInt(jobNumber.slice(JOB_NUMBER_PREFIX.length), 10);
  return Number.isFinite(suffix) ? suffix : 0;
}

async function loadLockedJobNumbers(
  executor: JobNumberExecutor,
  companyId: string
): Promise<Array<{ jobNumber: string | null }>> {
  if (executor.execute) {
    const result = await executor.execute(
      sql`
        select job_number as "jobNumber"
        from jobs
        where company_id = ${companyId}
          and deleted_at is null
        order by created_at desc
        for update
      `
    );

    return result as unknown as Array<{ jobNumber: string | null }>;
  }

  const rows = await executor
    .select()
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), isNull(jobs.deletedAt)))
    .limit(MAX_JOB_NUMBER_WINDOW);

  return rows.map((row) => ({
    jobNumber: row.jobNumber
  }));
}

export async function generateJobNumber(
  companyId: string,
  executor: JobNumberExecutor = db
): Promise<string> {
  const rows = await loadLockedJobNumbers(executor, companyId);
  const maxSuffix = rows.reduce((highestSuffix, row) => {
    return Math.max(highestSuffix, parseJobNumberSuffix(row.jobNumber));
  }, 0);
  const nextSuffix = maxSuffix + 1;

  return `${JOB_NUMBER_PREFIX}${String(nextSuffix).padStart(JOB_NUMBER_PADDING, "0")}`;
}
