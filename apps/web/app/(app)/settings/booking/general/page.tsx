"use client";

import { useEffect, useMemo, useState } from "react";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import {
  useBookingSettings,
  useCheckBookingSlugAvailability,
  useUpdateBookingSettings
} from "@/src/hooks/booking.hooks";
import { useUnsavedChanges } from "@/src/hooks/useUnsavedChanges";
import { ApiError } from "@/src/lib/api";
import { showToast } from "@/src/stores/toast.store";

interface BookingGeneralForm {
  isEnabled: boolean;
  bookingSlug: string;
  autoConfirm: boolean;
}

type SlugState = "idle" | "checking" | "available" | "unavailable";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, "-")
    .replace(/-{2,}/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

export default function BookingGeneralSettingsPage() {
  const settingsQuery = useBookingSettings();
  const updateSettings = useUpdateBookingSettings();
  const checkSlugAvailability = useCheckBookingSlugAvailability();
  const settings = settingsQuery.data?.settings ?? null;
  const initialForm = useMemo<BookingGeneralForm>(
    () => ({
      isEnabled: settings?.isEnabled ?? false,
      bookingSlug: settings?.bookingSlug ?? "",
      autoConfirm: settings?.autoConfirm ?? false
    }),
    [settings]
  );
  const [form, setForm] = useState<BookingGeneralForm>(initialForm);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const normalizedSlug = normalizeSlug(form.bookingSlug);
  const initialSlug = normalizeSlug(initialForm.bookingSlug);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useUnsavedChanges({ isDirty });

  useEffect(() => {
    if (!hasInitialized || !isDirty) {
      setForm(initialForm);
    }

    setHasInitialized(true);
  }, [hasInitialized, initialForm, isDirty]);

  useEffect(() => {
    if (!normalizedSlug || normalizedSlug === initialSlug) {
      setSlugState("idle");
      setSlugMessage(null);
      return;
    }

    setSlugState("checking");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await checkSlugAvailability.mutateAsync(normalizedSlug);
        setSlugState(response.available ? "available" : "unavailable");
        setSlugMessage(response.available ? "Booking URL is available." : "That booking URL is already taken.");
      } catch (error) {
        setSlugState("unavailable");
        setSlugMessage(error instanceof ApiError ? error.message : "Booking URL could not be validated.");
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [checkSlugAvailability, initialSlug, normalizedSlug]);

  async function handleSave() {
    if (!isDirty) {
      return;
    }

    if (!normalizedSlug) {
      showToast({
        tone: "error",
        title: "Booking URL required",
        description: "Set a booking slug before saving booking settings."
      });
      return;
    }

    if (slugState === "unavailable") {
      showToast({
        tone: "error",
        title: "Booking URL unavailable",
        description: slugMessage ?? "Choose a different slug and try again."
      });
      return;
    }

    try {
      await updateSettings.mutateAsync({
        isEnabled: form.isEnabled,
        bookingSlug: normalizedSlug,
        autoConfirm: form.autoConfirm
      });

      showToast({
        tone: "success",
        title: "Booking settings saved",
        description: "General online booking controls were updated."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Save failed",
        description: error instanceof ApiError ? error.message : "Booking settings could not be saved."
      });
    }
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[96px]" />
        <SkeletonCard className="h-[420px]" />
      </div>
    );
  }

  return (
    <PageLayout
      title="Booking General"
      subtitle="Control whether online booking is live, what URL customers use, and whether requests auto-confirm."
      actions={
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={!isDirty || updateSettings.isPending}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateSettings.isPending ? "Saving..." : "Save Booking Settings"}
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="space-y-6">
          <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
            <label className="flex items-center justify-between gap-4 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-4">
              <span>
                <span className="block text-sm font-semibold text-neutral-900">Enable online booking</span>
                <span className="mt-1 block text-sm text-neutral-500">Show the public booking flow and allow new requests to be submitted.</span>
              </span>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, isEnabled: !current.isEnabled }))}
                onBlur={() => {
                  void handleSave();
                }}
                className={[
                  "relative inline-flex h-8 w-14 rounded-full transition",
                  form.isEnabled ? "bg-success" : "bg-neutral-300"
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition",
                    form.isEnabled ? "left-7" : "left-1"
                  ].join(" ")}
                />
              </button>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">Booking URL slug</span>
              <input
                value={form.bookingSlug}
                onChange={(event) => setForm((current) => ({ ...current, bookingSlug: event.target.value }))}
                onBlur={() => {
                  void handleSave();
                }}
                placeholder="acme-hvac"
                className="mt-2 min-h-12 w-full rounded-[22px] border border-neutral-200 px-4 text-sm text-neutral-700 outline-none transition focus:border-brand-accent"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-neutral-400">Public URL: /book/{normalizedSlug || "your-slug"}</span>
                <span
                  className={
                    slugState === "unavailable"
                      ? "text-error"
                      : slugState === "available"
                        ? "text-success"
                        : "text-neutral-400"
                  }
                >
                  {slugState === "checking" ? "Checking..." : slugMessage ?? "We'll verify this as you type."}
                </span>
              </div>
            </label>

            <label className="flex items-center justify-between gap-4 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-4">
              <span>
                <span className="block text-sm font-semibold text-neutral-900">Auto-confirm eligible requests</span>
                <span className="mt-1 block text-sm text-neutral-500">Immediately confirm new requests when the booking engine can place them without office review.</span>
              </span>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, autoConfirm: !current.autoConfirm }))}
                onBlur={() => {
                  void handleSave();
                }}
                className={[
                  "relative inline-flex h-8 w-14 rounded-full transition",
                  form.autoConfirm ? "bg-success" : "bg-neutral-300"
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition",
                    form.autoConfirm ? "left-7" : "left-1"
                  ].join(" ")}
                />
              </button>
            </label>
          </section>
        </section>

        <aside className="rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">How this works</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-500">
            <li>The slug check is debounced against the booking settings API so duplicate URLs are caught before save.</li>
            <li>Auto-confirm only changes how incoming requests are staged after customers finish the booking flow.</li>
            <li>Disabling online booking leaves your historical requests untouched and simply hides the public entry point.</li>
          </ul>
        </aside>
      </div>
    </PageLayout>
  );
}
