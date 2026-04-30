"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquareText, Phone } from "lucide-react";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useMessageThread } from "@/src/hooks/messages.hooks";
import { cn, formatRelativeTime } from "@/src/lib/utils";

export function MobileMessageThread() {
  const params = useParams<{ customerId: string }>();
  const threadQuery = useMessageThread(params.customerId);
  const messages = useMemo(() => (threadQuery.data?.data ?? []).slice().reverse(), [threadQuery.data?.data]);

  if (threadQuery.isLoading) {
    return (
      <div className="space-y-4 px-4 py-4">
        <SkeletonCard className="h-[88px]" />
        <SkeletonCard className="h-[120px]" />
        <SkeletonCard className="h-[120px]" />
      </div>
    );
  }

  if (threadQuery.isError) {
    return (
      <div className="px-4 py-6">
        <EmptyState
          icon={MessageSquareText}
          title="Conversation unavailable"
          subtitle="The customer thread could not be loaded right now."
          compact
        />
      </div>
    );
  }

  const firstMessage = threadQuery.data?.data?.[0];
  const customerPhone =
    firstMessage?.direction === "inbound" ? firstMessage.fromAddress : firstMessage?.toAddress ?? null;

  return (
    <div className="min-h-[100svh] bg-[#F5F7FB] px-4 py-4">
      <div className="mx-auto w-full max-w-[390px] space-y-4">
        <header className="rounded-[28px] bg-brand-primary px-4 py-4 text-white shadow-[0_22px_60px_rgba(16,33,99,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <Link href="/mobile/messages" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/80">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            {customerPhone ? (
              <a href={`tel:${customerPhone}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/10 px-3 text-sm font-semibold text-white">
                <Phone className="h-4 w-4" />
                Call
              </a>
            ) : null}
          </div>
          <div className="mt-3">
            <h1 className="text-xl font-semibold tracking-tight text-white">Customer Conversation</h1>
            <p className="mt-1 text-sm text-white/70">Read-only V1 · inbound and outbound message history</p>
          </div>
        </header>

        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="No messages yet"
            subtitle="This customer has not received or sent any logged SMS or email messages yet."
            compact
          />
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const outbound = message.direction === "outbound";

              return (
                <div key={message.id} className={cn("flex", outbound ? "justify-end" : "justify-start")}>
                  <article
                    className={cn(
                      "max-w-[86%] rounded-[26px] px-4 py-3 shadow-sm",
                      outbound ? "bg-brand-accent text-white" : "bg-white text-neutral-900 ring-1 ring-neutral-200"
                    )}
                  >
                    <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", outbound ? "text-white/70" : "text-neutral-400")}>
                      {message.channel} · {message.direction}
                    </p>
                    <p className={cn("mt-2 text-sm leading-6", outbound ? "text-white" : "text-neutral-700")}>
                      {message.body}
                    </p>
                    <div className={cn("mt-3 flex items-center justify-between gap-3 text-xs", outbound ? "text-white/70" : "text-neutral-400")}>
                      <span>{formatRelativeTime(message.createdAt)}</span>
                      <span>{message.providerStatus ?? "logged"}</span>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
