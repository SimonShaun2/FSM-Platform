"use client";

import { useEffect } from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { useToastStore, type ToastItem } from "@/src/stores/toast.store";

function getToastToneStyles(tone: ToastItem["tone"]) {
  switch (tone) {
    case "success":
      return {
        wrapper: "border-success/15 bg-success-light text-success",
        icon: CheckCircle2
      };
    case "error":
      return {
        wrapper: "border-error/15 bg-error-light text-error",
        icon: CircleAlert
      };
    default:
      return {
        wrapper: "border-brand-accent/15 bg-brand-accent-light text-brand-primary",
        icon: Info
      };
  }
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), toast.durationMs)
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [dismissToast, toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const toneStyles = getToastToneStyles(toast.tone);
          const Icon = toneStyles.icon;

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto rounded-[24px] border px-4 py-3 shadow-[0_24px_80px_rgba(16,33,99,0.12)] backdrop-blur",
                toneStyles.wrapper
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
