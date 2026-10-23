import {
  goldenImportBundleManifestSchema,
  type GoldenImportBundleManifest
} from "@fsm/types";

import {
  buildPresetColumnMapping,
  IMPORT_SOURCE_PRESETS,
  inferImportSourcePresetFromHeaders
} from "../import-source-presets.js";
import { columnIndex, parseCsvTable } from "./csv.js";
import { goldenImportBundleFileExists, readGoldenImportBundleFile } from "./io.js";

export interface GoldenBundleValidationIssue {
  code:
    | "MISSING_FILE"
    | "JOIN_ORPHAN"
    | "PRESET_NOT_INFERRED"
    | "HISTORY_SPAN_TOO_SHORT"
    | "INVALID_MANIFEST";
  message: string;
}

export interface GoldenBundleValidationResult {
  sourceSystem: GoldenImportBundleManifest["sourceSystem"];
  fixtureId: string;
  issues: GoldenBundleValidationIssue[];
}

type GoldenBundleFile = GoldenImportBundleManifest["files"][number];

function yearsBetween(earliestMs: number, latestMs: number): number {
  const diffMs = Math.max(0, latestMs - earliestMs);
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

function parseBusinessDate(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function validateHistorySpan(
  manifest: GoldenImportBundleManifest,
  issues: GoldenBundleValidationIssue[]
): void {
  if (!manifest.requiredHistorySpanYears) {
    return;
  }

  const dateValues: number[] = [];

  for (const file of manifest.files) {
    if (!file.businessDateColumn) {
      continue;
    }

    const content = readGoldenImportBundleFile(manifest.sourceSystem, file.relativePath);
    const { headers, rows } = parseCsvTable(content);
    const dateIdx = columnIndex(headers, file.businessDateColumn);

    for (const row of rows) {
      const ms = parseBusinessDate(row[dateIdx] ?? "");
      if (ms !== null) {
        dateValues.push(ms);
      }
    }
  }

  if (dateValues.length < 2) {
    issues.push({
      code: "HISTORY_SPAN_TOO_SHORT",
      message: `Expected at least two business dates for ${manifest.sourceSystem}`
    });
    return;
  }

  const earliest = Math.min(...dateValues);
  const latest = Math.max(...dateValues);
  const spanYears = yearsBetween(earliest, latest);

  if (spanYears < manifest.requiredHistorySpanYears) {
    issues.push({
      code: "HISTORY_SPAN_TOO_SHORT",
      message: `History span ${spanYears.toFixed(2)}y is below required ${manifest.requiredHistorySpanYears}y for ${manifest.sourceSystem}`
    });
  }
}

function validateJoinLinks(
  manifest: GoldenImportBundleManifest,
  issues: GoldenBundleValidationIssue[]
): void {
  const tables = new Map<string, { headers: string[]; rows: string[][] }>();

  for (const file of manifest.files) {
    const content = readGoldenImportBundleFile(manifest.sourceSystem, file.relativePath);
    tables.set(file.relativePath, parseCsvTable(content));
  }

  for (const file of manifest.files) {
    if (!file.joinLink) {
      continue;
    }

    const child = tables.get(file.relativePath);
    const parent = tables.get(file.joinLink.parentFile);

    if (!child || !parent) {
      issues.push({
        code: "JOIN_ORPHAN",
        message: `Missing table for join validation on ${file.relativePath}`
      });
      continue;
    }

    const parentIdx = columnIndex(parent.headers, file.joinLink.parentColumn);
    const childIdx = columnIndex(child.headers, file.joinLink.localColumn);
    const parentKeys = new Set(parent.rows.map((row) => row[parentIdx]));

    for (const row of child.rows) {
      const key = row[childIdx];
      if (!parentKeys.has(key)) {
        issues.push({
          code: "JOIN_ORPHAN",
          message: `Orphan join key ${key} in ${file.relativePath} → ${file.joinLink.parentFile}`
        });
      }
    }
  }
}

const MIN_GENERIC_MAPPED_COLUMNS = 3;

function bestImportColumnMapping(headers: string[]): Record<string, string> {
  let best: Record<string, string> = {};

  for (const preset of IMPORT_SOURCE_PRESETS) {
    const mapping = buildPresetColumnMapping(headers, preset.id);
    if (Object.keys(mapping).length > Object.keys(best).length) {
      best = mapping;
    }
  }

  return best;
}

/** Non-QB fixtures: generic AI path — any mappable preset (incl. generic), no FSM-specific preset IDs. */
function validateGenericImportColumnMapping(
  manifest: GoldenImportBundleManifest,
  issues: GoldenBundleValidationIssue[]
): void {
  if (manifest.sourceSystem === "qbo" || manifest.sourceSystem === "qbd") {
    return;
  }

  for (const file of manifest.files) {
    if (file.entityType !== "customers" && file.entityType !== "products" && file.entityType !== "invoices") {
      continue;
    }

    if (file.relativePath.includes("price_book")) {
      continue;
    }

    const content = readGoldenImportBundleFile(manifest.sourceSystem, file.relativePath);
    const { headers } = parseCsvTable(content);
    const mapping = bestImportColumnMapping(headers);

    if (Object.keys(mapping).length < MIN_GENERIC_MAPPED_COLUMNS) {
      issues.push({
        code: "PRESET_NOT_INFERRED",
        message: `Generic/AI column mapping too sparse for ${manifest.sourceSystem}/${file.relativePath} (${Object.keys(mapping).length} fields)`
      });
    }
  }
}

function assertPresetForFile(
  manifest: GoldenImportBundleManifest,
  file: GoldenBundleFile,
  expectedPresetIds: string | string[],
  entityHint: "customers" | "products" | "invoices",
  issues: GoldenBundleValidationIssue[]
): void {
  const content = readGoldenImportBundleFile(manifest.sourceSystem, file.relativePath);
  const { headers } = parseCsvTable(content);
  const presetId = inferImportSourcePresetFromHeaders(headers, entityHint);
  const allowed = Array.isArray(expectedPresetIds) ? expectedPresetIds : [expectedPresetIds];

  if (!presetId || !allowed.includes(presetId)) {
    issues.push({
      code: "PRESET_NOT_INFERRED",
      message: `Expected one of [${allowed.join(", ")}] for ${file.relativePath}, got ${presetId ?? "null"}`
    });
  }
}

/** QuickBooks Online + Desktop: source-specific preset assertions only. */
function validateQuickBooksPresetInference(
  manifest: GoldenImportBundleManifest,
  issues: GoldenBundleValidationIssue[]
): void {
  if (manifest.sourceSystem === "qbo") {
    const customerFile = manifest.files.find((entry: GoldenBundleFile) => entry.entityType === "customers");
    if (customerFile) {
      assertPresetForFile(manifest, customerFile, "quickbooks_customers", "customers", issues);
    }

    const invoiceFile = manifest.files.find((entry: GoldenBundleFile) => entry.entityType === "invoices");
    if (invoiceFile) {
      assertPresetForFile(manifest, invoiceFile, "quickbooks_invoices", "invoices", issues);
    }

    const itemsFile = manifest.files.find((entry: GoldenBundleFile) => entry.entityType === "products");
    if (itemsFile) {
      assertPresetForFile(manifest, itemsFile, "quickbooks_items", "products", issues);
    }

    return;
  }

  if (manifest.sourceSystem === "qbd") {
    const customerFile = manifest.files.find((entry: GoldenBundleFile) => entry.entityType === "customers");
    if (customerFile) {
      assertPresetForFile(manifest, customerFile, "quickbooks_desktop_customers", "customers", issues);
    }

    const invoiceFile = manifest.files.find((entry: GoldenBundleFile) => entry.entityType === "invoices");
    if (invoiceFile) {
      assertPresetForFile(manifest, invoiceFile, "quickbooks_invoices", "invoices", issues);
    }

    const itemsFile = manifest.files.find((entry: GoldenBundleFile) => entry.entityType === "products");
    if (itemsFile) {
      assertPresetForFile(
        manifest,
        itemsFile,
        ["quickbooks_desktop_items", "quickbooks_items"],
        "products",
        issues
      );
    }
  }
}

function validateFilesPresent(
  manifest: GoldenImportBundleManifest,
  issues: GoldenBundleValidationIssue[]
): void {
  for (const file of manifest.files) {
    if (!goldenImportBundleFileExists(manifest.sourceSystem, file.relativePath)) {
      issues.push({
        code: "MISSING_FILE",
        message: `Missing tabular file ${manifest.sourceSystem}/${file.relativePath}`
      });
    }
  }

  for (const mediaPath of manifest.mediaRelativePaths) {
    if (!goldenImportBundleFileExists(manifest.sourceSystem, mediaPath)) {
      issues.push({
        code: "MISSING_FILE",
        message: `Missing media file ${manifest.sourceSystem}/${mediaPath}`
      });
    }
  }
}

export function validateGoldenImportBundleManifest(
  manifest: GoldenImportBundleManifest
): GoldenBundleValidationResult {
  const issues: GoldenBundleValidationIssue[] = [];

  const parsed = goldenImportBundleManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    issues.push({
      code: "INVALID_MANIFEST",
      message: parsed.error.message
    });
    return {
      sourceSystem: manifest.sourceSystem,
      fixtureId: manifest.fixtureId,
      issues
    };
  }

  validateFilesPresent(parsed.data, issues);
  if (issues.some((issue) => issue.code === "MISSING_FILE")) {
    return {
      sourceSystem: parsed.data.sourceSystem,
      fixtureId: parsed.data.fixtureId,
      issues
    };
  }

  validateJoinLinks(parsed.data, issues);
  validateGenericImportColumnMapping(parsed.data, issues);
  validateQuickBooksPresetInference(parsed.data, issues);
  validateHistorySpan(parsed.data, issues);

  return {
    sourceSystem: parsed.data.sourceSystem,
    fixtureId: parsed.data.fixtureId,
    issues
  };
}

export function assertGoldenImportBundleManifest(manifest: GoldenImportBundleManifest): void {
  const result = validateGoldenImportBundleManifest(manifest);
  if (result.issues.length > 0) {
    const detail = result.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ");
    throw new Error(`Golden bundle validation failed for ${manifest.fixtureId}: ${detail}`);
  }
}
