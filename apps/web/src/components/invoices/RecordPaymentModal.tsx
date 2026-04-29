"use client";

import { useEffect, useState } from "react";

import { Sheet } from "@/src/components/ui/Sheet";

type PaymentMethodOption = "cash" | "check" | "other";

interface RecordPaymentModalProps {
  open: boolean;
  balanceDue: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (input: {
    amount: number;
    method: PaymentMethodOption;
    paidAt?: string;
    checkNumber?: string;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<void>;
}

interface PaymentFormState {
  amount: string;
  method: PaymentMethodOption;
  paidAt: string;
  checkNumber: string;
  referenceNumber: string;
  notes: string;
}

function getTodayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialState(balanceDue: string): PaymentFormState {
  return {
    amount: balanceDue,
    method: "cash",
    paidAt: getTodayDateInput(),
    checkNumber: "",
    referenceNumber: "",
    notes: ""
  };
}

export function RecordPaymentModal({
  open,
  balanceDue,
  isPending,
  onClose,
  onSubmit
}: RecordPaymentModalProps) {
  const [form, setForm] = useState<PaymentFormState>(() => buildInitialState(balanceDue));

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildInitialState(balanceDue));
  }, [balanceDue, open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Record Payment"
      description="Capture a manual payment and mark the invoice balance accordingly."
    >
      <div className="space-y-5 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Amount</label>
            <input
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              inputMode="decimal"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none transition focus:border-brand-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Method</label>
            <select
              value={form.method}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  method: event.target.value as PaymentMethodOption
                }))
              }
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none transition focus:border-brand-accent"
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Payment Date</label>
            <input
              type="date"
              value={form.paidAt}
              onChange={(event) => setForm((current) => ({ ...current, paidAt: event.target.value }))}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none transition focus:border-brand-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">
              {form.method === "check" ? "Check Number" : "Reference #"}
            </label>
            <input
              value={form.method === "check" ? form.checkNumber : form.referenceNumber}
              onChange={(event) =>
                setForm((current) =>
                  form.method === "check"
                    ? { ...current, checkNumber: event.target.value }
                    : { ...current, referenceNumber: event.target.value }
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none transition focus:border-brand-accent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-neutral-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            rows={4}
            placeholder="Optional payment note"
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700 outline-none transition focus:border-brand-accent"
          />
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
            disabled={isPending}
            onClick={() => {
              void onSubmit({
                amount: Number.parseFloat(form.amount) || 0,
                method: form.method,
                ...(form.paidAt ? { paidAt: form.paidAt } : {}),
                ...(form.checkNumber ? { checkNumber: form.checkNumber } : {}),
                ...(form.referenceNumber ? { referenceNumber: form.referenceNumber } : {}),
                ...(form.notes ? { notes: form.notes } : {})
              });
            }}
            className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Saving..." : "Mark as Paid"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
