"use client";

import Link from "next/link";
import { MessageSquareText } from "lucide-react";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useMessageConversations } from "@/src/hooks/messages.hooks";
import { formatRelativeTime } from "@/src/lib/utils";

function getInitials(displayName: string) {
  const parts = displayName.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MobileConversationList() {
  const conversationsQuery = useMessageConversations();
  const conversations = conversationsQuery.data?.data ?? [];

  if (conversationsQuery.isLoading) {
    return (
      <div className="space-y-4 px-4 py-4">
        <SkeletonCard className="h-[96px]" />
        <SkeletonCard className="h-[96px]" />
        <SkeletonCard className="h-[96px]" />
      </div>
    );
  }

  if (conversationsQuery.isError) {
    return (
      <div className="px-4 py-6">
        <EmptyState
          icon={MessageSquareText}
          title="Messages are unavailable"
          subtitle="Conversation history could not be loaded right now. Try again shortly."
          compact
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-[#F5F7FB] px-4 py-4">
      <div className="mx-auto w-full max-w-[390px] space-y-4">
        <header className="space-y-1">
          <h1 className="text-[2rem] font-semibold tracking-tight text-neutral-950">Messages</h1>
          <p className="text-sm text-neutral-500">
            {conversationsQuery.data?.totalUnread ?? 0} unread · read-only threads in V1
          </p>
        </header>

        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="No customer conversations yet"
            subtitle="Inbound SMS, OTW messages, and campaign replies will appear here once customers start responding."
            compact
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const displayName =
                conversation.displayName ?? `${conversation.firstName} ${conversation.lastName}`.trim();

              return (
                <Link
                  key={conversation.customerId}
                  href={`/mobile/messages/${conversation.customerId}`}
                  className="flex min-h-20 items-center gap-3 rounded-[26px] border border-neutral-200 bg-white px-4 py-4 shadow-[0_18px_48px_rgba(16,33,99,0.06)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-accent text-sm font-semibold text-white">
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-neutral-950">{displayName}</p>
                      <span className="shrink-0 text-xs text-neutral-400">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{conversation.lastMessagePreview}</p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex min-h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-error px-1.5 text-xs font-semibold text-white">
                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
