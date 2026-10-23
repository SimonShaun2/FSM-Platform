import type { ImportVendorPresetId } from "./import-vendor-presets.js";

export type ProductCategoryImport =
  | "service"
  | "labor"
  | "material"
  | "equipment"
  | "fee"
  | "bundle";

export type ImportSourceSystemId =
  | "jobber"
  | "housecall_pro"
  | "service_titan"
  | "service_fusion"
  | "qbo"
  | "qbd"
  | "manual_csv";

const MONEY_SANITIZE = /[^0-9.-]/g;

export function normalizeImportMoney(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const cleaned = trimmed.replace(MONEY_SANITIZE, "");
  if (cleaned.length === 0 || cleaned === "-" || cleaned === ".") {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed.toFixed(2);
}

export function mapVendorItemTypeToCategory(
  rawType: string | null | undefined,
  sourceSystem: ImportSourceSystemId
): ProductCategoryImport {
  const normalized = (rawType ?? "").trim().toLowerCase();

  if (sourceSystem === "qbd") {
    if (normalized.includes("part") || normalized.includes("inventory")) {
      return "material";
    }
    if (normalized.includes("service")) {
      return "service";
    }
    if (normalized.includes("other charge")) {
      return "fee";
    }
  }

  if (normalized.includes("material") || normalized.includes("inventory") || normalized === "part") {
    return "material";
  }
  if (normalized.includes("labor") || normalized === "time") {
    return "labor";
  }
  if (normalized.includes("equipment")) {
    return "equipment";
  }
  if (normalized.includes("bundle") || normalized.includes("package")) {
    return "bundle";
  }
  if (normalized.includes("fee") || normalized.includes("discount")) {
    return "fee";
  }

  return "service";
}

export function importSourceSystemFromPreset(presetId: ImportVendorPresetId): ImportSourceSystemId {
  switch (presetId) {
    case "jobber":
    case "jobber_price_book":
      return "jobber";
    case "housecall_pro":
      return "housecall_pro";
    case "service_titan":
      return "service_titan";
    case "quickbooks_customers":
    case "quickbooks_items":
    case "quickbooks_invoices":
      return "qbo";
    case "quickbooks_desktop_items":
      return "qbd";
    case "service_fusion_price_book":
      return "service_fusion";
    default:
      return "manual_csv";
  }
}

export function parseBooleanImportCell(value: string | null | undefined, defaultValue: boolean): boolean {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["y", "yes", "true", "1", "active"].includes(normalized)) {
    return true;
  }
  if (["n", "no", "false", "0", "inactive"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}
