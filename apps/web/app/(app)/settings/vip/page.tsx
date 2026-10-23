"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { StatBadge } from "@/src/components/ui/StatBadge";
import { api } from "@/src/lib/api";

interface VipTier {
  id: string;
  name: string;
  monthlyPrice: string;
  discountPercent: string;
  isActive: boolean;
}

interface VipMember {
  id: string;
  customerId: string;
  tierName: string;
  status: string;
  monthlyPrice: string | null;
  discountPercent: string;
}

function formatUsd(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
    : value;
}

export default function SettingsVipPage() {
  const tiersQuery = useQuery({
    queryKey: ["vip-tiers"],
    queryFn: () => api.get<{ tiers: VipTier[] }>("/api/v1/vip/tiers")
  });

  const membersQuery = useQuery({
    queryKey: ["vip-memberships"],
    queryFn: () => api.get<{ memberships: VipMember[] }>("/api/v1/vip/memberships")
  });

  const policyQuery = useQuery({
    queryKey: ["vip-policy"],
    queryFn: () =>
      api.get<{ policy: { maxPauseMonths: number; pastDueGraceDays: number } }>("/api/v1/vip/policy")
  });

  if (tiersQuery.isLoading || membersQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  const tiers = tiersQuery.data?.tiers ?? [];
  const members = membersQuery.data?.memberships ?? [];
  const policy = policyQuery.data?.policy;

  return (
    <PageLayout title="VIP memberships" subtitle="Tiers, members, pause/dunning (Figma 61:2827 / 61:3133).">
      {policy ? (
        <p className="mb-6 text-sm text-neutral-500">
          Defaults: pause up to <strong>{policy.maxPauseMonths} months</strong>, past-due grace{" "}
          <strong>{policy.pastDueGraceDays} days</strong> with payment retries.
        </p>
      ) : null}

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-neutral-900">VIP tiers</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-neutral-900">{tier.name}</h3>
                <StatBadge
                  label={tier.isActive ? "Active" : "Inactive"}
                  tone={tier.isActive ? "green" : "neutral"}
                />
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {formatUsd(tier.monthlyPrice)}/mo · {tier.discountPercent}% service discount
              </p>
            </article>
          ))}
          {tiers.length === 0 ? (
            <p className="text-sm text-neutral-500">No tiers yet — create via API or import.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-neutral-900">VIP members</h2>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-neutral-900">{member.tierName}</td>
                  <td className="px-4 py-3 capitalize text-neutral-600">{member.status}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {member.monthlyPrice ? formatUsd(member.monthlyPrice) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{member.discountPercent}%</td>
                </tr>
              ))}
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                    No active VIP memberships yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </PageLayout>
  );
}
