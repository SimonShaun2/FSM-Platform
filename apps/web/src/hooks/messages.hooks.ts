"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/src/lib/api";

interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessageConversationRecord {
  customerId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
  lastMessagePreview: string;
  lastMessageAt: string;
  lastDirection: "inbound" | "outbound";
  unreadCount: number;
}

export interface MessageThreadRecord {
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
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

interface ConversationListResponse extends PaginatedResponse<MessageConversationRecord> {
  totalUnread: number;
}

interface MessageThreadResponse extends PaginatedResponse<MessageThreadRecord> {}

const messageKeys = {
  conversations: ["messages", "conversations"] as const,
  thread: (customerId: string) => ["messages", "thread", customerId] as const
};

export function useMessageConversations() {
  return useQuery({
    queryKey: messageKeys.conversations,
    queryFn: () => api.get<ConversationListResponse>("/api/v1/message-logs/conversations?page=1&limit=50"),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000
  });
}

export function useMessageThread(customerId: string | null) {
  return useQuery({
    queryKey: customerId ? messageKeys.thread(customerId) : messageKeys.thread("pending"),
    queryFn: () =>
      api.get<MessageThreadResponse>(`/api/v1/message-logs?customerId=${customerId}&page=1&limit=100`),
    enabled: Boolean(customerId),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000
  });
}
