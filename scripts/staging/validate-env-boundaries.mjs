#!/usr/bin/env node
/**
 * FS-75: validate deployment tier boundaries for a dotenv file (no network, no secrets logged).
 * Usage: node scripts/staging/validate-env-boundaries.mjs [--tier staging] <env-file>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  parseEnvFile,
  resolveDeploymentTier,
  validateDeploymentBoundaries
} from "../../packages/config/dist/deployment-environment.js";

function usage() {
  console.error(
    "Usage: node scripts/staging/validate-env-boundaries.mjs [--tier development|staging|production] <env-file>"
  );
  process.exit(2);
}

const args = process.argv.slice(2);
let tierOverride = null;
const positional = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--tier") {
    const next = args[index + 1];
    if (!next) {
      usage();
    }
    tierOverride = next;
    index += 1;
    continue;
  }
  positional.push(arg);
}

if (positional.length !== 1) {
  usage();
}

const envPath = resolve(positional[0]);
const contents = readFileSync(envPath, "utf8");
const env = parseEnvFile(contents);

if (tierOverride) {
  env.RENVANI_DEPLOYMENT_TIER = tierOverride;
}

const tier = resolveDeploymentTier(env);
const result = validateDeploymentBoundaries(env);

if (result.ok) {
  console.log(`OK: tier=${tier} integrationProfile=${result.integrationProfile} file=${envPath}`);
  process.exit(0);
}

console.error(`FAIL: tier=${tier} integrationProfile=${result.integrationProfile} file=${envPath}`);
for (const violation of result.violations) {
  const field = violation.field ? ` (${violation.field})` : "";
  console.error(`  - ${violation.code}${field}: ${violation.message}`);
}
process.exit(1);
