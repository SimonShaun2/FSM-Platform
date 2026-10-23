/**
 * FS-93 / STACK-12 — Render blueprint reference contract (docs/infrastructure/render-blueprint.render.yaml).
 * Validates design intent only; no live Render deploy.
 */
export const FS93_RENDER_BLUEPRINT_REF = {
  relativePath: "docs/infrastructure/render-blueprint.render.yaml",
  keyValue: {
    name: "renvani-bullmq-kv",
    maxmemoryPolicy: "noeviction"
  },
  renderServices: {
    api: { name: "renvani-api", type: "web", healthCheckPath: "/health" },
    worker: { name: "renvani-worker", type: "worker" },
    webhook: { name: "renvani-webhook", type: "web", healthCheckPath: "/health" }
  },
  database: {
    provider: "neon",
    connectionEnvVar: "DATABASE_URL"
  },
  webHost: "vercel"
} as const;

export type Fs93RenderBlueprintRef = typeof FS93_RENDER_BLUEPRINT_REF;

export type Fs93BlueprintValidationResult =
  | { ok: true }
  | { ok: false; violations: string[] };

export function validateFs93RenderBlueprintYaml(yaml: string): Fs93BlueprintValidationResult {
  const violations: string[] = [];

  if (!/STATUS:\s*NOT APPLIED/i.test(yaml)) {
    violations.push("blueprint header must mark STATUS: NOT APPLIED");
  }

  if (/^databases:/m.test(yaml)) {
    violations.push("must not declare Render managed Postgres (Neon DATABASE_URL only)");
  }

  if (yaml.includes("fromDatabase:")) {
    violations.push("DATABASE_URL must be founder-set from Neon (sync: false), not fromDatabase");
  }

  if (!yaml.includes(`maxmemoryPolicy: ${FS93_RENDER_BLUEPRINT_REF.keyValue.maxmemoryPolicy}`)) {
    violations.push(
      `Key Value must set maxmemoryPolicy: ${FS93_RENDER_BLUEPRINT_REF.keyValue.maxmemoryPolicy}`
    );
  }

  if (!yaml.includes(`name: ${FS93_RENDER_BLUEPRINT_REF.keyValue.name}`)) {
    violations.push(`missing Key Value service ${FS93_RENDER_BLUEPRINT_REF.keyValue.name}`);
  }

  for (const svc of Object.values(FS93_RENDER_BLUEPRINT_REF.renderServices)) {
    if (!yaml.includes(`name: ${svc.name}`)) {
      violations.push(`missing Render service ${svc.name}`);
    }
    if (!yaml.includes(`type: ${svc.type}`)) {
      violations.push(`missing type: ${svc.type} for ${svc.name}`);
    }
    if ("healthCheckPath" in svc && !yaml.includes(`healthCheckPath: ${svc.healthCheckPath}`)) {
      violations.push(`${svc.name} must expose healthCheckPath: ${svc.healthCheckPath}`);
    }
  }

  const databaseUrlBlocks = yaml.match(/- key: DATABASE_URL[\s\S]*?(?=\n      - key:|\n  - type:|\ndatabases:|\Z)/g);
  if (!databaseUrlBlocks || databaseUrlBlocks.length < 3) {
    violations.push("API, worker, and webhook must each declare DATABASE_URL");
  } else {
    for (const block of databaseUrlBlocks) {
      if (!block.includes("sync: false")) {
        violations.push("each DATABASE_URL entry must use sync: false (Neon connection string)");
      }
    }
  }

  const redisFromKv = /fromService:\s*\n\s*type: keyvalue\s*\n\s*name: renvani-bullmq-kv/g;
  const redisBindings = yaml.match(redisFromKv);
  if (!redisBindings || redisBindings.length < 3) {
    violations.push("API, worker, and webhook must bind REDIS_URL from renvani-bullmq-kv");
  }

  if (!yaml.includes("preDeployCommand:") || !yaml.includes("db:migrate")) {
    violations.push("API preDeployCommand must run Drizzle migrations (db:migrate)");
  }

  if (yaml.includes("type: web") && yaml.match(/type: web/g)?.length !== 2) {
    violations.push("exactly two Render web services (api + webhook; web stays on Vercel)");
  }

  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
