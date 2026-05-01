"use client";

import { AlertCircle, CheckCircle2, CopyMinus, ShieldAlert } from "lucide-react";

interface Step5ConfirmProps {
  totalRows: number;
  duplicateCount: number;
  duplicateSkipCount: number;
  duplicateUpdateCount: number;
  validationErrorsCount: number;
  validationReady: boolean;
  isStartingImport: boolean;
  onBack: () => void;
  onCancel: () => void;
  onStartImport: () => void;
}

export function Step5Confirm({
  totalRows,
  duplicateCount,
  duplicateSkipCount,
  duplicateUpdateCount,
  validationErrorsCount,
  validationReady,
  isStartingImport,
  onBack,
  onCancel,
  onStartImport
}: Step5ConfirmProps) {
  const importedCount = Math.max(totalRows - validationErrorsCount - duplicateSkipCount, 0);
  const skippedCount = validationErrorsCount + duplicateSkipCount;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
      <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Step 5</p>
          <h3 className="mt-2 text-xl font-semibold text-neutral-900">Confirm and start the import</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Review the final counts before the worker starts processing. You can still cancel the import
            up until the moment you start it.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-success/20 bg-success/10 px-4 py-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">Will import</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-neutral-900">{importedCount}</p>
          </div>
          <div className="rounded-[24px] border border-warning/20 bg-warning/10 px-4 py-4">
            <div className="flex items-center gap-2 text-warning-dark">
              <CopyMinus className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">Will skip</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-neutral-900">{skippedCount}</p>
          </div>
          <div className="rounded-[24px] border border-brand-accent/15 bg-brand-panel px-4 py-4">
            <div className="flex items-center gap-2 text-brand-accent">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">Duplicates</span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-neutral-900">{duplicateCount}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-neutral-200 bg-neutral-50/80 px-5 py-5">
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div className="rounded-[20px] bg-white px-4 py-4">
              <dt className="text-neutral-500">Rows in file</dt>
              <dd className="mt-2 text-lg font-semibold text-neutral-900">{totalRows}</dd>
            </div>
            <div className="rounded-[20px] bg-white px-4 py-4">
              <dt className="text-neutral-500">Rows with validation errors</dt>
              <dd className="mt-2 text-lg font-semibold text-neutral-900">{validationErrorsCount}</dd>
            </div>
            <div className="rounded-[20px] bg-white px-4 py-4">
              <dt className="text-neutral-500">Duplicate rows skipped</dt>
              <dd className="mt-2 text-lg font-semibold text-neutral-900">{duplicateSkipCount}</dd>
            </div>
            <div className="rounded-[20px] bg-white px-4 py-4">
              <dt className="text-neutral-500">Duplicate rows updating existing customers</dt>
              <dd className="mt-2 text-lg font-semibold text-neutral-900">{duplicateUpdateCount}</dd>
            </div>
          </dl>

          {!validationReady ? (
            <div className="mt-4 rounded-[20px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-dark">
              We are still finishing server-side validation. Start Import will unlock once the row counts
              are ready.
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-11 items-center rounded-full border border-neutral-200 px-5 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center rounded-full border border-neutral-200 px-5 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              Cancel import
            </button>
          </div>
          <button
            type="button"
            onClick={onStartImport}
            disabled={!validationReady || isStartingImport}
            className="inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStartingImport ? "Starting import..." : "Start Import"}
          </button>
        </div>
      </section>

      <aside className="rounded-[30px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">What happens next</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-500">
          <li>The worker imports customers in batches of 100 and keeps progress updated in real time.</li>
          <li>Rows with validation errors are skipped and included in the downloadable error report.</li>
          <li>When the import finishes, we immediately queue a dormant-customer revenue scan.</li>
        </ul>
        <div className="mt-6 rounded-[24px] border border-neutral-200 bg-neutral-50/80 px-4 py-4 text-sm text-neutral-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-brand-accent" />
            <p>
              Once you enter the live progress step, this import is already running in the background and can
              no longer be canceled from the browser.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
