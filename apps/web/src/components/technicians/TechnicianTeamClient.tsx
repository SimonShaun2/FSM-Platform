"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail, Plus, Search, UserRound } from "lucide-react";
import type { CreateTechnicianInput, TechnicianStatus } from "@fsm/types";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { ZipChipEditor } from "@/src/components/shared/ZipChipEditor";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Sheet } from "@/src/components/ui/Sheet";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import {
  useInviteTechnician,
  useTechStats,
  useTechnicians,
  type TechnicianListRecord
} from "@/src/hooks/technicians.hooks";
import { getStoredSession } from "@/src/lib/auth";
import { useAuthStore } from "@/src/stores/auth.store";
import { showToast } from "@/src/stores/toast.store";

function getStatusTone(status: TechnicianStatus) {
  switch (status) {
    case "active":
      return "green" as const;
    case "on_leave":
      return "orange" as const;
    case "inactive":
    default:
      return "gray" as const;
  }
}

function formatStatusLabel(status: TechnicianStatus) {
  switch (status) {
    case "on_leave":
      return "On Leave";
    case "inactive":
      return "Inactive";
    case "active":
    default:
      return "Active";
  }
}

function getInitials(technician: TechnicianListRecord) {
  return `${technician.firstName.charAt(0)}${technician.lastName.charAt(0)}`.toUpperCase();
}

function parseSkillsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function TableStatsCell({ technicianId }: { technicianId: string }) {
  const statsQuery = useTechStats(technicianId);

  if (statsQuery.isLoading || !statsQuery.data) {
    return (
      <>
        <td className="px-4 py-4 text-sm text-neutral-300">--</td>
        <td className="px-4 py-4 text-sm text-neutral-300">--</td>
        <td className="px-4 py-4 text-sm text-neutral-300">--</td>
      </>
    );
  }

  return (
    <>
      <td className="px-4 py-4 text-sm font-semibold text-neutral-900">{statsQuery.data.jobsThisMonth}</td>
      <td className="px-4 py-4 text-sm font-semibold text-neutral-900">
        {statsQuery.data.averageRating != null ? `${statsQuery.data.averageRating.toFixed(1)} *` : "--"}
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-neutral-900">{statsQuery.data.utilization}%</td>
    </>
  );
}

function InviteTechnicianSheet({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inviteMutation = useInviteTechnician();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [skillsInput, setSkillsInput] = useState("");
  const [serviceZipCodes, setServiceZipCodes] = useState<string[]>([]);

  async function handleSubmit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      showToast({
        tone: "error",
        title: "Missing details",
        description: "First name, last name, email, and phone are required."
      });
      return;
    }

    const payload: CreateTechnicianInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      skills: parseSkillsInput(skillsInput),
      serviceZipCodes,
      availableDays: ["mon", "tue", "wed", "thu", "fri"],
      hoursPerDay: Number.parseFloat(hoursPerDay) || 8,
      status: "active"
    };

    try {
      const response = await inviteMutation.mutateAsync(payload);
      showToast({
        tone: "success",
        title: "Technician added",
        description: `${payload.firstName} ${payload.lastName} was added to the team roster.`
      });
      onClose();
      router.push(`/settings/users/${response.technician.id}`);
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not add technician",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Invite Technician"
      description="Create the technician profile, assign service areas, and save them into the team roster."
      className="max-w-[560px]"
    >
      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-700">First name</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-700">Last name</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-700">Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-700">Role</span>
            <input
              value="Technician"
              readOnly
              className="min-h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-700">Hours per day</span>
            <input
              type="number"
              min={1}
              max={24}
              step="0.5"
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-neutral-700">Skills & certifications</span>
          <input
            value={skillsInput}
            onChange={(event) => setSkillsInput(event.target.value)}
            placeholder="EPA 608, NATE, Commercial HVAC"
            className="min-h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent"
          />
          <p className="text-xs text-neutral-400">Comma-separated values.</p>
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-neutral-700">Service Areas</span>
          <ZipChipEditor zips={serviceZipCodes} onChange={setServiceZipCodes} color="#257AFA" />
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
            disabled={inviteMutation.isPending}
            onClick={() => {
              void handleSubmit();
            }}
            className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {inviteMutation.isPending ? "Saving..." : "Invite Technician"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export function TechnicianTeamClient() {
  const router = useRouter();
  const authRole = useAuthStore((state) => state.user?.role ?? null);
  const session = getStoredSession();
  const role = authRole ?? session?.role ?? "dispatcher";
  const canManage = role === "owner" || role === "admin";
  const techniciansQuery = useTechnicians({
    page: 1,
    limit: 100,
    sortBy: "firstName",
    sortOrder: "asc"
  });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [inviteOpen, setInviteOpen] = useState(false);

  const technicians = techniciansQuery.data?.data ?? [];
  const filteredTechnicians = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return technicians;
    }

    return technicians.filter((technician) =>
      [
        technician.firstName,
        technician.lastName,
        technician.email ?? "",
        technician.phone,
        technician.skills.join(" ")
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [deferredSearch, technicians]);

  if (techniciansQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[92px]" />
        <SkeletonCard className="h-[520px]" />
      </div>
    );
  }

  return (
    <PageLayout
      title="Technicians"
      subtitle="Manage field technicians, availability, service areas, and performance."
      actions={
        canManage ? (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            <Plus className="h-4 w-4" />
            Invite Technician
          </button>
        ) : null
      }
    >
      <section className="surface-card overflow-hidden">
        <div className="border-b border-neutral-200 px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search technicians, emails, skills..."
                className="min-h-11 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-11 pr-4 text-sm outline-none transition focus:border-brand-accent focus:bg-white"
              />
            </div>

            <div className="rounded-full bg-neutral-50 px-4 py-2 text-sm text-neutral-500">
              {filteredTechnicians.length} technicians
            </div>
          </div>
        </div>

        {techniciansQuery.isError ? (
          <div className="px-5 py-12">
            <EmptyState
              icon={UserRound}
              title="Technicians unavailable"
              subtitle="We couldn't load the team roster right now."
            />
          </div>
        ) : filteredTechnicians.length === 0 ? (
          <div className="px-5 py-12">
            <EmptyState
              icon={UserRound}
              title="No technicians found"
              subtitle="Try a different search or add your first field technician."
              action={
                canManage ? (
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Invite Technician
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-[0.18em] text-neutral-400">
                <tr>
                  <th className="px-4 py-4">Technician</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Jobs MTD</th>
                  <th className="px-4 py-4">Rating</th>
                  <th className="px-4 py-4">Utilization</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTechnicians.map((technician) => (
                  <tr
                    key={technician.id}
                    className="cursor-pointer transition hover:bg-brand-accent-light/20"
                    onClick={() => router.push(`/settings/users/${technician.id}`)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: technician.calendarColor }}
                        >
                          {getInitials(technician)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-900">
                            {technician.firstName} {technician.lastName}
                          </p>
                          <p className="mt-1 flex items-center gap-2 truncate text-xs text-neutral-500">
                            <Mail className="h-3.5 w-3.5 text-neutral-300" />
                            {technician.email ?? technician.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-600">
                      {technician.skills[0] ? `Technician - ${technician.skills[0]}` : "Technician"}
                    </td>
                    <TableStatsCell technicianId={technician.id} />
                    <td className="px-4 py-4">
                      <StatBadge label={formatStatusLabel(technician.status)} tone={getStatusTone(technician.status)} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/settings/users/${technician.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-2 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent-light"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Open
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <InviteTechnicianSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </PageLayout>
  );
}
