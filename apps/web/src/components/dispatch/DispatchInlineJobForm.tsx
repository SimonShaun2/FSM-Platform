"use client";

import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Search, X } from "lucide-react";
import type { JobPriority, JobType } from "@fsm/types";

import type { CreateQuickJobInput, CustomerSearchItem } from "@/src/hooks/dispatch.hooks";
import { useCustomerSearch } from "@/src/hooks/dispatch.hooks";
import { cn } from "@/src/lib/utils";

import type { DispatchDropSlot } from "./dispatch.utils";
import { fromDateTimeInputValue, toDateTimeInputValue } from "./dispatch.utils";

const jobTypeOptions: Array<{ value: JobType; label: string }> = [
  { value: "service_call", label: "Service Call" },
  { value: "maintenance", label: "Maintenance" },
  { value: "installation", label: "Installation" },
  { value: "inspection", label: "Inspection" },
  { value: "estimate_only", label: "Estimate Only" },
  { value: "warranty", label: "Warranty" },
  { value: "callback", label: "Callback" },
  { value: "emergency", label: "Emergency" }
];

const priorityOptions: Array<{ value: JobPriority; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

interface DispatchInlineJobFormProps {
  slot: DispatchDropSlot;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (input: CreateQuickJobInput) => Promise<void>;
}

export function DispatchInlineJobForm({
  slot,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit
}: DispatchInlineJobFormProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchItem | null>(null);
  const [title, setTitle] = useState("");
  const [jobType, setJobType] = useState<JobType>("service_call");
  const [priority, setPriority] = useState<JobPriority>("normal");
  const [scheduledStart, setScheduledStart] = useState(toDateTimeInputValue(slot.scheduledStart));
  const [scheduledEnd, setScheduledEnd] = useState(toDateTimeInputValue(slot.scheduledEnd));
  const [localError, setLocalError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(customerSearch);
  const customerQuery = useCustomerSearch(deferredSearch);

  useEffect(() => {
    setCustomerSearch("");
    setSelectedCustomer(null);
    setTitle("");
    setJobType("service_call");
    setPriority("normal");
    setScheduledStart(toDateTimeInputValue(slot.scheduledStart));
    setScheduledEnd(toDateTimeInputValue(slot.scheduledEnd));
    setLocalError(null);
  }, [slot]);

  const customerResults = useMemo(() => customerQuery.data?.customers ?? [], [customerQuery.data?.customers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCustomer) {
      setLocalError("Select a customer before creating the job.");
      return;
    }

    if (!title.trim()) {
      setLocalError("Add a short job title.");
      return;
    }

    if (scheduledEnd <= scheduledStart) {
      setLocalError("End time must be later than the start time.");
      return;
    }

    setLocalError(null);

    await onSubmit({
      customerId: selectedCustomer.id,
      technicianId: slot.technicianId,
      title: title.trim(),
      type: jobType,
      priority,
      scheduledStart: fromDateTimeInputValue(scheduledStart),
      scheduledEnd: fromDateTimeInputValue(scheduledEnd)
    });
  }

  return (
    <div className="absolute inset-x-3 top-3 z-20 rounded-[28px] border border-brand-accent/15 bg-white p-4 shadow-[0_22px_60px_rgba(16,33,99,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Quick create on {slot.technicianName}</p>
          <p className="mt-1 text-xs text-neutral-500">Drop a new job straight into this open slot.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Close quick create"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Customer
          </label>
          <div className="mt-2 flex items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={customerSearch}
              onChange={(event) => {
                setCustomerSearch(event.target.value);
                setSelectedCustomer(null);
                setLocalError(null);
              }}
              placeholder={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Search customers"}
              className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>

          {selectedCustomer ? (
            <div className="mt-2 rounded-2xl bg-brand-accent-light px-3 py-2 text-sm font-medium text-brand-accent">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </div>
          ) : null}

          {customerQuery.isLoading && deferredSearch.trim().length >= 2 ? (
            <div className="mt-2 flex items-center gap-2 rounded-2xl bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching customers...
            </div>
          ) : null}

          {!selectedCustomer && customerResults.length > 0 ? (
            <div className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-2 shadow-lg">
              {customerResults.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
                    setLocalError(null);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-neutral-500">{customer.phone ?? customer.email ?? "No contact info"}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Job title</span>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setLocalError(null);
            }}
            placeholder="AC not cooling"
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent focus:bg-white"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Type</span>
            <select
              value={jobType}
              onChange={(event) => setJobType(event.target.value as JobType)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent focus:bg-white"
            >
              {jobTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Priority</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as JobPriority)}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent focus:bg-white"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Start</span>
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(event) => {
                setScheduledStart(event.target.value);
                setLocalError(null);
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">End</span>
            <input
              type="datetime-local"
              value={scheduledEnd}
              onChange={(event) => {
                setScheduledEnd(event.target.value);
                setLocalError(null);
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent focus:bg-white"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-h-5 text-sm text-error">
            <span className={cn(!(localError || errorMessage) && "invisible")}>{localError ?? errorMessage ?? "ok"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create job"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
