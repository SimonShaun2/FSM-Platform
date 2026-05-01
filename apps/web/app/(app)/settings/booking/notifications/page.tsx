"use client";

import { useEffect, useMemo, useState } from "react";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useBookingSettings, useUpdateBookingSettings } from "@/src/hooks/booking.hooks";
import { useUnsavedChanges } from "@/src/hooks/useUnsavedChanges";
import { ApiError } from "@/src/lib/api";
import { showToast } from "@/src/stores/toast.store";

interface BookingNotificationsForm {
  notifyOnNewBooking: boolean;
  notificationEmail: string;
}

export default function BookingNotificationSettingsPage() {
  const settingsQuery = useBookingSettings();
  const updateSettings = useUpdateBookingSettings();
  const settings = settingsQuery.data?.settings ?? null;
  const initialForm = useMemo<BookingNotificationsForm>(
    () => ({
      notifyOnNewBooking: settings?.notifyOnNewBooking ?? true,
      notificationEmail: settings?.notificationEmail ?? ""
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

    try {
      await updateSettings.mutateAsync({
        notifyOnNewBooking: form.notifyOnNewBooking,
        notificationEmail: form.notificationEmail.trim() || null
      });

      showToast({
        tone: "success",
        title: "Booking notifications saved",
        description: "New booking alerts will follow the updated destination and toggle."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Save failed",
        description: error instanceof ApiError ? error.message : "Booking notification settings could not be saved."
      });
    }
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[96px]" />
        <SkeletonCard className="h-[300px]" />
      </div>
    );
  }

  return (
    <PageLayout
      title="Booking Notifications"
      subtitle="Control who gets notified when a new online booking request arrives."
      actions={
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={!isDirty || updateSettings.isPending}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateSettings.isPending ? "Saving..." : "Save Notification Settings"}
        </button>
      }
    >
      <section className="space-y-6 rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
        <label className="flex items-center justify-between gap-4 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-4">
          <span>
            <span className="block text-sm font-semibold text-neutral-900">Notify on new booking request</span>
            <span className="mt-1 block text-sm text-neutral-500">Send an alert whenever a customer submits a new booking request.</span>
          </span>
          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, notifyOnNewBooking: !current.notifyOnNewBooking }))}
            onBlur={() => {
              void handleSave();
            }}
            className={[
              "relative inline-flex h-8 w-14 rounded-full transition",
              form.notifyOnNewBooking ? "bg-success" : "bg-neutral-300"
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition",
                form.notifyOnNewBooking ? "left-7" : "left-1"
              ].join(" ")}
            />
          </button>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">Notification email</span>
          <input
            value={form.notificationEmail}
            onChange={(event) => setForm((current) => ({ ...current, notificationEmail: event.target.value }))}
            onBlur={() => {
              void handleSave();
            }}
            type="email"
            placeholder="dispatch@yourcompany.com"
            className="mt-2 min-h-12 w-full rounded-[22px] border border-neutral-200 px-4 text-sm text-neutral-700 outline-none transition focus:border-brand-accent"
          />
        </label>
      </section>
    </PageLayout>
  );
}
