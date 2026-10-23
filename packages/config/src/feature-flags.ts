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
  growthCheckPublicScan: false,
  // FEATURE FLAG: loyalty-reminders-enabled — FS-72 candidate evaluation (proposal path separate)
  loyaltyRemindersEnabled: false,
  // FEATURE FLAG: loyalty-reminders-dry-run — FS-72 blocks customer send until founder gate
  loyaltyRemindersDryRun: true,
  // FEATURE FLAG: clerk-auth-parallel-jwt — STACK-02: accept Clerk session JWT alongside in-repo JWT
  clerkAuthParallelJwt: false,
  // FEATURE FLAG: tenant-session-scoped-writes — STACK-02/10: SET LOCAL app.current_company_id on API writes
  tenantSessionScopedWrites: false,
  // FEATURE FLAG: resend-email-enabled — STACK-08: route outbound email through Resend (@fsm/comms)
  resendEmailEnabled: false,
  // FEATURE FLAG: outbound-sms-enabled — when false, SMS sends are stubbed/disabled
  outboundSmsEnabled: true,
  // FEATURE FLAG: stripe-platform-billing-mvp — STACK-13 platform subscription checkout
  stripePlatformBillingMvp: false
} as const;

export type FeatureFlags = typeof featureFlags;
