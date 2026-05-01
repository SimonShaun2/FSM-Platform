"use client";

import { Loader2, WandSparkles, X } from "lucide-react";
import type { AutoFitSuggestion } from "@fsm/types";

import { cn } from "@/src/lib/utils";

import { formatDispatchRange, getInitials } from "./dispatch.utils";

interface AutoFitOverlayProps {
  suggestions: AutoFitSuggestion[];
  currentIndex: number;
  isLoading: boolean;
  isAccepting: boolean;
  message: string | null;
  onAccept: (suggestion: AutoFitSuggestion) => void;
  onDecline: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Match score</p>
        <p className="text-sm font-semibold text-neutral-900">{score}/100</p>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-brand-accent transition-all duration-300"
          style={{ width: `${Math.max(6, Math.min(score, 100))}%` }}
        />
      </div>
    </div>
  );
}

export function AutoFitOverlay({
  suggestions,
  currentIndex,
  isLoading,
  isAccepting,
  message,
  onAccept,
  onDecline,
  onNext,
  onPrevious
}: AutoFitOverlayProps) {
  const suggestion = suggestions[currentIndex] ?? null;
  const hasMultipleSuggestions = suggestions.length > 1;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[32px] bg-white/65 p-6 backdrop-blur-sm">
      <div className="w-full max-w-[540px] rounded-[32px] border border-brand-accent/15 bg-white p-6 shadow-[0_32px_100px_rgba(37,122,250,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-ai-light px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-ai">
              <WandSparkles className="h-4 w-4" />
              AI Dispatch Suggestion
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
              {isLoading ? "Finding the best fit..." : "Recommended placement"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close auto-fit overlay"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-neutral-50 px-6 py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
            <div>
              <p className="text-base font-semibold text-neutral-900">Finding best match...</p>
              <p className="mt-2 text-sm text-neutral-500">
                Scoring zip coverage, skill overlap, open gaps, and technician workload.
              </p>
            </div>
          </div>
        ) : suggestion ? (
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4 rounded-[28px] bg-neutral-50 px-5 py-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent-light text-lg font-semibold text-brand-accent">
                {getInitials(suggestion.technicianName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-neutral-900">{suggestion.technicianName}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatDispatchRange(suggestion.scheduledStart, suggestion.scheduledEnd)}
                </p>
              </div>
            </div>

            <ScoreBar score={suggestion.score} />

            <div className="grid gap-3 rounded-[28px] bg-neutral-50 px-5 py-5 md:grid-cols-2">
              <div className="rounded-[22px] bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">ZIP</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">{suggestion.scoreBreakdown.zipMatch}/25</p>
              </div>
              <div className="rounded-[22px] bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Skills</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">{suggestion.scoreBreakdown.skillsMatch}/25</p>
              </div>
              <div className="rounded-[22px] bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Utilization</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">{suggestion.scoreBreakdown.utilizationScore}/25</p>
              </div>
              <div className="rounded-[22px] bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Gap Fit</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">{suggestion.scoreBreakdown.gapFitScore}/25</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-ai/15 bg-ai-light/40 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ai">Why this fit</p>
              <p className="mt-3 text-sm italic leading-6 text-neutral-700">{suggestion.reasoningText}</p>
            </div>

            {hasMultipleSuggestions ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={onPrevious}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  Previous
                </button>
                <p className="text-neutral-500">
                  Option {currentIndex + 1} of {suggestions.length}
                </p>
                <button
                  type="button"
                  onClick={onNext}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  See other options
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] bg-neutral-50 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-neutral-900">No placement available</p>
            <p className="mt-3 text-sm leading-6 text-neutral-500">{message ?? "No technician could take this job on that date."}</p>
          </div>
        )}

        <div className={cn("mt-6 grid gap-3", suggestion ? "md:grid-cols-2" : "grid-cols-1")}>
          {suggestion ? (
            <button
              type="button"
              onClick={() => onAccept(suggestion)}
              disabled={isAccepting}
              className="rounded-2xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAccepting ? "Scheduling..." : "Accept suggestion"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDecline}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            {suggestion ? "Decline" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
