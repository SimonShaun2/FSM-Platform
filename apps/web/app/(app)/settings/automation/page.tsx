"use client";

import { Sparkles } from "lucide-react";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { AUTOMATION_RULE_COPY } from "@/src/components/settings/settings.constants";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import {
  useAutomationRules,
  useUpdateAutomationRule,
  type AutomationRuleRecord
} from "@/src/hooks/automation-rules.hooks";
import { getStoredSession } from "@/src/lib/auth";
import { ApiError } from "@/src/lib/api";
import { useAuthStore } from "@/src/stores/auth.store";
import { showToast } from "@/src/stores/toast.store";

function humanizeRuleType(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function describeTrigger(rule: AutomationRuleRecord) {
  const copy = AUTOMATION_RULE_COPY[rule.ruleType as keyof typeof AUTOMATION_RULE_COPY];
  if (copy) {
    return copy.trigger;
  }

  if (rule.thresholdDays !== null) {
    return `Runs when the workflow crosses ${rule.thresholdDays} day${rule.thresholdDays === 1 ? "" : "s"}.`;
  }

  if (rule.delayHours !== null) {
    return `Runs after a ${rule.delayHours}-hour delay.`;
  }

  return "Runs when the matching workflow condition is met.";
}

function AutomationRuleCard({
  rule,
  canManage
}: {
  rule: AutomationRuleRecord;
  canManage: boolean;
}) {
  const updateRule = useUpdateAutomationRule(rule.id);
  const copy = AUTOMATION_RULE_COPY[rule.ruleType as keyof typeof AUTOMATION_RULE_COPY];

  async function handleToggle() {
    try {
      await updateRule.mutateAsync({
        isEnabled: !rule.isEnabled
      });

      showToast({
        tone: "success",
        title: `${copy?.name ?? humanizeRuleType(rule.ruleType)} updated`,
        description: !rule.isEnabled ? "Automation enabled." : "Automation paused."
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Automation update failed",
        description: error instanceof ApiError ? error.message : "The automation rule could not be updated."
      });
    }
  }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              {copy?.name ?? humanizeRuleType(rule.ruleType)}
            </h2>
            <StatBadge label={rule.isEnabled ? "Enabled" : "Paused"} tone={rule.isEnabled ? "green" : "gray"} />
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {copy?.description ?? "Control whether this automation can create follow-up actions and notifications."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleToggle();
          }}
          disabled={!canManage || updateRule.isPending}
          className={[
            "relative inline-flex h-8 w-14 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60",
            rule.isEnabled ? "bg-success" : "bg-neutral-300"
          ].join(" ")}
          aria-label={`Toggle ${copy?.name ?? humanizeRuleType(rule.ruleType)}`}
        >
          <span
            className={[
              "absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition",
              rule.isEnabled ? "left-7" : "left-1"
            ].join(" ")}
          />
        </button>
      </div>

      <div className="mt-5 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Trigger condition</p>
        <p className="mt-2 text-sm text-neutral-600">{describeTrigger(rule)}</p>
      </div>
    </section>
  );
}

export default function SettingsAutomationPage() {
  const automationRulesQuery = useAutomationRules();
  const authUser = useAuthStore((state) => state.user);
  const role = authUser?.role ?? getStoredSession()?.role ?? null;
  const canManage = role === "owner" || role === "admin";

  if (automationRulesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[96px]" />
        <SkeletonCard className="h-[160px]" />
        <SkeletonCard className="h-[160px]" />
      </div>
    );
  }

  if (automationRulesQuery.isError) {
    return (
      <PageLayout
        title="Automation Rules"
        subtitle="Control which AI follow-ups and reminders can run automatically for your company."
      >
        <section className="rounded-[30px] border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Automation rules unavailable</h2>
          <p className="mt-3 text-sm text-neutral-500">Refresh and try again to load the current automation settings.</p>
        </section>
      </PageLayout>
    );
  }

  const rules = automationRulesQuery.data?.rules ?? [];

  return (
    <PageLayout
      title="Automation Rules"
      subtitle="Control which AI follow-ups and reminders can run automatically for your company."
      actions={
        !canManage ? (
          <StatBadge label="Owner or admin required" tone="gray" />
        ) : undefined
      }
    >
      <div className="space-y-6">
        <section className="rounded-[30px] border border-brand-accent/10 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-ai-light text-ai">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">AI automation controls</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Each rule toggles a background workflow that listens for activity events and schedules the next best action. Turning a rule off stops future runs without deleting historical recommendations.
              </p>
            </div>
          </div>
        </section>

        {rules.map((rule) => (
          <AutomationRuleCard key={rule.id} rule={rule} canManage={canManage} />
        ))}
      </div>
    </PageLayout>
  );
}
