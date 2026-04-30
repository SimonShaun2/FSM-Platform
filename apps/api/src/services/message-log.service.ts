import { and, eq, isNull } from "drizzle-orm";

import {
  campaigns,
  customers,
  db,
  messageLogs
} from "@fsm/db";
import type { PaginatedResult } from "@fsm/types";

interface ListMessageLogsQuery {
  customerId: string;
  page?: number;
  limit?: number;
}

export interface MessageLogListItem {
  id: string;
  customerId: string | null;
  campaignId: string | null;
  campaignName: string | null;
  channel: string;
  direction: string;
  toAddress: string;
  fromAddress: string | null;
  subject: string | null;
  body: string;
  providerStatus: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
}

export interface MessageConversationListItem {
  customerId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
  lastMessagePreview: string;
  lastMessageAt: Date;
  lastDirection: "inbound" | "outbound";
  unreadCount: number;
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

export async function listMessageLogs(
  companyId: string,
  query: ListMessageLogsQuery
): Promise<PaginatedResult<MessageLogListItem>> {
  const page = normalizePage(query.page);
  const limit = normalizeLimit(query.limit);
  const [logRows, campaignRows] = await Promise.all([
    db
      .select()
      .from(messageLogs)
      .where(
        and(
          eq(messageLogs.companyId, companyId),
          eq(messageLogs.customerId, query.customerId),
          isNull(messageLogs.deletedAt)
        )
      )
      .limit(MAX_RESULT_WINDOW),
    db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.companyId, companyId), isNull(campaigns.deletedAt)))
      .limit(MAX_RESULT_WINDOW)
  ]);
  const campaignById = new Map(campaignRows.map((campaign) => [campaign.id, campaign]));
  const logs = logRows
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    .map<MessageLogListItem>((row) => ({
      id: row.id,
      customerId: row.customerId,
      campaignId: row.campaignId,
      campaignName: row.campaignId ? campaignById.get(row.campaignId)?.name ?? null : null,
      channel: row.channel,
      direction: row.direction,
      toAddress: row.toAddress,
      fromAddress: row.fromAddress,
      subject: row.subject,
      body: row.body,
      providerStatus: row.providerStatus,
      sentAt: row.sentAt,
      deliveredAt: row.deliveredAt,
      failedAt: row.failedAt,
      failureReason: row.failureReason,
      createdAt: row.createdAt
    }));

  return paginate(logs, page, limit);
}

export async function listMessageConversations(
  companyId: string,
  page?: number,
  limit?: number
): Promise<PaginatedResult<MessageConversationListItem> & { totalUnread: number }> {
  const normalizedPage = normalizePage(page);
  const normalizedLimit = normalizeLimit(limit);
  const [logRows, customerRows] = await Promise.all([
    db
      .select()
      .from(messageLogs)
      .where(and(eq(messageLogs.companyId, companyId), isNull(messageLogs.deletedAt)))
      .limit(MAX_RESULT_WINDOW),
    db
      .select()
      .from(customers)
      .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
      .limit(MAX_RESULT_WINDOW)
  ]);
  const customerById = new Map(customerRows.map((customer) => [customer.id, customer]));
  const groupedByCustomerId = new Map<string, MessageConversationListItem>();

  for (const row of logRows) {
    if (!row.customerId) {
      continue;
    }

    const customer = customerById.get(row.customerId);

    if (!customer) {
      continue;
    }

    const existing = groupedByCustomerId.get(row.customerId);
    const nextPreview = row.body.trim().slice(0, 160);
    const isInbound = row.direction === "inbound";

    if (!existing) {
      groupedByCustomerId.set(row.customerId, {
        customerId: row.customerId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        displayName: `${customer.firstName} ${customer.lastName}`.trim() || null,
        phone: customer.phone,
        lastMessagePreview: nextPreview,
        lastMessageAt: row.createdAt,
        lastDirection: isInbound ? "inbound" : "outbound",
        unreadCount: isInbound ? 1 : 0
      });
      continue;
    }

    if (row.createdAt.getTime() > existing.lastMessageAt.getTime()) {
      existing.lastMessageAt = row.createdAt;
      existing.lastMessagePreview = nextPreview;
      existing.lastDirection = isInbound ? "inbound" : "outbound";
    }

    if (isInbound) {
      existing.unreadCount += 1;
    }
  }

  const ordered = Array.from(groupedByCustomerId.values()).sort(
    (left, right) => right.lastMessageAt.getTime() - left.lastMessageAt.getTime()
  );
  const paginated = paginate(ordered, normalizedPage, normalizedLimit);

  return {
    ...paginated,
    totalUnread: ordered.reduce((sum, conversation) => sum + conversation.unreadCount, 0)
  };
}
