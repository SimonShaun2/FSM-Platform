import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEBHOOK_PORT: z.coerce.number().int().positive().default(3002),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
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
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive("ACCESS_TOKEN_TTL_SECONDS must be greater than zero"),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive("REFRESH_TOKEN_TTL_SECONDS must be greater than zero"),
  RESET_TOKEN_TTL_SECONDS: z.coerce.number().int().positive("RESET_TOKEN_TTL_SECONDS must be greater than zero"),
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL").default("http://localhost:3001")
});

export type Env = z.infer<typeof envSchema>;
export type PublicEnv = Pick<Env, "NEXT_PUBLIC_API_URL">;

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
