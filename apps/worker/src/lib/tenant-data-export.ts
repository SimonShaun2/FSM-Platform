import { and, eq, isNull } from "drizzle-orm";

import {
  activityEvents,
  assets,
  companies,
  customers,
  db,
  estimateItems,
  estimates,
  invoiceItems,
  invoices,
  jobs,
  payments,
  productCatalog,
  properties,
  users
} from "@fsm/db";
import { redactExportRows } from "@fsm/types";

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      output[key] = value.toISOString();
    } else {
      output[key] = value;
    }
  }
  return output;
}

function toPlainRows<T extends Record<string, unknown>>(rows: T[]): Array<Record<string, unknown>> {
  return rows.map((row) => serializeRow(row as Record<string, unknown>));
}

export interface TenantExportPayloadV1 {
  manifestVersion: "fsm.data-export.v1";
  exportedAt: string;
  companyId: string;
  data: {
    company: Record<string, unknown> | null;
    users: Array<Record<string, unknown>>;
    customers: Array<Record<string, unknown>>;
    properties: Array<Record<string, unknown>>;
    assets: Array<Record<string, unknown>>;
    product_catalog: Array<Record<string, unknown>>;
    jobs: Array<Record<string, unknown>>;
    estimates: Array<Record<string, unknown>>;
    estimate_items: Array<Record<string, unknown>>;
    invoices: Array<Record<string, unknown>>;
    invoice_items: Array<Record<string, unknown>>;
    payments: Array<Record<string, unknown>>;
    activity_events: Array<Record<string, unknown>>;
  };
}

export async function gatherTenantExportPayload(companyId: string): Promise<TenantExportPayloadV1> {
  const companyRow = await db.query.companies.findFirst({
    where: and(eq(companies.id, companyId), isNull(companies.deletedAt))
  });

  const [
    userRows,
    customerRows,
    propertyRows,
    assetRows,
    productRows,
    jobRows,
    estimateRows,
    estimateItemRows,
    invoiceRows,
    invoiceItemRows,
    paymentRows,
    activityRows
  ] = await Promise.all([
    db.select().from(users).where(and(eq(users.companyId, companyId), isNull(users.deletedAt))),
    db.select().from(customers).where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt))),
    db.select().from(properties).where(and(eq(properties.companyId, companyId), isNull(properties.deletedAt))),
    db.select().from(assets).where(and(eq(assets.companyId, companyId), isNull(assets.deletedAt))),
    db
      .select()
      .from(productCatalog)
      .where(and(eq(productCatalog.companyId, companyId), isNull(productCatalog.deletedAt))),
    db.select().from(jobs).where(and(eq(jobs.companyId, companyId), isNull(jobs.deletedAt))),
    db.select().from(estimates).where(and(eq(estimates.companyId, companyId), isNull(estimates.deletedAt))),
    db
      .select()
      .from(estimateItems)
      .where(and(eq(estimateItems.companyId, companyId), isNull(estimateItems.deletedAt))),
    db.select().from(invoices).where(and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt))),
    db
      .select()
      .from(invoiceItems)
      .where(and(eq(invoiceItems.companyId, companyId), isNull(invoiceItems.deletedAt))),
    db.select().from(payments).where(and(eq(payments.companyId, companyId), isNull(payments.deletedAt))),
    db.select().from(activityEvents).where(eq(activityEvents.companyId, companyId))
  ]);

  const companyPlain = companyRow ? serializeRow(companyRow as Record<string, unknown>) : null;

  return {
    manifestVersion: "fsm.data-export.v1",
    exportedAt: new Date().toISOString(),
    companyId,
    data: {
      company: companyPlain ? redactExportRows("company", [companyPlain])[0] ?? null : null,
      users: redactExportRows("users", toPlainRows(userRows)),
      customers: redactExportRows("customers", toPlainRows(customerRows)),
      properties: redactExportRows("properties", toPlainRows(propertyRows)),
      assets: redactExportRows("assets", toPlainRows(assetRows)),
      product_catalog: redactExportRows("product_catalog", toPlainRows(productRows)),
      jobs: redactExportRows("jobs", toPlainRows(jobRows)),
      estimates: redactExportRows("estimates", toPlainRows(estimateRows)),
      estimate_items: redactExportRows("estimate_items", toPlainRows(estimateItemRows)),
      invoices: redactExportRows("invoices", toPlainRows(invoiceRows)),
      invoice_items: redactExportRows("invoice_items", toPlainRows(invoiceItemRows)),
      payments: redactExportRows("payments", toPlainRows(paymentRows)),
      activity_events: redactExportRows("activity_events", toPlainRows(activityRows))
    }
  };
}

export function countExportRecords(payload: TenantExportPayloadV1): Record<string, number> {
  return {
    company: payload.data.company ? 1 : 0,
    users: payload.data.users.length,
    customers: payload.data.customers.length,
    properties: payload.data.properties.length,
    assets: payload.data.assets.length,
    product_catalog: payload.data.product_catalog.length,
    jobs: payload.data.jobs.length,
    estimates: payload.data.estimates.length,
    estimate_items: payload.data.estimate_items.length,
    invoices: payload.data.invoices.length,
    invoice_items: payload.data.invoice_items.length,
    payments: payload.data.payments.length,
    activity_events: payload.data.activity_events.length
  };
}
