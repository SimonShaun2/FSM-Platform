"use client";

import { differenceInDays, parseISO } from "date-fns";

import type {
  AssetRecord,
  CustomerAgreementRecord,
  CustomerDetailRecord,
  CustomerInvoiceRecord,
  CustomerListRecord,
  CustomerMessageLogRecord,
  CustomerPaymentRecord,
  PropertyRecord
} from "@/src/hooks/customers.hooks";

export type ConditionTone = "green" | "orange" | "red" | "gray";

export interface ConditionPresentation {
  label: string;
  tone: ConditionTone;
  pulse: boolean;
}

const DORMANT_DAYS_THRESHOLD = 180;

export function getCustomerName(customer: Pick<CustomerListRecord, "firstName" | "lastName" | "displayName">): string {
  return customer.displayName?.trim() || `${customer.firstName} ${customer.lastName}`.trim();
}

export function getCustomerInitials(customer: Pick<CustomerDetailRecord, "firstName" | "lastName" | "displayName">): string {
  const label = getCustomerName(customer);
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatAddress(property: Pick<PropertyRecord, "addressLine1" | "city" | "state" | "zip">): string {
  return [property.addressLine1, `${property.city}, ${property.state} ${property.zip}`].filter(Boolean).join(" • ");
}

export function isCustomerDormant(lastServiceDate: string | null): boolean {
  if (!lastServiceDate) {
    return true;
  }

  return differenceInDays(new Date(), parseISO(lastServiceDate)) > DORMANT_DAYS_THRESHOLD;
}

export function hasActiveAgreement(agreements: CustomerAgreementRecord[]): boolean {
  return agreements.some((agreement) => agreement.status === "active");
}

export function hasOverdueInvoice(invoices: CustomerInvoiceRecord[]): boolean {
  return invoices.some((invoice) => {
    if (invoice.status === "overdue") {
      return true;
    }

    if (invoice.balanceDue === "0.00" || invoice.balanceDue === "0") {
      return false;
    }

    return invoice.dueAt ? parseISO(invoice.dueAt).getTime() < Date.now() : false;
  });
}

export function getAssetConditionPresentation(
  asset: Pick<AssetRecord, "condition">
): ConditionPresentation {
  switch (asset.condition) {
    case "excellent":
    case "good":
      return {
        label: "Healthy",
        tone: "green",
        pulse: false
      };
    case "fair":
      return {
        label: "Aging",
        tone: "orange",
        pulse: false
      };
    case "poor":
      return {
        label: "At Risk",
        tone: "red",
        pulse: true
      };
    case "failed":
      return {
        label: "Critical",
        tone: "red",
        pulse: false
      };
    default:
      return {
        label: "Unknown",
        tone: "gray",
        pulse: false
      };
  }
}

export function getAssetSeverity(asset: Pick<AssetRecord, "condition">): number {
  switch (asset.condition) {
    case "failed":
      return 4;
    case "poor":
      return 3;
    case "fair":
      return 2;
    case "good":
    case "excellent":
      return 1;
    default:
      return 0;
  }
}

export function getLastJobDate(jobs: Array<{ scheduledStart: string | null; createdAt: string }>): string | null {
  const candidates = jobs
    .map((job) => job.scheduledStart ?? job.createdAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => parseISO(right).getTime() - parseISO(left).getTime());

  return candidates[0] ?? null;
}

export function getTotalCollected(payments: CustomerPaymentRecord[]): number {
  return payments
    .filter((payment) => payment.status === "succeeded")
    .reduce((sum, payment) => sum + Number.parseFloat(payment.amount ?? "0"), 0);
}

export function getTotalBilled(invoices: CustomerInvoiceRecord[]): number {
  return invoices.reduce((sum, invoice) => sum + Number.parseFloat(invoice.total ?? "0"), 0);
}

export function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

export function stringToTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag, index, tags) => tag.length > 0 && tags.indexOf(tag) === index);
}

export function buildAssetName({
  assetType,
  brand,
  model
}: {
  assetType: string;
  brand?: string | undefined;
  model?: string | undefined;
}): string {
  const parts = [brand?.trim(), model?.trim(), assetType.trim()].filter(Boolean);
  return parts.join(" ");
}

export function groupCampaignLogs(logs: CustomerMessageLogRecord[]) {
  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      channel: string;
      sentAt: string | null;
      deliveredCount: number;
      failedCount: number;
    }
  >();

  for (const log of logs) {
    if (!log.campaignId || !log.campaignName) {
      continue;
    }

    const existing = grouped.get(log.campaignId) ?? {
      id: log.campaignId,
      name: log.campaignName,
      channel: log.channel,
      sentAt: log.sentAt,
      deliveredCount: 0,
      failedCount: 0
    };

    grouped.set(log.campaignId, {
      ...existing,
      sentAt: existing.sentAt ?? log.sentAt,
      deliveredCount: existing.deliveredCount + (log.deliveredAt ? 1 : 0),
      failedCount: existing.failedCount + (log.failedAt ? 1 : 0)
    });
  }

  return [...grouped.values()].sort((left, right) => {
    const leftTime = left.sentAt ? parseISO(left.sentAt).getTime() : 0;
    const rightTime = right.sentAt ? parseISO(right.sentAt).getTime() : 0;
    return rightTime - leftTime;
  });
}
