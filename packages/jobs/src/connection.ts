import { Redis } from "ioredis";

import { env } from "@fsm/config";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});
