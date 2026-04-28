import { and, eq, isNull } from "drizzle-orm";
import { Decimal } from "decimal.js";

import { db } from "./client.js";
import {
  activityEvents,
  aiRecommendations,
  companies,
  estimates,
  invoices
} from "./schema.js";

type AiRecommendationRow = typeof aiRecommendations.$inferSelect;
type EstimateRow = typeof estimates.$inferSelect;
type InvoiceRow = typeof invoices.$inferSelect;

export const REVENUE_SUMMARY_CACHE_TTL_SECONDS = 300;

export interface RevenueSummaryTopRecommendationRecord {
  id: string;
  headline: string;
  urgencyScore: number | null;
}

export interface RevenueSummaryCountBucketRecord {
  count: number;
  estimatedRevenue: string;
  topRecommendations: RevenueSummaryTopRecommendationRecord[];
}

export interface RevenueSummaryValueBucketRecord {
  count: number;
  totalValue: string;
  topRecommendations: RevenueSummaryTopRecommendationRecord[];
}

export interface RevenueSummaryCacheEntry {
  dormantCustomers: RevenueSummaryCountBucketRecord;
  unsoldEstimates: RevenueSummaryValueBucketRecord;
  unpaidInvoices: RevenueSummaryValueBucketRecord;
  agingAssets: RevenueSummaryCountBucketRecord;
  maintenancePlanOpportunities: RevenueSummaryCountBucketRecord;
  totalOpportunityValue: string;
  generatedAt: string;
}

function toMoney(value: Decimal): string {
  return value.toFixed(2);
}

function buildZeroCountBucket(): RevenueSummaryCountBucketRecord {
  return {
    count: 0,
    estimatedRevenue: "0.00",
    topRecommendations: []
  };
}

function buildZeroValueBucket(): RevenueSummaryValueBucketRecord {
  return {
    count: 0,
    totalValue: "0.00",
    topRecommendations: []
  };
}

function buildRevenueSummaryCacheKey(companyId: string): string {
  return `revenue-summary:${companyId}`;
}

export { buildRevenueSummaryCacheKey };

function isVisibleInRevenueDashboard(row: AiRecommendationRow, now: Date): boolean {
  if (row.deletedAt !== null || row.status !== "pending") {
    return false;
  }

  return row.snoozedUntil === null || row.snoozedUntil.getTime() <= now.getTime();
}

function sortRecommendationsByUrgency(rows: AiRecommendationRow[]): AiRecommendationRow[] {
  return [...rows].sort((left, right) => {
    const leftUrgency = left.urgencyScore ?? -1;
    const rightUrgency = right.urgencyScore ?? -1;

    if (rightUrgency !== leftUrgency) {
      return rightUrgency - leftUrgency;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

function buildTopRecommendations(rows: AiRecommendationRow[]): RevenueSummaryTopRecommendationRecord[] {
  return sortRecommendationsByUrgency(rows)
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      headline: row.headline,
      urgencyScore: row.urgencyScore
    }));
}

function sumRecommendationRevenue(rows: AiRecommendationRow[]): string {
  const total = rows.reduce(
    (sum, row) => sum.add(new Decimal(row.estimatedRevenue ?? "0")),
    new Decimal(0)
  );

  return toMoney(total);
}

function sumEstimateTotals(
  rows: AiRecommendationRow[],
  estimateMap: Map<string, EstimateRow>
): string {
  const total = rows.reduce((sum, row) => {
    const estimateTotal = row.estimateId ? estimateMap.get(row.estimateId)?.total : null;
    return sum.add(new Decimal(estimateTotal ?? row.estimatedRevenue ?? "0"));
  }, new Decimal(0));

  return toMoney(total);
}

function sumInvoiceBalances(
  rows: AiRecommendationRow[],
  invoiceMap: Map<string, InvoiceRow>
): string {
  const total = rows.reduce((sum, row) => {
    const invoiceBalance = row.invoiceId ? invoiceMap.get(row.invoiceId)?.balanceDue : null;
    return sum.add(new Decimal(invoiceBalance ?? row.estimatedRevenue ?? "0"));
  }, new Decimal(0));

  return toMoney(total);
}

export async function computeRevenueSummarySnapshot(
  companyId: string,
  now: Date = new Date()
): Promise<RevenueSummaryCacheEntry> {
  const [recommendationRows, estimateRows, invoiceRows] = await Promise.all([
    db
      .select()
      .from(aiRecommendations)
      .where(and(eq(aiRecommendations.companyId, companyId), isNull(aiRecommendations.deletedAt))),
    db
      .select()
      .from(estimates)
      .where(and(eq(estimates.companyId, companyId), isNull(estimates.deletedAt))),
    db
      .select()
      .from(invoices)
      .where(and(eq(invoices.companyId, companyId), isNull(invoices.deletedAt)))
  ]);

  const visibleRecommendations = recommendationRows.filter((row) =>
    isVisibleInRevenueDashboard(row, now)
  );

  const estimateMap = new Map(estimateRows.map((row) => [row.id, row]));
  const invoiceMap = new Map(invoiceRows.map((row) => [row.id, row]));

  const dormantCustomers = visibleRecommendations.filter((row) => row.type === "reactivation");
  const unsoldEstimates = visibleRecommendations.filter((row) => row.type === "unsold_estimate");
  const unpaidInvoices = visibleRecommendations.filter((row) => row.type === "unpaid_invoice");
  const agingAssets = visibleRecommendations.filter((row) => row.type === "aging_asset");
  const maintenancePlanOpportunities = visibleRecommendations.filter(
    (row) => row.type === "maintenance_plan_offer"
  );

  const dormantCustomersBucket =
    dormantCustomers.length > 0
      ? {
          count: dormantCustomers.length,
          estimatedRevenue: sumRecommendationRevenue(dormantCustomers),
          topRecommendations: buildTopRecommendations(dormantCustomers)
        }
      : buildZeroCountBucket();

  const unsoldEstimatesBucket =
    unsoldEstimates.length > 0
      ? {
          count: unsoldEstimates.length,
          totalValue: sumEstimateTotals(unsoldEstimates, estimateMap),
          topRecommendations: buildTopRecommendations(unsoldEstimates)
        }
      : buildZeroValueBucket();

  const unpaidInvoicesBucket =
    unpaidInvoices.length > 0
      ? {
          count: unpaidInvoices.length,
          totalValue: sumInvoiceBalances(unpaidInvoices, invoiceMap),
          topRecommendations: buildTopRecommendations(unpaidInvoices)
        }
      : buildZeroValueBucket();

  const agingAssetsBucket =
    agingAssets.length > 0
      ? {
          count: agingAssets.length,
          estimatedRevenue: sumRecommendationRevenue(agingAssets),
          topRecommendations: buildTopRecommendations(agingAssets)
        }
      : buildZeroCountBucket();

  const maintenancePlanOpportunitiesBucket =
    maintenancePlanOpportunities.length > 0
      ? {
          count: maintenancePlanOpportunities.length,
          estimatedRevenue: sumRecommendationRevenue(maintenancePlanOpportunities),
          topRecommendations: buildTopRecommendations(maintenancePlanOpportunities)
        }
      : buildZeroCountBucket();

  const totalOpportunityValue = toMoney(
    new Decimal(dormantCustomersBucket.estimatedRevenue)
      .add(unsoldEstimatesBucket.totalValue)
      .add(unpaidInvoicesBucket.totalValue)
      .add(agingAssetsBucket.estimatedRevenue)
      .add(maintenancePlanOpportunitiesBucket.estimatedRevenue)
  );

  return {
    dormantCustomers: dormantCustomersBucket,
    unsoldEstimates: unsoldEstimatesBucket,
    unpaidInvoices: unpaidInvoicesBucket,
    agingAssets: agingAssetsBucket,
    maintenancePlanOpportunities: maintenancePlanOpportunitiesBucket,
    totalOpportunityValue,
    generatedAt: now.toISOString()
  };
}

export async function listActiveCompanyIdsForRevenueSummary(
  since: Date,
  offset: number,
  limit: number
): Promise<string[]> {
  const [companyRows, activityRows] = await Promise.all([
    db
      .select({
        id: companies.id
      })
      .from(companies)
      .where(isNull(companies.deletedAt)),
    db
      .select({
        companyId: activityEvents.companyId,
        occurredAt: activityEvents.occurredAt
      })
      .from(activityEvents)
  ]);

  const activeCompanyIds = new Set(
    activityRows
      .filter((row) => row.occurredAt.getTime() >= since.getTime())
      .map((row) => row.companyId)
  );

  const orderedCompanyIds = companyRows
    .map((row) => row.id)
    .filter((companyIdValue) => activeCompanyIds.has(companyIdValue));

  return orderedCompanyIds.slice(offset, offset + limit);
}
