/**
 * Compile-time feature flags for staged rollout (v1).
 * Toggle without migrations; gate call sites with explicit comments.
 */
export const featureFlags = {
  // FEATURE FLAG: retention-gates-enqueue — FS-28 Pair 4 (enqueue-only; no Twilio/SendGrid)
  retentionGatesEnqueue: false,
  // FEATURE FLAG: retention-win-back-enqueue — lapse rebook / win-back proposals (FS-28 batch 2)
  retentionWinBackEnqueue: false,
  // FEATURE FLAG: growth-check-public-scan — FS-55 worker-backed public growth scans (staff enqueue)
  growthCheckPublicScan: false
} as const;

export type FeatureFlags = typeof featureFlags;
