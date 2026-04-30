"use client";

import Link from "next/link";
import { Mail, MessageSquareText, PencilLine, Plus, ShieldCheck, Trash2 } from "lucide-react";

import type {
  CustomerAgreementRecord,
  CustomerDetailRecord,
  CustomerInvoiceRecord
} from "@/src/hooks/customers.hooks";

import { getCustomerInitials, getCustomerName, hasActiveAgreement, hasOverdueInvoice, isCustomerDormant } from "./customers.utils";
import { StatBadge } from "../ui/StatBadge";

interface CustomerHeaderProps {
  customer: CustomerDetailRecord;
  agreements: CustomerAgreementRecord[];
  invoices: CustomerInvoiceRecord[];
  onMessage: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerHeader({ customer, agreements, invoices, onMessage, onEdit, onDelete }: CustomerHeaderProps) {
  const badges = [
    isCustomerDormant(customer.lastServiceDate) ? { label: "Dormant", tone: "orange" as const } : { label: "Active", tone: "green" as const },
    ...(hasActiveAgreement(agreements) ? [{ label: "Plan Active", tone: "blue" as const }] : []),
    ...(hasOverdueInvoice(invoices) ? [{ label: "Invoice Overdue", tone: "red" as const }] : [])
  ];

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-brand-accent-light text-lg font-semibold text-brand-accent">
            {getCustomerInitials(customer)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{getCustomerName(customer)}</h1>
              <StatBadge label="Customer" tone="blue" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
              {customer.phone ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-neutral-300">●</span>
                  {customer.phone}
                </span>
              ) : null}
              {customer.email ? (
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  {customer.email}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {tag}
                </span>
              ))}
              {badges.map((badge) => (
                <StatBadge key={badge.label} label={badge.label} tone={badge.tone} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/jobs?new=1&customerId=${customer.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            <Plus className="h-4 w-4" />
            New Job
          </Link>
          <Link
            href={`/service-agreements?enrollCustomerId=${customer.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <ShieldCheck className="h-4 w-4" />
            New Agreement
          </Link>
          <button
            type="button"
            onClick={onMessage}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <MessageSquareText className="h-4 w-4" />
            Message
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error-light px-4 py-2.5 text-sm font-semibold text-error transition hover:bg-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}
