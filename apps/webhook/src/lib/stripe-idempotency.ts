import { redisConnection } from "@fsm/jobs";

const STRIPE_EVENT_KEY_PREFIX = "stripe:event:";
const STRIPE_EVENT_LOCK_PREFIX = "stripe:event:lock:";
const STRIPE_EVENT_TTL_SECONDS = 60 * 60 * 24 * 30;
const STRIPE_EVENT_LOCK_TTL_SECONDS = 60 * 5;

function getProcessedEventKey(stripeEventId: string): string {
  return `${STRIPE_EVENT_KEY_PREFIX}${stripeEventId}`;
}

function getProcessingLockKey(stripeEventId: string): string {
  return `${STRIPE_EVENT_LOCK_PREFIX}${stripeEventId}`;
}

export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const result = await redisConnection.exists(getProcessedEventKey(stripeEventId));
  return result === 1;
}

export async function claimEventProcessing(stripeEventId: string): Promise<boolean> {
  const result = await redisConnection.set(
    getProcessingLockKey(stripeEventId),
    new Date().toISOString(),
    "EX",
    STRIPE_EVENT_LOCK_TTL_SECONDS,
    "NX"
  );

  return result === "OK";
}

export async function clearEventProcessingClaim(stripeEventId: string): Promise<void> {
  await redisConnection.del(getProcessingLockKey(stripeEventId));
}

export async function markEventProcessed(stripeEventId: string, eventType: string): Promise<void> {
  const processedEventKey = getProcessedEventKey(stripeEventId);
  const processingLockKey = getProcessingLockKey(stripeEventId);

  await redisConnection
    .multi()
    .set(
      processedEventKey,
      JSON.stringify({
        processedAt: new Date().toISOString(),
        eventType
      }),
      "EX",
      STRIPE_EVENT_TTL_SECONDS,
      "NX"
    )
    .del(processingLockKey)
    .exec();
}
