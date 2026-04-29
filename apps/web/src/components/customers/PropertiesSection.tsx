"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

import type { PropertyRecord } from "@/src/hooks/customers.hooks";
import { formatRelativeTime } from "@/src/lib/utils";

import { getAssetConditionPresentation, getAssetSeverity } from "./customers.utils";
import { StatBadge } from "../ui/StatBadge";
import { cn } from "@/src/lib/utils";

interface PropertiesSectionProps {
  customerId: string;
  properties: PropertyRecord[];
  onAddProperty: () => void;
  onAddAsset: (propertyId: string) => void;
}

export function PropertiesSection({
  customerId,
  properties,
  onAddProperty,
  onAddAsset
}: PropertiesSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(properties[0]?.id ?? null);

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Properties ({properties.length})</h2>
          <p className="mt-1 text-sm text-neutral-500">Expand each property to review the associated assets and service context.</p>
        </div>
        <button
          type="button"
          onClick={onAddProperty}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-brand-accent transition hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {properties.map((property) => {
          const isExpanded = expandedId === property.id;
          const lastService = [...(property.assets ?? [])]
            .map((asset) => asset.lastServiceDate)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => right.localeCompare(left))[0];

          return (
            <div key={property.id} className="overflow-hidden rounded-[26px] border border-neutral-200 bg-neutral-50">
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === property.id ? null : property.id))}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
                    <p className="truncate text-base font-semibold text-neutral-900">{property.addressLine1}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 pl-7 text-sm text-neutral-500">
                    <span>{(property.assets ?? []).length} assets</span>
                    <span>{lastService ? `Last service ${formatRelativeTime(lastService)}` : "No service history yet"}</span>
                  </div>
                </div>
                <Link
                  href={`/customers/${customerId}/properties/${property.id}`}
                  className="shrink-0 text-sm font-semibold text-brand-accent hover:text-brand-primary"
                  onClick={(event) => event.stopPropagation()}
                >
                  View Property
                </Link>
              </button>

              {isExpanded ? (
                <div className="border-t border-neutral-200 bg-white px-5 py-4">
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onAddAsset(property.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Asset
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(property.assets ?? [])
                      .slice()
                      .sort((left, right) => getAssetSeverity(right) - getAssetSeverity(left))
                      .map((asset) => {
                        const condition = getAssetConditionPresentation(asset);

                        return (
                          <div key={asset.id} className="flex flex-col gap-3 rounded-[22px] border border-neutral-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-900">{asset.name}</p>
                              <p className="mt-1 text-sm text-neutral-500">
                                {asset.installDate ? `Installed ${asset.installDate}` : "Install date not recorded"}
                                {asset.lastServiceDate ? ` • Last service ${formatRelativeTime(asset.lastServiceDate)}` : ""}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                  condition.tone === "green" && "bg-success-light text-success",
                                  condition.tone === "orange" && "bg-warning-light text-warning",
                                  condition.tone === "red" && "bg-error-light text-error",
                                  condition.tone === "gray" && "bg-neutral-100 text-neutral-500",
                                  condition.pulse && "animate-pulse"
                                )}
                              >
                                {condition.label}
                              </span>
                              <StatBadge label={asset.assetType} tone="gray" />
                              <Link
                                href={`/customers/${customerId}/assets/${asset.id}?propertyId=${property.id}`}
                                className="text-sm font-semibold text-brand-accent hover:text-brand-primary"
                              >
                                View Asset
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
