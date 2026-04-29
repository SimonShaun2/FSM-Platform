"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { GripVertical, Plus } from "lucide-react";
import type { JobTask } from "@fsm/types";

import { StatBadge } from "@/src/components/ui/StatBadge";
import { useCompleteTask, useCreateTask, useReorderTasks, useUpdateTask } from "@/src/hooks/jobs.hooks";
import { cn } from "@/src/lib/utils";

import { formatTaskMinutes, getTaskProgress } from "./jobs.utils";

interface TaskChecklistProps {
  jobId: string;
  tasks: JobTask[];
}

interface SortableTaskRowProps {
  task: JobTask;
  onToggle: (task: JobTask) => Promise<void>;
}

function SortableTaskRow({ task, onToggle }: SortableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition
  };

  const isComplete = task.status === "completed";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-[22px] border border-neutral-200 bg-white px-4 py-3 shadow-sm transition",
        isDragging && "border-brand-accent/30 shadow-[0_20px_40px_rgba(37,122,250,0.16)]"
      )}
    >
      <button
        type="button"
        className="cursor-grab rounded-full p-1 text-neutral-300 transition hover:bg-neutral-100 hover:text-neutral-500"
        aria-label="Reorder task"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => {
          void onToggle(task);
        }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          isComplete
            ? "border-success bg-success text-white"
            : "border-neutral-300 bg-white text-transparent hover:border-success"
        )}
        aria-label={isComplete ? "Mark task as pending" : "Complete task"}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-sm font-medium text-neutral-800", isComplete && "text-neutral-400 line-through")}>
            {task.title}
          </p>
          {task.isRequired && !isComplete ? <StatBadge label="Required" tone="orange" /> : null}
        </div>
        {task.description ? <p className="mt-1 text-sm text-neutral-500">{task.description}</p> : null}
      </div>

      <p className="text-xs font-medium text-neutral-400">{formatTaskMinutes(task.estimatedMinutes)}</p>
    </div>
  );
}

export function TaskChecklist({ jobId, tasks }: TaskChecklistProps) {
  const createTask = useCreateTask(jobId);
  const updateTask = useUpdateTask(jobId);
  const completeTask = useCompleteTask(jobId);
  const reorderTasks = useReorderTasks(jobId);
  const [newTask, setNewTask] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const orderedTasks = useMemo(
    () =>
      tasks
        .slice()
        .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER)),
    [tasks]
  );
  const progress = getTaskProgress(orderedTasks);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  async function handleToggle(task: JobTask) {
    setErrorMessage(null);

    if (task.status === "completed") {
      await updateTask.mutateAsync({
        taskId: task.id,
        input: {
          status: "pending"
        }
      });
      return;
    }

    await completeTask.mutateAsync(task.id);
  }

  async function handleReorder(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedTasks.findIndex((task) => task.id === active.id);
    const newIndex = orderedTasks.findIndex((task) => task.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedIds = arrayMove(
      orderedTasks.map((task) => task.id),
      oldIndex,
      newIndex
    );

    try {
      await reorderTasks.mutateAsync(reorderedIds);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Tasks could not be reordered.");
    }
  }

  async function handleCreateTask() {
    if (!newTask.trim()) {
      return;
    }

    setErrorMessage(null);

    try {
      await createTask.mutateAsync({
        title: newTask.trim(),
        sortOrder: orderedTasks.length
      });
      setNewTask("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Task could not be created.");
    }
  }

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl text-success">✓</span>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Tasks</h2>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {progress.completed} of {progress.total} complete
            {progress.total > 0 ? ` • ${progress.percent}%` : ""}
          </p>
        </div>
        {progress.pendingRequired.length > 0 ? (
          <StatBadge label={`${progress.pendingRequired.length} required left`} tone="orange" />
        ) : (
          <StatBadge label="On track" tone="green" />
        )}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-success transition-[width] duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {orderedTasks.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
            No checklist items yet. Add the first task below.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
            <SortableContext items={orderedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              {orderedTasks.map((task) => (
                <SortableTaskRow key={task.id} task={task} onToggle={handleToggle} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-brand-accent">
          <Plus className="h-4 w-4" />
          <span className="text-sm font-semibold">Add Task</span>
        </div>
        <input
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleCreateTask();
            }
          }}
          placeholder="Add a checklist item and press Enter"
          className="flex-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent"
        />
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-3xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error">{errorMessage}</p>
      ) : null}
    </section>
  );
}
