import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_ALLOW_MARKER = "fsm:migration-allow";

const DESTRUCTIVE_SQL_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "drop_database", pattern: /\bDROP\s+DATABASE\b/i },
  { id: "drop_schema", pattern: /\bDROP\s+SCHEMA\b/i },
  { id: "truncate_table", pattern: /\bTRUNCATE\s+(?:TABLE\s+)?["`]?\w+/i },
  { id: "drop_table", pattern: /\bDROP\s+TABLE\b/i },
  { id: "drop_column", pattern: /\bDROP\s+COLUMN\b/i }
];

export interface MigrationJournalEntry {
  idx: number;
  tag: string;
}

export interface MigrationJournal {
  entries: MigrationJournalEntry[];
}

export interface MigrationSafetyIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  migrationTag?: string;
}

export interface MigrationSafetyResult {
  ok: boolean;
  issues: MigrationSafetyIssue[];
}

export interface ValidateMigrationBundleOptions {
  migrationsDir: string;
  journal: MigrationJournal;
}

function listSqlMigrationFiles(migrationsDir: string): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));
}

function migrationFileNameForTag(tag: string): string {
  return `${tag}.sql`;
}

function lineAllowsDestructiveSql(line: string, previousLine: string): boolean {
  return line.includes(MIGRATION_ALLOW_MARKER) || previousLine.includes(MIGRATION_ALLOW_MARKER);
}

export function scanMigrationSqlForDestructiveStatements(
  sql: string,
  migrationTag: string
): MigrationSafetyIssue[] {
  const issues: MigrationSafetyIssue[] = [];
  const lines = sql.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const previousLine = index > 0 ? lines[index - 1] ?? "" : "";
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("--")) {
      continue;
    }

    for (const rule of DESTRUCTIVE_SQL_PATTERNS) {
      if (!rule.pattern.test(line)) {
        continue;
      }

      if (lineAllowsDestructiveSql(line, previousLine)) {
        continue;
      }

      issues.push({
        severity: "error",
        code: `destructive_sql_${rule.id}`,
        message: `Migration ${migrationTag} contains ${rule.id} without ${MIGRATION_ALLOW_MARKER} on the same or previous line`,
        migrationTag
      });
    }
  }

  return issues;
}

export function validateMigrationBundle(options: ValidateMigrationBundleOptions): MigrationSafetyResult {
  const issues: MigrationSafetyIssue[] = [];
  const { migrationsDir, journal } = options;
  const entries = [...journal.entries].sort((left, right) => left.idx - right.idx);
  const sqlFiles = new Set(listSqlMigrationFiles(migrationsDir));

  for (let expectedIdx = 0; expectedIdx < entries.length; expectedIdx += 1) {
    const entry = entries[expectedIdx];

    if (!entry || entry.idx !== expectedIdx) {
      issues.push({
        severity: "error",
        code: "journal_idx_gap",
        message: `Expected journal idx ${expectedIdx}, found ${entry?.idx ?? "missing"}`
      });
      break;
    }

    const fileName = migrationFileNameForTag(entry.tag);
    if (!sqlFiles.has(fileName)) {
      issues.push({
        severity: "error",
        code: "journal_missing_sql",
        message: `Journal entry ${entry.tag} has no file ${fileName}`,
        migrationTag: entry.tag
      });
    }
  }

  const journalTags = new Set(entries.map((entry) => entry.tag));
  for (const fileName of sqlFiles) {
    const tag = fileName.replace(/\.sql$/u, "");
    if (!journalTags.has(tag)) {
      issues.push({
        severity: "error",
        code: "orphan_migration_sql",
        message: `SQL file ${fileName} is not listed in migrations journal`,
        migrationTag: tag
      });
    }
  }

  for (const entry of entries) {
    const fileName = migrationFileNameForTag(entry.tag);
    if (!sqlFiles.has(fileName)) {
      continue;
    }

    const sql = readFileSync(join(migrationsDir, fileName), "utf8");
    issues.push(...scanMigrationSqlForDestructiveStatements(sql, entry.tag));
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  return {
    ok: errors.length === 0,
    issues
  };
}

export function loadMigrationJournalFromFile(journalPath: string): MigrationJournal {
  const raw = readFileSync(journalPath, "utf8");
  const parsed = JSON.parse(raw) as { entries?: MigrationJournalEntry[] };
  const entries = parsed.entries ?? [];

  return {
    entries: entries.map((entry) => ({
      idx: entry.idx,
      tag: entry.tag
    }))
  };
}

export function validateRepoMigrationBundle(repoDbPackageRoot: string): MigrationSafetyResult {
  const migrationsDir = join(repoDbPackageRoot, "migrations");
  const journalPath = join(migrationsDir, "meta", "_journal.json");
  const journal = loadMigrationJournalFromFile(journalPath);

  return validateMigrationBundle({ migrationsDir, journal });
}
