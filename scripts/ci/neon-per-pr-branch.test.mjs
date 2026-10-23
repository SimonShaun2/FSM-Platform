import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("neon-per-pr-branch script documents staging-only policy", () => {
  const script = readFileSync(join(repoRoot, "scripts/ci/neon-per-pr-branch.mjs"), "utf8");
  assert.match(script, /staging-only/i);
  assert.match(script, /validateNeonCiDatabaseUrl/);
});

test("batch-ci workflow includes neon per-PR matrix job", () => {
  const workflow = readFileSync(join(repoRoot, ".github/workflows/batch-ci.yml"), "utf8");
  assert.match(workflow, /neon-per-pr-branch\.mjs/);
  assert.match(workflow, /NEON_CI_STAGING_DATABASE_URL/);
});
