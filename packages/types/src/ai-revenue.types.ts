import type { PaginatedResult } from "./customer.types.js";

export type AiRecommendationType =
  | "reactivation"
  | "aging_asset"
  | "maintenance_due"
  | "unsold_estimate"
  | "unpaid_invoice"
  | "upsell_opportunity"
  | "seasonal_campaign"
  | "maintenance_plan_offer";

export type AiRecommendationStatus =
  | "pending"
  | "actioned"
  | "dismissed"
  | "snoozed"
  | "expired";

export interface AiRecommendation {
  id: string;
  companyId: string;
  type: AiRecommendationType;
  status: AiRecommendationStatus;
  customerId: string | null;
  propertyId: string | null;
  assetId: string | null;
  jobId: string | null;
  estimateId: string | null;
  invoiceId: string | null;
  estimatedRevenue: string | null;
  headline: string;
  body: string;
  suggestedAction: string | null;
  suggestedMessage: string | null;
  urgencyScore: number | null;
  confidenceScore: number | null;
  actionedAt: Date | null;
  actionedById: string | null;
  dismissedAt: Date | null;
  snoozedUntil: Date | null;
  expiresAt: Date | null;
  sourceEventIds: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AiRecommendationCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface AiRecommendationAsset {
  id: string;
  name: string;
  assetType: string;
  installDate: string | null;
}

export interface AiRecommendationJob {
  id: string;
  jobNumber: string;
}

export interface AiRecommendationEstimate {
  id: string;
  estimateNumber: string;
  total: string;
}

export interface AiRecommendationInvoice {
  id: string;
  invoiceNumber: string;
  balanceDue: string;
}

export interface AiRecommendationDetail extends AiRecommendation {
  customer: AiRecommendationCustomer | null;
  asset: AiRecommendationAsset | null;
  job: AiRecommendationJob | null;
  estimate: AiRecommendationEstimate | null;
  invoice: AiRecommendationInvoice | null;
}

export interface RevenueSummaryTopRecommendation {
  id: string;
  headline: string;
  urgencyScore: number | null;
}

export interface RevenueSummaryCountBucket {
  count: number;
  estimatedRevenue: string;
  topRecommendations: RevenueSummaryTopRecommendation[];
}

export interface RevenueSummaryValueBucket {
  count: number;
  totalValue: string;
  topRecommendations: RevenueSummaryTopRecommendation[];
}

export interface RevenueSummary {
  dormantCustomers: RevenueSummaryCountBucket;
  unsoldEstimates: RevenueSummaryValueBucket;
  unpaidInvoices: RevenueSummaryValueBucket;
  agingAssets: RevenueSummaryCountBucket;
  maintenancePlanOpportunities: RevenueSummaryCountBucket;
  totalOpportunityValue: string;
  generatedAt: string;
  fromCache: boolean;
}

export interface ActionRecommendationInput {
  actionTaken: string;
  notes?: string;
}

export interface ListRecommendationsQuery {
  type?: AiRecommendationType;
  status?: AiRecommendationStatus;
  customerId?: string;
  assetId?: string;
  sortBy?: "urgencyScore" | "estimatedRevenue" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export type PaginatedAiRecommendations = PaginatedResult<AiRecommendationDetail>;
