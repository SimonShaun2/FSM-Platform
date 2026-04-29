"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/src/lib/utils";

interface FieldProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}

const controlClassName =
  "w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-accent focus:bg-white";

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-neutral-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-neutral-400">{hint}</span> : null}
      {error ? <span className="block text-sm text-error">{error}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClassName, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClassName, "min-h-[120px] resize-y", props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClassName, props.className)} />;
}

export function CheckboxField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 text-brand-accent focus:ring-brand-accent"
      />
      <span className="text-sm font-medium text-neutral-700">{label}</span>
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-error/15 bg-error-light px-4 py-3 text-sm text-error">
      {message}
    </div>
  );
}
