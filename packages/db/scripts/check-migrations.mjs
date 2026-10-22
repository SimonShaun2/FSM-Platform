import { validateRepoMigrationBundle } from "../dist/migration-safety.js";

const result = validateRepoMigrationBundle(new URL("..", import.meta.url).pathname);

if (!result.ok) {
  for (const issue of result.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("Migration safety checks passed.");
