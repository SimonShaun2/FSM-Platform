"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { ZipChipEditor } from "@/src/components/shared/ZipChipEditor";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useBookingDemandByZip, useBookingSettings, useUpdateBookingSettings } from "@/src/hooks/booking.hooks";
import { useDispatchView } from "@/src/hooks/dispatch.hooks";
import { useTechnicians, useUpdateTechnicianServiceAreas } from "@/src/hooks/technicians.hooks";
import { showToast } from "@/src/stores/toast.store";
import { cn } from "@/src/lib/utils";

const today = new Date().toISOString().slice(0, 10);

export default function BookingServiceAreasPage() {
  const techniciansQuery = useTechnicians();
  const dispatchQuery = useDispatchView(today);
  const bookingSettingsQuery = useBookingSettings();
  const demandQuery = useBookingDemandByZip(30);
  const updateSettings = useUpdateBookingSettings();
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [draftZipMap, setDraftZipMap] = useState<Record<string, string[]>>({});

  const technicians = techniciansQuery.data?.data ?? [];
  const dispatchTechnicians = dispatchQuery.data?.technicians ?? [];
  const selectedTechnician = technicians.find((technician) => technician.id === selectedTechId) ?? technicians[0] ?? null;
  const selectedTechZips = selectedTechnician ? draftZipMap[selectedTechnician.id] ?? selectedTechnician.serviceZipCodes : [];
  const selectedTechMutation = useUpdateTechnicianServiceAreas(selectedTechnician?.id ?? "");
  const jobCountByTech = useMemo(
    () =>
      new Map(
        dispatchTechnicians.map((technician) => [
          technician.id,
          technician.jobs.length
        ])
      ),
    [dispatchTechnicians]
  );

  useEffect(() => {
    if (technicians.length === 0) {
      return;
    }

    setDraftZipMap((current) => {
      const next = { ...current };

      for (const technician of technicians) {
        if (!next[technician.id]) {
          next[technician.id] = technician.serviceZipCodes;
        }
      }

      return next;
    });

    setSelectedTechId((current) => current ?? technicians[0]?.id ?? null);
  }, [technicians]);

  async function handleSaveZips() {
    if (!selectedTechnician) {
      return;
    }

    setDraftZipMap((current) => ({
      ...current,
      [selectedTechnician.id]: selectedTechZips
    }));

    try {
      await selectedTechMutation.mutateAsync(selectedTechZips);
      showToast({
        tone: "success",
        title: "Service areas saved",
        description: `${selectedTechnician.firstName}'s coverage was updated.`
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not save service areas",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  async function handleToggleSetting(field: "autoAssignTech" | "balanceWorkload" | "allowZipOverflow", value: boolean) {
    try {
      await updateSettings.mutateAsync({ [field]: value });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Routing rule not saved",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  if (
    techniciansQuery.isLoading ||
    dispatchQuery.isLoading ||
    bookingSettingsQuery.isLoading ||
    demandQuery.isLoading
  ) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[96px]" />
        <SkeletonCard className="h-[520px]" />
      </div>
    );
  }

  const settings = bookingSettingsQuery.data?.settings;
  const demandData = demandQuery.data?.data ?? [];

  return (
    <PageLayout
      title="Service Areas & Routing"
      subtitle="Assign ZIP coverage to technicians and control how online bookings route into dispatch."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
            <div className="rounded-[22px] border border-brand-accent/10 bg-brand-accent-light/45 px-4 py-4 text-sm text-neutral-600">
              <p className="font-semibold text-neutral-900">How zip code routing works</p>
              <p className="mt-2">
                Customers only see times from technicians who cover their ZIP code. If no ZIP match exists, overflow rules decide whether a dispatcher can still assign the request.
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-neutral-200">
              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_120px_100px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                <span>Technician</span>
                <span>Assigned ZIP Codes</span>
                <span>Jobs Today</span>
                <span>Actions</span>
              </div>

              {technicians.map((technician) => {
                const zips = draftZipMap[technician.id] ?? technician.serviceZipCodes;
                const isSelected = selectedTechnician?.id === technician.id;

                return (
                  <div
                    key={technician.id}
                    className={cn(
                      "grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_120px_100px] gap-3 border-b border-neutral-100 px-4 py-4 last:border-b-0",
                      isSelected && "bg-brand-accent-light/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent text-xs font-semibold text-white">
                        {`${technician.firstName[0] ?? ""}${technician.lastName[0] ?? ""}`}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {technician.firstName} {technician.lastName}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{technician.email ?? technician.phone}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {zips.slice(0, 4).map((zip) => (
                        <span
                          key={zip}
                          className="inline-flex items-center rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success"
                        >
                          {zip}
                        </span>
                      ))}
                      {zips.length > 4 ? (
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                          +{zips.length - 4} more
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-neutral-900">{jobCountByTech.get(technician.id) ?? 0}</span>
                    </div>

                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTechId(technician.id)}
                        className="text-sm font-semibold text-brand-accent transition hover:text-brand-primary"
                      >
                        Edit ZIPs
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Booking Demand</p>
                <h2 className="mt-2 text-lg font-semibold text-neutral-900">Top ZIP codes over the last 30 days</h2>
              </div>
            </div>

            <div className="mt-6 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="zip" tickLine={false} axisLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(37,122,250,0.08)" }}
                    contentStyle={{
                      borderRadius: 18,
                      borderColor: "#E5E7EB",
                      boxShadow: "0 20px 50px rgba(16,33,99,0.12)"
                    }}
                  />
                  <Bar dataKey="count" fill="#257AFA" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {selectedTechnician ? `Edit: ${selectedTechnician.firstName} ${selectedTechnician.lastName}` : "Edit technician"}
            </p>

            {selectedTechnician ? (
              <>
                <div className="mt-4">
                  <ZipChipEditor
                    zips={selectedTechZips}
                    onChange={(nextZips) => {
                      setDraftZipMap((current) => ({
                        ...current,
                        [selectedTechnician.id]: nextZips
                      }));
                    }}
                    color="#16A34A"
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSaveZips();
                    }}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-brand-accent px-4 text-sm font-semibold text-white transition hover:bg-brand-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">Select a technician to edit coverage.</p>
            )}
          </section>

          <section className="rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Routing Rules</p>
            <div className="mt-4 space-y-4">
              {[
                {
                  key: "autoAssignTech" as const,
                  label: "Auto-assign tech",
                  enabled: settings?.autoAssignTech ?? false
                },
                {
                  key: "balanceWorkload" as const,
                  label: "Balance workload",
                  enabled: settings?.balanceWorkload ?? false
                },
                {
                  key: "allowZipOverflow" as const,
                  label: "Allow zip overflow",
                  enabled: settings?.allowZipOverflow ?? false
                }
              ].map((rule) => (
                <label key={rule.key} className="flex items-center justify-between gap-3 rounded-[22px] bg-neutral-50 px-4 py-3">
                  <span className="text-sm font-semibold text-neutral-900">{rule.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void handleToggleSetting(rule.key, !rule.enabled);
                    }}
                    className={cn(
                      "relative inline-flex h-7 w-12 rounded-full transition",
                      rule.enabled ? "bg-success" : "bg-neutral-300"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
                        rule.enabled ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </PageLayout>
  );
}
