"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  PencilLine,
  Phone,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  Wrench
} from "lucide-react";
import type { TechnicianAvailableDay, TechnicianStatus, UpdateTechnicianInput } from "@fsm/types";

import { ZipChipEditor } from "@/src/components/shared/ZipChipEditor";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Sheet } from "@/src/components/ui/Sheet";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import {
  useDeactivateTechnician,
  useTechnician,
  useTechnicianRecentJobs,
  useTechStats,
  useUpdateTechSchedule,
  useUpdateTechServiceAreas,
  useUpdateTechnician
} from "@/src/hooks/technicians.hooks";
import { getStoredSession } from "@/src/lib/auth";
import { formatCurrency, formatDate } from "@/src/lib/utils";
import { useAuthStore } from "@/src/stores/auth.store";
import { showToast } from "@/src/stores/toast.store";

const DAY_OPTIONS: Array<{ value: TechnicianAvailableDay; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" }
];

const DEFAULT_AVAILABLE_DAYS: TechnicianAvailableDay[] = ["mon", "tue", "wed", "thu", "fri"];
const DEFAULT_HOURS_PER_DAY = "8";

function formatRoleLabel(skills: string[]) {
  if (skills[0]) {
    return `Technician - ${skills[0]}`;
  }

  return "Technician - Field Specialist";
}

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

function renderRating(rating: number | null) {
  if (rating == null) {
    return <span className="text-sm text-neutral-400">--</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning">
      {rating}
      <Star className="h-3.5 w-3.5 fill-current" />
    </span>
  );
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

function normalizeStringList(values: string[]) {
  return [...values].map((value) => value.trim()).filter(Boolean).sort();
}

function areEqualLists(left: string[], right: string[]) {
  const normalizedLeft = normalizeStringList(left);
  const normalizedRight = normalizeStringList(right);

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

function sortAvailableDays(days: TechnicianAvailableDay[]) {
  return DAY_OPTIONS.map((day) => day.value).filter((value) => days.includes(value));
}

function getEffectiveAvailableDays(days: TechnicianAvailableDay[]) {
  return days.length > 0 ? sortAvailableDays(days) : [...DEFAULT_AVAILABLE_DAYS];
}

function StatCard({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "orange" | "blue" | "purple";
}) {
  const toneClass =
    tone === "green"
      ? "bg-success-light text-success"
      : tone === "orange"
        ? "bg-warning-light text-warning"
        : tone === "purple"
          ? "bg-ai-light text-ai"
          : "bg-brand-accent-light text-brand-accent";

  return (
    <div className="surface-card px-5 py-5">
      <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{label}</div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
      <p className="mt-2 text-sm text-neutral-500">{detail}</p>
    </div>
  );
}

function EditTechnicianSheet({
  open,
  technicianId,
  initialValues,
  onClose
}: {
  open: boolean;
  technicianId: string;
  initialValues: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
    skills: string[];
  };
  onClose: () => void;
}) {
  const updateMutation = useUpdateTechnician(technicianId);
  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);
  const [notes, setNotes] = useState(initialValues.notes);
  const [skillsInput, setSkillsInput] = useState(initialValues.skills.join(", "));

  useEffect(() => {
    if (!open) {
      return;
    }

    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setEmail(initialValues.email);
    setPhone(initialValues.phone);
    setNotes(initialValues.notes);
    setSkillsInput(initialValues.skills.join(", "));
  }, [initialValues, open]);

  async function handleSave() {
    const payload: UpdateTechnicianInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(email.trim() ? { email: email.trim() } : {}),
      phone: phone.trim(),
      skills: parseSkillsInput(skillsInput),
      ...(notes.trim() ? { notes: notes.trim() } : {})
    };

    try {
      await updateMutation.mutateAsync(payload);
      showToast({
        tone: "success",
        title: "Profile updated",
        description: "Technician details were saved."
      });
      onClose();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Profile not saved",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit Technician Profile"
      description="Update contact details, skills, certifications, and profile notes."
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
            <span className="text-sm font-semibold text-neutral-700">Role</span>
            <input
              value="Technician"
              readOnly
              className="min-h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-500"
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
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-neutral-700">Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
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
          <p className="text-xs text-neutral-400">Comma-separated skills and certifications.</p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-neutral-700">Profile notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="w-full rounded-[24px] border border-neutral-200 px-3 py-3 text-sm outline-none transition focus:border-brand-accent"
          />
        </label>

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
            disabled={updateMutation.isPending}
            onClick={() => {
              void handleSave();
            }}
            className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export function TechnicianProfileClient({ technicianId }: { technicianId: string }) {
  const authRole = useAuthStore((state) => state.user?.role ?? null);
  const session = getStoredSession();
  const role = authRole ?? session?.role ?? "dispatcher";
  const canManage = role === "owner" || role === "admin";

  const technicianQuery = useTechnician(technicianId);
  const statsQuery = useTechStats(technicianId);
  const recentJobsQuery = useTechnicianRecentJobs(technicianId);
  const updateScheduleMutation = useUpdateTechSchedule(technicianId);
  const updateServiceAreasMutation = useUpdateTechServiceAreas(technicianId);
  const deactivateMutation = useDeactivateTechnician(technicianId);

  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [availableDays, setAvailableDays] = useState<TechnicianAvailableDay[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState(DEFAULT_HOURS_PER_DAY);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);

  const technician = technicianQuery.data?.technician ?? null;
  const effectiveAvailableDays = useMemo(
    () => getEffectiveAvailableDays(technician?.availableDays ?? []),
    [technician?.availableDays]
  );
  const effectiveServiceAreas = useMemo(
    () => normalizeStringList(technician?.serviceZipCodes ?? []),
    [technician?.serviceZipCodes]
  );

  useEffect(() => {
    if (!technician) {
      return;
    }

    setAvailableDays(effectiveAvailableDays);
    setHoursPerDay(technician.hoursPerDay ?? DEFAULT_HOURS_PER_DAY);
    setServiceAreas(effectiveServiceAreas);
  }, [effectiveAvailableDays, effectiveServiceAreas, technician]);

  const scheduleDirty = technician
    ? !areEqualLists(availableDays, effectiveAvailableDays) ||
      hoursPerDay !== (technician.hoursPerDay ?? DEFAULT_HOURS_PER_DAY)
    : false;
  const serviceAreasDirty = technician ? !areEqualLists(serviceAreas, effectiveServiceAreas) : false;

  const editInitialValues = useMemo(
    () => ({
      firstName: technician?.firstName ?? "",
      lastName: technician?.lastName ?? "",
      email: technician?.email ?? "",
      phone: technician?.phone ?? "",
      notes: technician?.notes ?? "",
      skills: technician?.skills ?? []
    }),
    [technician]
  );

  if (technicianQuery.isLoading || statsQuery.isLoading || recentJobsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[148px]" />
        <div className="grid gap-4 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonCard key={index} className="h-[118px]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SkeletonCard className="h-[280px]" />
          <SkeletonCard className="h-[280px]" />
        </div>
        <SkeletonCard className="h-[360px]" />
      </div>
    );
  }

  if (technicianQuery.isError || !technician) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Technician not found"
        subtitle="This technician may have been removed or you may not have access in the current company."
        action={
          <Link
            href="/settings/users"
            className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Back to technicians
          </Link>
        }
      />
    );
  }

  const stats = statsQuery.data;
  const recentJobs = recentJobsQuery.data ?? [];

  async function handleSaveSchedule() {
    if (availableDays.length === 0) {
      showToast({
        tone: "error",
        title: "Select availability",
        description: "Choose at least one working day before saving the schedule."
      });
      return;
    }

    try {
      await updateScheduleMutation.mutateAsync({
        hoursPerDay: Number.parseFloat(hoursPerDay) || 8,
        availableDays: sortAvailableDays(availableDays)
      });
      showToast({
        tone: "success",
        title: "Schedule updated",
        description: "Availability settings were saved."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Schedule not saved",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  async function handleSaveServiceAreas() {
    try {
      await updateServiceAreasMutation.mutateAsync(normalizeStringList(serviceAreas));
      showToast({
        tone: "success",
        title: "Service areas updated",
        description: "ZIP coverage was saved for this technician."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Service areas not saved",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  async function handleDeactivate() {
    try {
      await deactivateMutation.mutateAsync();
      showToast({
        tone: "success",
        title: "Technician deactivated",
        description: "The technician will no longer appear as active in scheduling."
      });
      setDeactivateOpen(false);
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not deactivate technician",
        description: error instanceof Error ? error.message : "Try again."
      });
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/settings/users" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">
        <ArrowLeft className="h-4 w-4" />
        All Technicians
      </Link>

      <section className="surface-card px-6 py-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white"
              style={{ backgroundColor: technician.calendarColor }}
            >
              {technician.firstName.charAt(0)}
              {technician.lastName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                  {technician.firstName} {technician.lastName}
                </h1>
                <StatBadge label={formatStatusLabel(technician.status)} tone={getStatusTone(technician.status)} />
              </div>
              <p className="mt-2 text-base text-neutral-500">{formatRoleLabel(technician.skills)}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-500">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-neutral-300" />
                  {technician.phone}
                </span>
                {technician.email ? (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-neutral-300" />
                    {technician.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                <PencilLine className="h-4 w-4" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setDeactivateOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error-light px-4 py-2.5 text-sm font-semibold text-error transition hover:bg-white"
              >
                <Trash2 className="h-4 w-4" />
                Deactivate
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <StatCard
          label="Jobs This Month"
          value={String(stats?.jobsThisMonth ?? 0)}
          detail="Completed in the last 30 days"
          tone="green"
        />
        <StatCard
          label="Avg Rating"
          value={stats?.averageRating != null ? `${stats.averageRating.toFixed(1)} *` : "--"}
          detail={stats?.reviewCount ? `From ${stats.reviewCount} reviews` : "No completed reviews yet"}
          tone="orange"
        />
        <StatCard
          label="Revenue Generated"
          value={formatCurrency(stats?.revenueGenerated ?? "0")}
          detail="Last 30 days"
          tone="blue"
        />
        <StatCard
          label="Utilization"
          value={`${stats?.utilization ?? 0}%`}
          detail="Of saved available hours"
          tone="purple"
        />
        <StatCard
          label="Estimate Conversion"
          value={`${stats?.estimateConversion ?? 0}%`}
          detail="Approved estimates"
          tone="green"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="surface-card px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Skills & Certifications</h2>
            {canManage ? (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="text-sm font-semibold text-brand-accent transition hover:text-brand-primary"
              >
                + Add Skill
              </button>
            ) : null}
          </div>

          {technician.skills.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Wrench}
                title="No skills listed yet"
                subtitle="Update this profile to capture certifications and specialties."
                compact
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {technician.skills.map((skill) => (
                <div key={skill} className="flex items-center gap-3 rounded-[22px] bg-neutral-50 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  <span className="text-sm font-medium text-neutral-700">{skill}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Schedule & Availability</h2>
              <p className="mt-1 text-sm text-neutral-500">Set working days, daily hours, and ZIP coverage.</p>
            </div>
            <CalendarDays className="h-5 w-5 text-neutral-300" />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {DAY_OPTIONS.map((day) => {
              const active = availableDays.includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={!canManage}
                  onClick={() => {
                    if (!canManage) {
                      return;
                    }

                    setAvailableDays((current) =>
                      current.includes(day.value)
                        ? current.filter((value) => value !== day.value)
                        : sortAvailableDays([...current, day.value])
                    );
                  }}
                  className={[
                    "min-w-[68px] rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active ? "bg-brand-accent-light text-brand-accent" : "bg-neutral-100 text-neutral-400",
                    !canManage ? "cursor-default" : ""
                  ].join(" ")}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end">
            <label className="w-full max-w-[220px] space-y-2">
              <span className="text-sm font-semibold text-neutral-700">Hours per day</span>
              <input
                type="number"
                min={1}
                max={24}
                step="0.5"
                disabled={!canManage}
                value={hoursPerDay}
                onChange={(event) => setHoursPerDay(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent disabled:bg-neutral-50 disabled:text-neutral-400"
              />
            </label>
            {canManage ? (
              <button
                type="button"
                disabled={!scheduleDirty || updateScheduleMutation.isPending}
                onClick={() => {
                  void handleSaveSchedule();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-accent px-4 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
              </button>
            ) : null}
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-5">
            <p className="text-sm font-semibold text-neutral-700">Service Areas</p>
            <div className="mt-3">
              <ZipChipEditor zips={serviceAreas} onChange={setServiceAreas} color="#257AFA" />
            </div>
            {canManage ? (
              <button
                type="button"
                disabled={!serviceAreasDirty || updateServiceAreasMutation.isPending}
                onClick={() => {
                  void handleSaveServiceAreas();
                }}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-accent px-4 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateServiceAreasMutation.isPending ? "Saving..." : "Save Service Areas"}
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <section className="surface-card px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Recent Jobs</h2>
            <p className="mt-1 text-sm text-neutral-500">The latest completed or scheduled jobs assigned to this technician.</p>
          </div>
          <Sparkles className="h-5 w-5 text-neutral-300" />
        </div>

        {recentJobs.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={CalendarDays}
              title="No recent jobs yet"
              subtitle="Recent technician work will appear here once jobs are assigned."
              compact
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-[0.18em] text-neutral-400">
                <tr>
                  <th className="px-4 py-4">Job</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Scheduled</th>
                  <th className="px-4 py-4">Revenue</th>
                  <th className="px-4 py-4">Rating</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="transition hover:bg-brand-accent-light/15">
                    <td className="px-4 py-4">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-brand-accent">
                        {job.jobNumber}
                      </Link>
                      <p className="mt-1 text-sm text-neutral-600">{job.title}</p>
                    </td>
                    <td className="px-4 py-4 text-neutral-700">
                      {job.customer.firstName} {job.customer.lastName}
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {job.scheduledStart ? formatDate(job.scheduledStart) : "Not scheduled"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-neutral-900">
                      {job.invoiceTotal ? formatCurrency(job.invoiceTotal) : "--"}
                    </td>
                    <td className="px-4 py-4">{renderRating(job.rating)}</td>
                    <td className="px-4 py-4">
                      <StatBadge
                        label={job.status.replace("_", " ")}
                        tone={job.status === "completed" ? "green" : "blue"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canManage ? (
        <EditTechnicianSheet
          open={editOpen}
          technicianId={technician.id}
          initialValues={editInitialValues}
          onClose={() => setEditOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={deactivateOpen}
        title="Deactivate technician?"
        description="This removes the technician from active scheduling and dispatch planning, but keeps their historical jobs, revenue, and performance data visible."
        confirmLabel="Deactivate technician"
        confirmTone="danger"
        isPending={deactivateMutation.isPending}
        onCancel={() => setDeactivateOpen(false)}
        onConfirm={() => {
          void handleDeactivate();
        }}
      />
    </div>
  );
}
