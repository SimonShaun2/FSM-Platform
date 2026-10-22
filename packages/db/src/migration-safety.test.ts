import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  scanMigrationSqlForDestructiveStatements,
  validateMigrationBundle,
  validateRepoMigrationBundle
} from "./migration-safety.js";

describe("scanMigrationSqlForDestructiveStatements", () => {
  it("flags destructive SQL without allow marker", () => {
    const issues = scanMigrationSqlForDestructiveStatements(
      "ALTER TABLE customers DROP COLUMN legacy_id;",
      "0001_test"
    );

    expect(issues.some((issue) => issue.code === "destructive_sql_drop_column")).toBe(true);
  });

  it("allows destructive SQL when marker is present", () => {
    const issues = scanMigrationSqlForDestructiveStatements(
      "-- fsm:migration-allow contract phase\nALTER TABLE customers DROP COLUMN legacy_id;",
      "0001_test"
    );

    expect(issues).toHaveLength(0);
  });
});

describe("validateMigrationBundle", () => {
  it("detects orphan SQL files and journal gaps", () => {
    const root = mkdtempSync(join(tmpdir(), "fsm-migration-safety-"));
    const migrationsDir = join(root, "migrations");
    mkdirSync(migrationsDir, { recursive: true });

    writeFileSync(join(migrationsDir, "0000_alpha.sql"), "CREATE TABLE alpha (id uuid PRIMARY KEY);");
    writeFileSync(join(migrationsDir, "0001_orphan.sql"), "SELECT 1;");

    const result = validateMigrationBundle({
      migrationsDir,
      journal: {
        entries: [{ idx: 0, tag: "0000_alpha" }]
      }
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "orphan_migration_sql")).toBe(true);
  });
});

describe("validateRepoMigrationBundle", () => {
  it("passes for the committed drizzle migration set", () => {
    const packageRoot = join(import.meta.dirname, "..");
    const result = validateRepoMigrationBundle(packageRoot);

    expect(result.ok).toBe(true);
    expect(result.issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
  });
});
