import type { MigrateOnboardingSourceCatalogEntry, MigrateSourceSystemId } from "./schemas.js";

export const MIGRATE_ONBOARDING_SOURCE_CATALOG: MigrateOnboardingSourceCatalogEntry[] = [
  {
    id: "service_fusion",
    label: "Service Fusion",
    description: "Multi-export CSV/XLSX bundle from Service Fusion.",
    recommendedExports: ["customers", "locations", "jobs", "invoices", "equipment"]
  },
  {
    id: "jobber",
    label: "Jobber",
    description: "Customer and job exports from Jobber.",
    recommendedExports: ["clients", "properties", "jobs", "invoices"]
  },
  {
    id: "servicetitan",
    label: "ServiceTitan",
    description: "Location-aware customer and job exports.",
    recommendedExports: ["customers", "locations", "jobs", "invoices", "equipment"]
  },
  {
    id: "housecall_pro",
    label: "Housecall Pro",
    description: "Customer-centric CSV exports.",
    recommendedExports: ["customers", "jobs", "invoices"]
  },
  {
    id: "qbo",
    label: "QuickBooks Online",
    description: "Customers, items, invoices, and payments.",
    recommendedExports: ["customers", "items", "invoices", "payments"]
  },
  {
    id: "qbd",
    label: "QuickBooks Desktop",
    description: "Desktop export variants (CSV/IIF).",
    recommendedExports: ["customers", "items", "invoices"]
  },
  {
    id: "manual_csv",
    label: "Generic CSV",
    description: "Bring your own spreadsheets; AI maps columns.",
    recommendedExports: ["customers", "jobs"]
  }
];

export function isMigrateSourceSystemId(value: string): value is MigrateSourceSystemId {
  return MIGRATE_ONBOARDING_SOURCE_CATALOG.some((entry) => entry.id === value);
}
