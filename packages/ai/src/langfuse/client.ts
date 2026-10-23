import pino from "pino";

import { resolveLangfuseEnv, type LangfuseEnvConfig } from "@fsm/config/langfuse-env";
import type { AgentActivityAuditPayloadV1 } from "@fsm/types";

const logger = pino({
  name: "langfuse",
  level: process.env.LOG_LEVEL ?? "info"
});

export type LangfuseAgentAuditObservation = {
  companyId: string;
  eventType: string;
  summary: string;
  audit: AgentActivityAuditPayloadV1;
  actorId?: string;
  actorType?: string;
  occurredAt: string;
};

export type LangfuseTraceSink = {
  recordAgentAudit(observation: LangfuseAgentAuditObservation): Promise<void>;
};

type LangfuseHttpSinkOptions = {
  config: LangfuseEnvConfig;
  fetchImpl?: typeof fetch;
};

/**
 * STACK-07 stub: posts a single observation to Langfuse public ingestion when configured.
 * No SDK dependency; safe to no-op in dev/CI without credentials.
 */
export function createLangfuseHttpTraceSink(options: LangfuseHttpSinkOptions): LangfuseTraceSink {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const baseUrl = options.config.LANGFUSE_BASE_URL.replace(/\/$/u, "");

  return {
    async recordAgentAudit(observation: LangfuseAgentAuditObservation): Promise<void> {
      const body = {
        batch: [
          {
            type: "trace-create",
            body: {
              id: `${observation.audit.agentActionId}:${observation.audit.lifecycle}`,
              name: `agent.${observation.audit.lifecycle}`,
              metadata: {
                companyId: observation.companyId,
                eventType: observation.eventType,
                policyVersion: observation.audit.policyVersion,
                agentProduct: observation.audit.agentProduct,
                actionType: observation.audit.actionType,
                requiresApproval: observation.audit.requiresApproval,
                loyaltyRemindersDryRun: observation.audit.loyaltyRemindersDryRun,
                loyaltyRemindersEnabled: observation.audit.loyaltyRemindersEnabled
              },
              timestamp: observation.occurredAt
            }
          }
        ]
      };

      const response = await fetchImpl(`${baseUrl}/api/public/ingestion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Langfuse-Public-Key": options.config.LANGFUSE_PUBLIC_KEY,
          "X-Langfuse-Secret-Key": options.config.LANGFUSE_SECRET_KEY
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const text = await response.text();
        logger.warn(
          { status: response.status, body: text.slice(0, 200) },
          "Langfuse ingestion returned non-success status"
        );
      }
    }
  };
}

export function createNoopLangfuseTraceSink(): LangfuseTraceSink {
  return {
    async recordAgentAudit(): Promise<void> {
      // intentionally empty
    }
  };
}

let cachedSink: LangfuseTraceSink | undefined;

export function resetLangfuseTraceSinkForTests(): void {
  cachedSink = undefined;
}

export function getLangfuseTraceSink(
  env: Record<string, string | undefined> = process.env
): LangfuseTraceSink {
  if (cachedSink) {
    return cachedSink;
  }

  const resolution = resolveLangfuseEnv(env);
  if (!resolution.enabled) {
    cachedSink = createNoopLangfuseTraceSink();
    return cachedSink;
  }

  cachedSink = createLangfuseHttpTraceSink({ config: resolution.config });
  return cachedSink;
}

export async function recordAgentAuditObservation(
  observation: LangfuseAgentAuditObservation,
  env: Record<string, string | undefined> = process.env
): Promise<void> {
  const sink = getLangfuseTraceSink(env);
  await sink.recordAgentAudit(observation);
}
