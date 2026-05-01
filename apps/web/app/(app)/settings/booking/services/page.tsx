"use client";

import { useEffect, useMemo, useState } from "react";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { BOOKING_SERVICE_PRESETS } from "@/src/components/settings/settings.constants";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useBookingSettings, useUpdateBookingSettings } from "@/src/hooks/booking.hooks";
import { useUnsavedChanges } from "@/src/hooks/useUnsavedChanges";
import { ApiError } from "@/src/lib/api";
import { showToast } from "@/src/stores/toast.store";

interface ServiceOption {
  label: string;
  types: string[];
}

function normalizeServiceOptions(offeredServices: Array<Record<string, unknown>>) {
  const options = new Map<string, ServiceOption>();

  for (const preset of BOOKING_SERVICE_PRESETS) {
    options.set(preset.label, {
      label: preset.label,
      types: [...preset.types]
    });
  }

  for (const service of offeredServices) {
    const label =
      typeof service.label === "string"
        ? service.label
        : typeof service.name === "string"
          ? service.name
          : typeof service.category === "string"
            ? service.category
            : null;

    if (!label) {
      continue;
    }

    const rawTypes = Array.isArray(service.types)
      ? service.types
      : Array.isArray(service.services)
        ? service.services
        : [];

    options.set(label, {
      label,
      types: rawTypes.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    });
  }

  return Array.from(options.values());
}

export default function BookingServicesSettingsPage() {
  const settingsQuery = useBookingSettings();
  const updateSettings = useUpdateBookingSettings();
  const settings = settingsQuery.data?.settings ?? null;
  const serviceOptions = useMemo(
    () => normalizeServiceOptions(settings?.offeredServices ?? []),
    [settings?.offeredServices]
  );
  const initialSelection = useMemo(
    () =>
      (settings?.offeredServices ?? [])
        .map((service) => {
          if (typeof service.label === "string") {
            return service.label;
          }

          if (typeof service.name === "string") {
            return service.name;
          }

          if (typeof service.category === "string") {
            return service.category;
          }

          return null;
        })
        .filter((value): value is string => value !== null),
    [settings?.offeredServices]
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(initialSelection);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isDirty = JSON.stringify(selectedServices) !== JSON.stringify(initialSelection);

  useUnsavedChanges({ isDirty });

  useEffect(() => {
    if (!hasInitialized || !isDirty) {
      setSelectedServices(initialSelection);
    }

    setHasInitialized(true);
  }, [hasInitialized, initialSelection, isDirty]);

  async function handleSave() {
    if (!isDirty) {
      return;
    }

    if (selectedServices.length === 0) {
      showToast({
        tone: "error",
        title: "Select at least one service",
        description: "Online booking needs at least one service category available."
      });
      return;
    }

    try {
      await updateSettings.mutateAsync({
        offeredServices: serviceOptions
          .filter((option) => selectedServices.includes(option.label))
          .map((option) => ({
            label: option.label,
            types: option.types
          }))
      });

      showToast({
        tone: "success",
        title: "Booking services saved",
        description: "Customers will only see the service categories enabled here."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Save failed",
        description: error instanceof ApiError ? error.message : "Booking services could not be saved."
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
      title="Booking Services"
      subtitle="Choose which service categories can be selected in the public online booking flow."
      actions={
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={!isDirty || updateSettings.isPending}
          className="inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updateSettings.isPending ? "Saving..." : "Save Service Options"}
        </button>
      }
    >
      <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
        <div className="space-y-4">
          {serviceOptions.map((option) => {
            const isSelected = selectedServices.includes(option.label);

            return (
              <label
                key={option.label}
                className="flex items-start gap-4 rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) =>
                    setSelectedServices((current) =>
                      event.target.checked
                        ? [...current, option.label]
                        : current.filter((value) => value !== option.label)
                    )
                  }
                  className="mt-1 h-4 w-4 rounded border-neutral-300"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">{option.label}</span>
                  <span className="mt-1 block text-sm text-neutral-500">{option.types.join(" · ")}</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>
    </PageLayout>
  );
}
