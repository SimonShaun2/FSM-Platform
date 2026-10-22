#!/usr/bin/env node
/**
 * FS-76: Ensure env templates and .env.example stay aligned with packages/config/src/env.ts.
 * Provider-neutral; safe to run locally without credentials.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ENV_TS = join(root, "packages/config/src/env.ts");
const ROOT_EXAMPLE = join(root, ".env.example");
const TEMPLATE_DIR = join(root, "docs/env/templates");
const PRODUCTION_DEPLOYMENT = join(root, "docs/planning/PRODUCTION-DEPLOYMENT.md");

/** Web-only keys documented outside env.ts */
const DOCUMENTED_WEB_ONLY = new Set(["API_URL"]);

/** Keys referenced in PRODUCTION-DEPLOYMENT.md but not in env.ts (informational) */
const KNOWN_STALE_DEPLOYMENT_KEYS = new Set([
  "CORS_ORIGINS",
  "JWT_EXPIRES_IN",
  "SENDGRID_FROM_NAME",
  // Documented in PRODUCTION-DEPLOYMENT.md but not in packages/config env.ts (FS-93 reconciliation)
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_BOOKING_BASE_URL",
  "NEXT_PUBLIC_JWT_STORAGE_KEY",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "R2_PUBLIC_URL",
  "VAPID_PRIVATE_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_SUBJECT",
  "WORKER_CONCURRENCY"
]);

function parseEnvTsKeys(source) {
  const keys = new Set();
  const re = /^\s{2}([A-Z][A-Z0-9_]*):\s/;
  for (const line of source.split("\n")) {
    const match = re.exec(line);
    if (match) {
      keys.add(match[1]);
    }
  }
  return keys;
}

function parseDotEnvKeys(source) {
  const keys = new Set();
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    keys.add(trimmed.slice(0, eq).trim());
  }
  return keys;
}

function diff(label, missing, extra) {
  const problems = [];
  if (missing.length > 0) {
    problems.push(`${label}: missing keys: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    problems.push(`${label}: unexpected keys: ${extra.join(", ")}`);
  }
  return problems;
}

function main() {
  const schemaKeys = parseEnvTsKeys(readFileSync(ENV_TS, "utf8"));
  const errors = [];

  const rootKeys = parseDotEnvKeys(readFileSync(ROOT_EXAMPLE, "utf8"));
  errors.push(
    ...diff(
      ".env.example",
      [...schemaKeys].filter((k) => !rootKeys.has(k)).sort(),
      [...rootKeys].filter((k) => !schemaKeys.has(k) && !DOCUMENTED_WEB_ONLY.has(k)).sort()
    )
  );

  const localDevPath = join(TEMPLATE_DIR, "local-dev.env.example");
  const localKeys = parseDotEnvKeys(readFileSync(localDevPath, "utf8"));
  const localExpected = new Set([...schemaKeys, ...DOCUMENTED_WEB_ONLY]);
  errors.push(
    ...diff(
      "local-dev.env.example",
      [...localExpected].filter((k) => !localKeys.has(k)).sort(),
      [...localKeys].filter((k) => !localExpected.has(k)).sort()
    )
  );

  for (const file of readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith(".env.example"))) {
    if (file === "local-dev.env.example" || file === "web.env.example" || file === "migrations.env.example") {
      continue;
    }
    const keys = parseDotEnvKeys(readFileSync(join(TEMPLATE_DIR, file), "utf8"));
    const unexpected = [...keys].filter((k) => !schemaKeys.has(k) && !DOCUMENTED_WEB_ONLY.has(k));
    if (unexpected.length > 0) {
      errors.push(`${file}: keys not in env.ts schema: ${unexpected.sort().join(", ")}`);
    }
  }

  const webKeys = parseDotEnvKeys(readFileSync(join(TEMPLATE_DIR, "web.env.example"), "utf8"));
  const allowedWeb = new Set(["NODE_ENV", "NEXT_PUBLIC_API_URL", "API_URL"]);
  const badWeb = [...webKeys].filter((k) => !allowedWeb.has(k));
  if (badWeb.length > 0) {
    errors.push(`web.env.example: only public/server URL keys allowed; found: ${badWeb.join(", ")}`);
  }

  const deployDoc = readFileSync(PRODUCTION_DEPLOYMENT, "utf8");
  const deployMentions = new Set();
  const mentionRe = /^(?:# )?([A-Z][A-Z0-9_]+)=/gm;
  let m;
  while ((m = mentionRe.exec(deployDoc)) !== null) {
    deployMentions.add(m[1]);
  }
  const staleInDeploy = [...deployMentions].filter(
    (k) => !schemaKeys.has(k) && !DOCUMENTED_WEB_ONLY.has(k) && KNOWN_STALE_DEPLOYMENT_KEYS.has(k)
  );
  if (staleInDeploy.length > 0) {
    console.warn(
      `[warn] PRODUCTION-DEPLOYMENT.md documents stale keys (tracked for FS-93 reconciliation): ${staleInDeploy.sort().join(", ")}`
    );
  }
  const unknownDeploy = [...deployMentions].filter(
    (k) =>
      !schemaKeys.has(k) &&
      !DOCUMENTED_WEB_ONLY.has(k) &&
      !KNOWN_STALE_DEPLOYMENT_KEYS.has(k) &&
      k !== "NODE_ENV"
  );
  if (unknownDeploy.length > 0) {
    errors.push(
      `PRODUCTION-DEPLOYMENT.md mentions keys not in env.ts (review): ${unknownDeploy.sort().join(", ")}`
    );
  }

  if (errors.length > 0) {
    console.error("check-env-documentation: FAILED\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }

  console.log(
    `check-env-documentation: OK (${schemaKeys.size} schema keys; templates and .env.example aligned)`
  );
}

main();
