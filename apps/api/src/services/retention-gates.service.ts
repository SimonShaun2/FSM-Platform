import { featureFlags } from "@fsm/config/feature-flags";

export {
  buildCustomerMessageMetadata,
  buildProposalCreateCustomerMessageJob,
  evaluateRetentionGates,
  isRetentionEligibleJobStatus,
  summarizeBlockedReasons
} from "@fsm/types";

export function resolveRetentionFeatureFlags(): {
  retentionGatesEnqueue: boolean;
  retentionWinBackEnqueue: boolean;
} {
  return {
    retentionGatesEnqueue: featureFlags.retentionGatesEnqueue,
    retentionWinBackEnqueue: featureFlags.retentionWinBackEnqueue
  };
}
