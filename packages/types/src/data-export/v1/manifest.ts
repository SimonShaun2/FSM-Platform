/**
 * Versioned tenant data export manifest (names only in docs; no secret values).
 * Contract ID: fsm.data-export.v1 — FS-89
 */

export const DATA_EXPORT_MANIFEST_VERSION = "fsm.data-export.v1";

export const DATA_EXPORT_RETENTION_DAYS = 7;

export type DataExportEntityName =
  | "company"
  | "users"
  | "customers"
  | "properties"
  | "assets"
  | "product_catalog"
  | "jobs"
  | "estimates"
  | "estimate_items"
  | "invoices"
  | "invoice_items"
  | "payments"
  | "activity_events";

export interface DataExportEntityManifest {
  /** Stable primary key field on exported rows */
  idField: "id";
  /** Foreign keys documenting relationships for migration */
  relationships: Record<string, string>;
  /** Fields never included in export payloads */
  excludedFields: string[];
}

export const DATA_EXPORT_MANIFEST_V1: {
  version: typeof DATA_EXPORT_MANIFEST_VERSION;
  retentionDays: typeof DATA_EXPORT_RETENTION_DAYS;
  formats: Array<"json" | "csv_bundle">;
  entities: Record<DataExportEntityName, DataExportEntityManifest>;
} = {
  version: DATA_EXPORT_MANIFEST_VERSION,
  retentionDays: DATA_EXPORT_RETENTION_DAYS,
  formats: ["json", "csv_bundle"],
  entities: {
    company: {
      idField: "id",
      relationships: {},
      excludedFields: ["stripeCustomerId", "stripeAccountId", "deletedAt"]
    },
    users: {
      idField: "id",
      relationships: { companyId: "company.id" },
      excludedFields: ["passwordHash", "passwordChangedAt", "deletedAt"]
    },
    customers: {
      idField: "id",
      relationships: { companyId: "company.id", referredBy: "customers.id" },
      excludedFields: ["stripeCustomerId", "deletedAt"]
    },
    properties: {
      idField: "id",
      relationships: { companyId: "company.id", customerId: "customers.id" },
      excludedFields: ["deletedAt"]
    },
    assets: {
      idField: "id",
      relationships: {
        companyId: "company.id",
        customerId: "customers.id",
        propertyId: "properties.id"
      },
      excludedFields: ["deletedAt"]
    },
    product_catalog: {
      idField: "id",
      relationships: { companyId: "company.id" },
      excludedFields: ["deletedAt"]
    },
    jobs: {
      idField: "id",
      relationships: {
        companyId: "company.id",
        customerId: "customers.id",
        propertyId: "properties.id",
        assetId: "assets.id",
        technicianId: "technicians.id"
      },
      excludedFields: ["deletedAt"]
    },
    estimates: {
      idField: "id",
      relationships: {
        companyId: "company.id",
        customerId: "customers.id",
        jobId: "jobs.id",
        propertyId: "properties.id"
      },
      excludedFields: ["deletedAt", "approvalToken"]
    },
    estimate_items: {
      idField: "id",
      relationships: { companyId: "company.id", estimateId: "estimates.id" },
      excludedFields: ["deletedAt"]
    },
    invoices: {
      idField: "id",
      relationships: {
        companyId: "company.id",
        customerId: "customers.id",
        jobId: "jobs.id",
        estimateId: "estimates.id"
      },
      excludedFields: [
        "deletedAt",
        "stripePaymentLinkId",
        "stripePaymentLinkUrl",
        "paymentToken"
      ]
    },
    invoice_items: {
      idField: "id",
      relationships: { companyId: "company.id", invoiceId: "invoices.id" },
      excludedFields: ["deletedAt"]
    },
    payments: {
      idField: "id",
      relationships: {
        companyId: "company.id",
        customerId: "customers.id",
        invoiceId: "invoices.id",
      },
      excludedFields: ["deletedAt", "stripePaymentIntentId", "stripeChargeId"]
    },
    activity_events: {
      idField: "id",
      relationships: {
        companyId: "company.id",
        customerId: "customers.id",
        jobId: "jobs.id",
        estimateId: "estimates.id",
        invoiceId: "invoices.id"
      },
      excludedFields: ["payload"]
    }
  }
};
