"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";

import { Sheet } from "@/src/components/ui/Sheet";

type SendChannel = "email" | "sms" | "both";

interface EstimateSendModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  estimateNumber: string;
  publicUrl: string | null;
  defaultMessage: string;
  isPending: boolean;
  onSend: (input: { channel: SendChannel; message: string }) => Promise<void>;
}

export function EstimateSendModal({
  open,
  onClose,
  customerName,
  customerEmail,
  customerPhone,
  estimateNumber,
  publicUrl,
  defaultMessage,
  isPending,
  onSend
}: EstimateSendModalProps) {
  const [channel, setChannel] = useState<SendChannel>("email");
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (!open) {
      return;
    }

    setChannel("email");
    setMessage(defaultMessage);
  }, [defaultMessage, open]);

  const destinationLabel = useMemo(() => {
    if (channel === "email") {
      return customerEmail ?? "No customer email on file";
    }

    if (channel === "sms") {
      return customerPhone ?? "No customer phone on file";
    }

    return [customerEmail, customerPhone].filter(Boolean).join(" • ") || "Customer contact details missing";
  }, [channel, customerEmail, customerPhone]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Send ${estimateNumber}`}
      description="Choose the delivery channel, preview the customer message, and send the approval link."
    >
      <div className="space-y-6 px-6 py-6">
        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Customer</p>
          <p className="mt-2 text-base font-semibold text-neutral-900">{customerName}</p>
          <p className="mt-1 text-sm text-neutral-500">{destinationLabel}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-neutral-700">Delivery channel</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                value: "email" as const,
                label: "Email",
                icon: Mail
              },
              {
                value: "sms" as const,
                label: "SMS Link",
                icon: MessageSquare
              },
              {
                value: "both" as const,
                label: "Both",
                icon: Send
              }
            ].map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setChannel(option.value)}
                  className={
                    channel === option.value
                      ? "rounded-[24px] border border-brand-accent bg-brand-accent-light px-4 py-4 text-left"
                      : "rounded-[24px] border border-neutral-200 bg-white px-4 py-4 text-left transition hover:border-brand-accent/35"
                  }
                >
                  <Icon className={channel === option.value ? "h-4 w-4 text-brand-accent" : "h-4 w-4 text-neutral-400"} />
                  <p className="mt-3 text-sm font-semibold text-neutral-900">{option.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700">Message preview</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={8}
            className="w-full rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-6 text-neutral-700 outline-none transition focus:border-brand-accent"
          />
        </div>

        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Approval link</p>
          <p className="mt-2 break-all text-sm text-brand-accent">{publicUrl ?? "Approval link will be available after send."}</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              void onSend({
                channel,
                message
              });
            }}
            className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Sending..." : "Send to Customer"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
