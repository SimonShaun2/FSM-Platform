import type { MigrateOnboardingSourceCatalogEntry, MigrateSourceSystemId } from "./schemas.js";

/** Generic-first catalog — vendors and QB are optional paths (FS-MIGRATE M3/M4). */
export const MIGRATE_ONBOARDING_SOURCE_CATALOG: MigrateOnboardingSourceCatalogEntry[] = [
  {
    id: "manual_csv",
    label: "Generic CSV / spreadsheet",
    description: "Upload exports from any system. AI maps columns to Renvani fields.",
    recommendedExports: ["customers", "properties", "jobs"],
    catalogSection: "generic"
  },
  {
    id: "qbo",
    label: "QuickBooks Online",
    description: "Optional: customers, items, invoices, and payments from QBO.",
    recommendedExports: ["customers", "items", "invoices", "payments"],
    catalogSection: "quickbooks"
  },
  {
    id: "qbd",
    label: "QuickBooks Desktop",
    description: "Optional: desktop export variants (CSV/IIF).",
    recommendedExports: ["customers", "items", "invoices"],
    catalogSection: "quickbooks"
  },
  {
    id: "service_fusion",
    label: "Service Fusion",
    description: "Optional preset: multi-export CSV/XLSX bundle from Service Fusion.",
    recommendedExports: ["customers", "locations", "jobs", "invoices", "equipment", "communications"],
    catalogSection: "legacy_vendor"
  },
  {
    id: "jobber",
    label: "Jobber",
    description: "Optional preset: customer and job exports from Jobber.",
    recommendedExports: ["clients", "properties", "jobs", "invoices", "communications"],
    catalogSection: "legacy_vendor"
  },
  {
    id: "servicetitan",
    label: "ServiceTitan",
    description: "Optional preset: location-aware customer and job exports.",
    recommendedExports: ["customers", "locations", "jobs", "invoices", "equipment", "communications"],
    catalogSection: "legacy_vendor"
  },
  {
    id: "housecall_pro",
    label: "Housecall Pro",
    description: "Optional preset: customer-centric CSV exports.",
    recommendedExports: ["customers", "jobs", "invoices", "communications"],
    catalogSection: "legacy_vendor"
  }
];

export function isMigrateSourceSystemId(value: string): value is MigrateSourceSystemId {
  return MIGRATE_ONBOARDING_SOURCE_CATALOG.some((entry) => entry.id === value);
}

export function listMigrateOnboardingCatalogBySection(
  section: MigrateOnboardingSourceCatalogEntry["catalogSection"]
): MigrateOnboardingSourceCatalogEntry[] {
  return MIGRATE_ONBOARDING_SOURCE_CATALOG.filter((entry) => entry.catalogSection === section);
}
