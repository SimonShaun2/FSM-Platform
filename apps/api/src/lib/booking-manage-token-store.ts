import { env } from "@fsm/config";

const consumedManageJtis = new Set<string>();
const holdLockManageJtis = new Set<string>();

function consumedRedisKey(jti: string): string {
  return `fsm:public-booking:manage-consumed:${jti}`;
}

function holdLockRedisKey(jti: string): string {
  return `fsm:public-booking:manage-hold:${jti}`;
}

function useInMemoryStore(): boolean {
  return env.NODE_ENV === "test";
}

export async function isBookingManageTokenConsumed(jti: string): Promise<boolean> {
  if (useInMemoryStore()) {
    return consumedManageJtis.has(jti);
  }

  try {
    const { redisConnection } = await import("@fsm/jobs");
    const value = await redisConnection.get(consumedRedisKey(jti));
    return value === "1";
  } catch {
    return consumedManageJtis.has(jti);
  }
}

export async function markBookingManageTokenConsumed(jti: string, ttlSeconds: number): Promise<void> {
  if (useInMemoryStore()) {
    consumedManageJtis.add(jti);
    holdLockManageJtis.delete(jti);
    return;
  }

  try {
    const { redisConnection } = await import("@fsm/jobs");
    await redisConnection.set(consumedRedisKey(jti), "1", "EX", ttlSeconds);
    await redisConnection.del(holdLockRedisKey(jti));
  } catch {
    consumedManageJtis.add(jti);
    holdLockManageJtis.delete(jti);
  }
}

export async function claimBookingManageTokenHoldLock(jti: string, ttlSeconds: number): Promise<boolean> {
  if (await isBookingManageTokenConsumed(jti)) {
    return false;
  }

  if (useInMemoryStore()) {
    if (holdLockManageJtis.has(jti)) {
      return false;
    }

    holdLockManageJtis.add(jti);
    return true;
  }

  try {
    const { redisConnection } = await import("@fsm/jobs");
    const result = await redisConnection.set(holdLockRedisKey(jti), "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    if (holdLockManageJtis.has(jti)) {
      return false;
    }

    holdLockManageJtis.add(jti);
    return true;
  }
}

export async function releaseBookingManageTokenHoldLock(jti: string): Promise<void> {
  if (useInMemoryStore()) {
    holdLockManageJtis.delete(jti);
    return;
  }

  try {
    const { redisConnection } = await import("@fsm/jobs");
    await redisConnection.del(holdLockRedisKey(jti));
  } catch {
    holdLockManageJtis.delete(jti);
  }
}

export function resetBookingManageTokenStoreForTests(): void {
  consumedManageJtis.clear();
  holdLockManageJtis.clear();
}
