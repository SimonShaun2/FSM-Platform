import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Injected by Render (and similar hosts); prefer over service-specific ports when set. */
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEBHOOK_PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().optional(),
  DATABASE_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().nonnegative().default(20),
  DATABASE_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
  /** Documented ceiling for aggregate pool budgeting; not enforced at runtime until FS-93 sets service limits. */
  DATABASE_SERVICE_MAX_CONNECTIONS: z.coerce.number().int().positive().optional(),
  DATABASE_TRANSACTION_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  DATABASE_TRANSACTION_RETRY_BASE_MS: z.coerce.number().int().positive().default(25),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_CONNECT_CLIENT_ID: z.string().min(1, "STRIPE_CONNECT_CLIENT_ID is required"),
  STRIPE_PLATFORM_FEE_PERCENT: z.coerce.number().nonnegative("STRIPE_PLATFORM_FEE_PERCENT must be zero or greater"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  TWILIO_ACCOUNT_SID: z.string().min(1, "TWILIO_ACCOUNT_SID is required"),
  TWILIO_AUTH_TOKEN: z.string().min(1, "TWILIO_AUTH_TOKEN is required"),
  TWILIO_FROM_NUMBER: z.string().min(1, "TWILIO_FROM_NUMBER is required"),
  SENDGRID_API_KEY: z.string().min(1, "SENDGRID_API_KEY is required"),
  SENDGRID_FROM_EMAIL: z.string().email("SENDGRID_FROM_EMAIL must be a valid email"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  OBJECT_STORAGE_PROVIDER: z.enum(["r2", "memory"]).default("r2"),
  MEDIA_SIGNED_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive("MEDIA_SIGNED_URL_TTL_SECONDS must be greater than zero")
    .default(900),
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  BOOKING_HOLD_TOKEN_SECRET: z.string().min(1, "BOOKING_HOLD_TOKEN_SECRET is required"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive("ACCESS_TOKEN_TTL_SECONDS must be greater than zero"),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive("REFRESH_TOKEN_TTL_SECONDS must be greater than zero"),
  RESET_TOKEN_TTL_SECONDS: z.coerce.number().int().positive("RESET_TOKEN_TTL_SECONDS must be greater than zero"),
  ESTIMATE_EXPIRY_DAYS: z.coerce.number().int().positive("ESTIMATE_EXPIRY_DAYS must be greater than zero").default(30),
  INVOICE_DUE_DAYS: z.coerce.number().int().positive("INVOICE_DUE_DAYS must be greater than zero").default(30),
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL").default("http://localhost:3001"),
  RENVANI_INTERNAL_COMPANY_ID: z
    .string()
    .uuid("RENAVANI_INTERNAL_COMPANY_ID must be a valid UUID")
    .default("00000000-0000-4000-8000-000000000053"),
  /** STACK-04: optional — when unset, Sentry SDK is not initialized. */
  SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid URL").optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional()
});

export type Env = z.infer<typeof envSchema>;
export type PublicEnv = Pick<Env, "NEXT_PUBLIC_API_URL">;

/** Render sets `PORT`; local dev uses `API_PORT`. */
export function resolveApiListenPort(config: Env): number {
  return config.PORT ?? config.API_PORT;
}

/** Render sets `PORT`; local dev uses `WEBHOOK_PORT`. */
export function resolveWebhookListenPort(config: Env): number {
  return config.PORT ?? config.WEBHOOK_PORT;
}

const publicEnvSchema = envSchema.pick({
  NEXT_PUBLIC_API_URL: true
});

function formatValidationErrors(error: z.ZodError): string {
  return error.errors
    .map((issue) => {
      const path = issue.path.join(".");
      return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Environment validation failed: ${formatValidationErrors(result.error)}`);
  }

  return result.data;
}

let cachedEnv: Env | null = null;

export function resetEnvCacheForTests(): void {
  cachedEnv = null;
}

function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = parseEnv();
  return cachedEnv;
}

export const publicEnv = publicEnvSchema.parse(process.env);

export const env = new Proxy({} as Env, {
  get(_target, property) {
    return getEnv()[property as keyof Env];
  },
  has(_target, property) {
    return property in getEnv();
  },
  ownKeys() {
    return Reflect.ownKeys(getEnv());
  },
  getOwnPropertyDescriptor() {
    return {
      enumerable: true,
      configurable: true
    };
  }
});
