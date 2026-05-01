"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/src/lib/utils";

interface ZipChipEditorProps {
  zips: string[];
  onChange: (zips: string[]) => void;
  color?: string;
}

const ZIP_CODE_PATTERN = /^\d{5}$/u;

function normalizeZipList(zips: string[]) {
  return Array.from(new Set(zips.map((zip) => zip.trim()).filter((zip) => ZIP_CODE_PATTERN.test(zip)))).sort();
}

export function ZipChipEditor({ zips, onChange, color }: ZipChipEditorProps) {
  const [draftZip, setDraftZip] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAddZip() {
    const normalizedZip = draftZip.trim();

    if (!normalizedZip) {
      setError(null);
      return;
    }

    if (!ZIP_CODE_PATTERN.test(normalizedZip)) {
      setError("Use a valid 5-digit ZIP code.");
      return;
    }

    if (zips.includes(normalizedZip)) {
      setError("That ZIP code is already included.");
      return;
    }

    onChange(normalizeZipList([...zips, normalizedZip]));
    setDraftZip("");
    setError(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddZip();
    }
  }

  function handleRemoveZip(zip: string) {
    onChange(zips.filter((value) => value !== zip));
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {zips.map((zip) => (
          <span
            key={zip}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: color ? `${color}1A` : undefined,
              color: color ?? undefined
            }}
          >
            {zip}
            <button
              type="button"
              onClick={() => handleRemoveZip(zip)}
              className={cn("transition hover:opacity-80", !color && "text-success/80 hover:text-success")}
              aria-label={`Remove ${zip}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {zips.length === 0 ? (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-400">
            No ZIP codes added
          </span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          value={draftZip}
          onChange={(event) => {
            setDraftZip(event.target.value);
            if (error) {
              setError(null);
            }
          }}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          maxLength={5}
          placeholder="Add ZIP code"
          className="min-h-11 flex-1 rounded-2xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-brand-accent"
        />
        <button
          type="button"
          onClick={handleAddZip}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-accent px-4 text-sm font-semibold text-white transition hover:bg-brand-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
