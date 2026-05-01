import type { FastifyReply, FastifyRequest } from "fastify";

import type { UpdateAutomationRuleInput } from "@fsm/types";

import { listAutomationRules, updateAutomationRule } from "../../services/automation-rule.service.js";
import type { AutomationRuleParams } from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toAutomationRuleResponse(rule: Awaited<ReturnType<typeof updateAutomationRule>>) {
  return {
    id: rule.id,
    companyId: rule.companyId,
    ruleType: rule.ruleType,
    isEnabled: rule.isEnabled,
    delayHours: rule.delayHours,
    thresholdDays: rule.thresholdDays,
    config: rule.config ?? {},
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    deletedAt: toIsoString(rule.deletedAt)
  };
}

export async function listAutomationRulesHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const rules = await listAutomationRules(request.company.id);

  return reply.send({
    rules: rules.map((rule) => toAutomationRuleResponse(rule))
  });
}

export async function updateAutomationRuleHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as AutomationRuleParams;
  const rule = await updateAutomationRule(
    request.company.id,
    request.user.id,
    params.id,
    request.body as UpdateAutomationRuleInput
  );

  return reply.send({
    rule: toAutomationRuleResponse(rule)
  });
}
