import { eq } from "drizzle-orm";

import {
  activityEvents,
  db
} from "@fsm/db";
import type {
  ActivityEvent,
  PaginatedResult
} from "@fsm/types";

interface ListActivityEventsQuery {
  entityType?: string | undefined;
  entityId?: string | undefined;
  customerId?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_RESULT_WINDOW = 10_000;

function normalizePage(value: number | undefined): number {
  return Math.max(value ?? DEFAULT_PAGE, DEFAULT_PAGE);
}

function normalizeLimit(value: number | undefined): number {
  return Math.min(Math.max(value ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
}

function paginate<T>(rows: T[], page: number, limit: number): PaginatedResult<T> {
  const total = rows.length;
  const start = (page - 1) * limit;

  return {
    data: rows.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  };
}

export async function listActivityEvents(
  companyId: string,
  query: ListActivityEventsQuery
): Promise<PaginatedResult<ActivityEvent>> {
  const page = normalizePage(query.page);
  const limit = normalizeLimit(query.limit);
  const rows = await db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.companyId, companyId))
    .limit(MAX_RESULT_WINDOW);

  const filteredRows = rows
    .filter((row) => {
      if (query.customerId && row.customerId !== query.customerId) {
        return false;
      }

      if (query.entityType && query.entityId) {
        if (query.entityType === "customer") {
          return row.customerId === query.entityId || (row.entityType === "customer" && row.entityId === query.entityId);
        }

        return row.entityType === query.entityType && row.entityId === query.entityId;
      }

      return true;
    })
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .map<ActivityEvent>((row) => ({
      ...row,
      actorType: row.actorType,
      actorName: row.actorName,
      customerId: row.customerId,
      jobId: row.jobId,
      estimateId: row.estimateId,
      invoiceId: row.invoiceId,
      payload: row.payload ?? {}
    }));

  return paginate(filteredRows, page, limit);
}
