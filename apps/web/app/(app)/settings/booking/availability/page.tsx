"use client";

import { useEffect, useMemo, useState } from "react";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { BOOKING_DAY_OPTIONS } from "@/src/components/settings/settings.constants";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useBookingSettings, useUpdateBookingSettings } from "@/src/hooks/booking.hooks";
import { useUnsavedChanges } from "@/src/hooks/useUnsavedChanges";
import { ApiError } from "@/src/lib/api";
import { showToast } from "@/src/stores/toast.store";
import { cn } from "@/src/lib/utils";

interface BookingAvailabilityForm {
  availableHoursStart: number;
  availableHoursEnd: number;
  availableDays: string[];
  slotDuration: number;
  maxAdvanceDays: number;
}

export default function BookingAvailabilitySettingsPage() {
  const settingsQuery = useBookingSettings();
  const updateSettings = useUpdateBookingSettings();
  const settings = settingsQuery.data?.settings ?? null;
  const initialForm = useMemo<BookingAvailabilityForm>(
    () => ({
      availableHoursStart: settings?.availableHoursStart ?? 8,
      availableHoursEnd: settings?.availableHoursEnd ?? 17,
      availableDays: settings?.availableDays ?? ["mon", "tue", "wed", "thu", "fri"],
      slotDuration: settings?.slotDuration ?? 120,
      maxAdvanceDays: settings?.maxAdvanceDays ?? 21
    }),
    [settings]
  );
  const [form, setForm] = useState(initialForm);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useUnsavedChanges({ isDirty });

  useEffect(() => {
    if (!hasInitialized || !isDirty) {
      setForm(initialForm);
    }

    setHasInitialized(true);
  }, [hasInitialized, initialForm, isDirty]);

  async function handleSave() {
    if (!isDirty) {
      return;
    }

    if (form.availableHoursEnd <= form.availableHoursStart) {
      showToast({
        tone: "error",
        title: "Availability range invalid",
        description: "End time must be later than start time."
      });
      return;
    }

    try {
      await updateSettings.mutateAsync(form);

      showToast({
        tone: "success",
        title: "Availability saved",
        description: "Online booking will use the updated hours and slot rules."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Save failed",
        description: error instanceof ApiError ? error.message : "Availability settings could not be saved."
      });
    }
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[96px]" />
        <SkeletonCard className="h-[440px]" />
      </div>
    );
  }

  return (
    <PageLayout
      title="Booking Availability"
      subtitle="Control which days and time windows customers can book, plus how far ahead they can schedule."
      actions={
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={!isDirty || updateSettings.isPending}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateSettings.isPending ? "Saving..." : "Save Availability"}
        </button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">Start hour</span>
              <input
                value={form.availableHoursStart}
                onChange={(event) => setForm((current) => ({ ...current, availableHoursStart: Number(event.target.value) }))}
                onBlur={() => {
                  void handleSave();
                }}
                type="number"
                min={0}
                max={23}
                className="mt-2 min-h-12 w-full rounded-[22px] border border-neutral-200 px-4 text-sm text-neutral-700 outline-none transition focus:border-brand-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">End hour</span>
              <input
                value={form.availableHoursEnd}
                onChange={(event) => setForm((current) => ({ ...current, availableHoursEnd: Number(event.target.value) }))}
                onBlur={() => {
                  void handleSave();
                }}
                type="number"
                min={1}
                max={24}
                className="mt-2 min-h-12 w-full rounded-[22px] border border-neutral-200 px-4 text-sm text-neutral-700 outline-none transition focus:border-brand-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">Slot duration (minutes)</span>
              <select
                value={form.slotDuration}
                onChange={(event) => setForm((current) => ({ ...current, slotDuration: Number(event.target.value) }))}
                onBlur={() => {
                  void handleSave();
                }}
                className="mt-2 min-h-12 w-full rounded-[22px] border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none transition focus:border-brand-accent"
              >
                {[60, 90, 120, 180].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">Max advance days</span>
              <input
                value={form.maxAdvanceDays}
                onChange={(event) => setForm((current) => ({ ...current, maxAdvanceDays: Number(event.target.value) }))}
                onBlur={() => {
                  void handleSave();
                }}
                type="number"
                min={1}
                max={365}
                className="mt-2 min-h-12 w-full rounded-[22px] border border-neutral-200 px-4 text-sm text-neutral-700 outline-none transition focus:border-brand-accent"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">Available days</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {BOOKING_DAY_OPTIONS.map((day) => {
              const isActive = form.availableDays.includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      availableDays: isActive
                        ? current.availableDays.filter((value) => value !== day.value)
                        : [...current.availableDays, day.value]
                    }))
                  }
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm font-semibold transition",
                    isActive
                      ? "border-brand-accent bg-brand-accent text-white"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
