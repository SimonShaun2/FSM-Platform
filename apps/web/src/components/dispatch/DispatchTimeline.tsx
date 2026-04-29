"use client";

import { useDroppable } from "@dnd-kit/core";
import { CalendarPlus2, CalendarRange } from "lucide-react";
import type { DispatchGap, DispatchJobCard, DispatchTechnicianDay } from "@fsm/types";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import type { CreateQuickJobInput } from "@/src/hooks/dispatch.hooks";
import { cn } from "@/src/lib/utils";

import { DispatchInlineJobForm } from "./DispatchInlineJobForm";
import type { DispatchDropSlot, DispatchDropTargetData } from "./dispatch.utils";
import {
  DISPATCH_DAY_END_HOUR,
  DISPATCH_DAY_START_HOUR,
  formatDispatchRange,
  formatTimelineHour,
  getInitials,
  getTimelineStyle,
  getStatusTone,
  buildDispatchSlotFromGap
} from "./dispatch.utils";

const timelineWidthClass = "min-w-[880px]";

interface DispatchTimelineProps {
  technicians: DispatchTechnicianDay[];
  isLoading: boolean;
  selectedJobId: string | null;
  quickCreateSlot: DispatchDropSlot | null;
  createQuickJobPending: boolean;
  createQuickJobError: string | null;
  activeDragJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onOpenQuickCreate: (slot: DispatchDropSlot) => void;
  onCloseQuickCreate: () => void;
  onCreateQuickJob: (input: CreateQuickJobInput) => Promise<void>;
}

function TimelineHeader() {
  const hours = Array.from(
    { length: DISPATCH_DAY_END_HOUR - DISPATCH_DAY_START_HOUR },
    (_, index) => DISPATCH_DAY_START_HOUR + index
  );

  return (
    <div className={cn("grid grid-cols-[220px_minmax(0,1fr)] gap-4", timelineWidthClass)}>
      <div className="px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Technician</p>
      </div>
      <div className="grid grid-cols-10 gap-0 rounded-[24px] border border-neutral-200 bg-neutral-50 px-3 py-3">
        {hours.map((hour) => (
          <div key={hour} className="border-l border-neutral-200 px-3 first:border-l-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{formatTimelineHour(hour)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineGap({
  gap,
  technician,
  isDragging,
  onOpenQuickCreate
}: {
  gap: DispatchGap;
  technician: DispatchTechnicianDay;
  isDragging: boolean;
  onOpenQuickCreate: (slot: DispatchDropSlot) => void;
}) {
  const slot = buildDispatchSlotFromGap(technician.id, technician.name, gap);
  const dropData: DispatchDropTargetData = {
    type: "dispatch-slot",
    slot
  };
  const { setNodeRef, isOver } = useDroppable({
    id: `dispatch-slot:${technician.id}:${gap.start}`,
    data: dropData
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpenQuickCreate(slot)}
      style={getTimelineStyle(gap.start, gap.end)}
      className={cn(
        "absolute top-2 z-0 flex h-[72px] items-center justify-center rounded-[22px] border border-dashed text-xs font-semibold uppercase tracking-[0.18em] transition",
        "border-warning/50 bg-warning-light/80 text-warning",
        isDragging && "opacity-100",
        isOver && "border-brand-accent bg-brand-accent-light text-brand-accent shadow-[0_18px_40px_rgba(37,122,250,0.2)]"
      )}
    >
      drop here
    </button>
  );
}

function TimelineJobBlock({
  job,
  isSelected,
  onSelectJob
}: {
  job: DispatchJobCard;
  isSelected: boolean;
  onSelectJob: (jobId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectJob(job.id)}
      style={getTimelineStyle(job.scheduledStart, job.scheduledEnd)}
      className={cn(
        "absolute top-2 z-10 flex h-[72px] flex-col items-start justify-between rounded-[22px] px-4 py-3 text-left shadow-sm transition",
        getStatusTone(job.status),
        isSelected && "ring-2 ring-brand-accent ring-offset-2 ring-offset-white"
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{job.customer.firstName} {job.customer.lastName}</p>
        <p className="mt-1 truncate text-xs opacity-85">{job.title}</p>
      </div>
      <p className="text-[11px] font-medium opacity-80">{formatDispatchRange(job.scheduledStart, job.scheduledEnd)}</p>
    </button>
  );
}

function TechnicianRow({
  technician,
  selectedJobId,
  quickCreateSlot,
  createQuickJobPending,
  createQuickJobError,
  activeDragJobId,
  onSelectJob,
  onOpenQuickCreate,
  onCloseQuickCreate,
  onCreateQuickJob
}: {
  technician: DispatchTechnicianDay;
  selectedJobId: string | null;
  quickCreateSlot: DispatchDropSlot | null;
  createQuickJobPending: boolean;
  createQuickJobError: string | null;
  activeDragJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onOpenQuickCreate: (slot: DispatchDropSlot) => void;
  onCloseQuickCreate: () => void;
  onCreateQuickJob: (input: CreateQuickJobInput) => Promise<void>;
}) {
  const rowHasQuickCreate = Boolean(
    quickCreateSlot?.technicianId === technician.id &&
      quickCreateSlot.scheduledStart &&
      quickCreateSlot.scheduledEnd
  );

  return (
    <div className={cn("grid grid-cols-[220px_minmax(0,1fr)] gap-4", timelineWidthClass)}>
      <div className="rounded-[24px] border border-neutral-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent-light text-sm font-semibold text-brand-accent">
            {getInitials(technician.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{technician.name}</p>
            <p className="text-xs text-neutral-500">
              {technician.hoursScheduled}h / {technician.hoursAvailable}h scheduled
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs font-medium text-neutral-500">
          <span>{technician.jobs.length} jobs</span>
          <span>{Math.round(technician.utilization)}% utilized</span>
        </div>
      </div>

      <div className="relative overflow-visible rounded-[26px] border border-neutral-200 bg-white px-3 py-3 shadow-sm">
        <div className="absolute inset-y-3 left-3 right-3 rounded-[22px] bg-neutral-50" />
        <div className="pointer-events-none absolute inset-y-3 left-3 right-3 grid grid-cols-10 rounded-[22px]">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="border-l border-neutral-200 first:border-l-0" />
          ))}
        </div>

        {technician.hoursAvailable <= 0 && technician.jobs.length === 0 ? (
          <div className="absolute inset-x-6 top-5 z-10 flex h-[72px] items-center justify-center rounded-[22px] bg-neutral-300/80 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-600">
            Out
          </div>
        ) : null}

        {technician.gaps.map((gap) => (
          <TimelineGap
            key={`${technician.id}-${gap.start}`}
            gap={gap}
            technician={technician}
            isDragging={Boolean(activeDragJobId)}
            onOpenQuickCreate={onOpenQuickCreate}
          />
        ))}

        {technician.jobs.map((job) => (
          <TimelineJobBlock
            key={job.id}
            job={job}
            isSelected={selectedJobId === job.id}
            onSelectJob={onSelectJob}
          />
        ))}

        {rowHasQuickCreate && quickCreateSlot ? (
          <DispatchInlineJobForm
            slot={quickCreateSlot}
            isSubmitting={createQuickJobPending}
            errorMessage={createQuickJobError}
            onCancel={onCloseQuickCreate}
            onSubmit={onCreateQuickJob}
          />
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (technician.gaps[0]) {
              onOpenQuickCreate(buildDispatchSlotFromGap(technician.id, technician.name, technician.gaps[0]));
            }
          }}
          className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-brand-accent/30 hover:text-brand-accent"
        >
          <CalendarPlus2 className="h-4 w-4" />
          Quick add
        </button>
      </div>
    </div>
  );
}

function TimelineLoading() {
  return (
    <div className="space-y-3">
      <TimelineHeader />
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={cn("grid grid-cols-[220px_minmax(0,1fr)] gap-4", timelineWidthClass)}>
          <SkeletonCard className="h-[104px]" />
          <SkeletonCard className="h-[104px]" />
        </div>
      ))}
    </div>
  );
}

export function DispatchTimeline({
  technicians,
  isLoading,
  selectedJobId,
  quickCreateSlot,
  createQuickJobPending,
  createQuickJobError,
  activeDragJobId,
  onSelectJob,
  onOpenQuickCreate,
  onCloseQuickCreate,
  onCreateQuickJob
}: DispatchTimelineProps) {
  if (isLoading) {
    return <TimelineLoading />;
  }

  if (technicians.length === 0) {
    return (
      <section className="surface-card p-8">
        <EmptyState
          icon={CalendarRange}
          title="No technicians match these filters"
          subtitle="Try widening the date or technician filters. Once jobs and techs line up, the dispatch canvas will populate here."
        />
      </section>
    );
  }

  return (
    <section className="surface-card overflow-x-auto px-4 py-4">
      <div className="space-y-3">
        <TimelineHeader />
        {technicians.map((technician) => (
          <TechnicianRow
            key={technician.id}
            technician={technician}
            selectedJobId={selectedJobId}
            quickCreateSlot={quickCreateSlot}
            createQuickJobPending={createQuickJobPending}
            createQuickJobError={createQuickJobError}
            activeDragJobId={activeDragJobId}
            onSelectJob={onSelectJob}
            onOpenQuickCreate={onOpenQuickCreate}
            onCloseQuickCreate={onCloseQuickCreate}
            onCreateQuickJob={onCreateQuickJob}
          />
        ))}
      </div>
    </section>
  );
}
