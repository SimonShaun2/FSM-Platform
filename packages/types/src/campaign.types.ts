import type { PaginatedResult } from "./customer.types.js";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";
export type CampaignType =
  | "reactivation"
  | "estimate_follow_up"
  | "invoice_reminder"
  | "seasonal"
  | "maintenance_reminder"
  | "custom";
export type CampaignChannel = "sms" | "email";
export type CampaignRecipientStatus = "delivered" | "failed" | "converted";

export interface Campaign {
  id: string;
  companyId: string;
  createdById: string | null;
  type: CampaignType;
  status: CampaignStatus;
  name: string;
  subject: string | null;
  body: string;
  channel: CampaignChannel;
  isAiGenerated: boolean | null;
  aiRecommendationId: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  recipientCount: number | null;
  deliveredCount: number | null;
  openedCount: number | null;
  repliedCount: number | null;
  convertedCount: number | null;
  revenueAttributed: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  customerId: string;
  companyId: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  repliedAt: Date | null;
  convertedAt: Date | null;
  conversionJobId: string | null;
  sentToPhone: string | null;
  sentToEmail: string | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CampaignListItem {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: CampaignChannel;
  recipientCount: number;
  deliveredCount: number;
  convertedCount: number;
  revenueAttributed: string;
  sentAt: Date | null;
  createdAt: Date;
}

export interface CampaignRecipientListItem {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  sentToPhone: string | null;
  sentToEmail: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  convertedAt: Date | null;
  status: CampaignRecipientStatus | null;
}

export interface CampaignDetailRecipient {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  sentToPhone: string | null;
  sentToEmail: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  convertedAt: Date | null;
}

export interface CampaignDetail {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: CampaignChannel;
  body: string | null;
  subject: string | null;
  isAiGenerated: boolean;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  repliedCount: number;
  convertedCount: number;
  revenueAttributed: string;
  sentAt: Date | null;
  createdAt: Date;
  recipients: CampaignDetailRecipient[];
}

export interface CreateCampaignInput {
  name: string;
  type: CampaignType;
  channel: CampaignChannel;
  recommendationIds: string[];
  subject?: string;
}

export interface UpdateCampaignInput {
  body?: string;
  subject?: string;
  channel?: CampaignChannel;
}

export interface ListCampaignsQuery {
  status?: CampaignStatus;
  type?: CampaignType;
  channel?: CampaignChannel;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

export interface ListRecipientsQuery {
  status?: CampaignRecipientStatus;
  page?: number;
  limit?: number;
}

export type PaginatedCampaigns = PaginatedResult<CampaignListItem>;
export type PaginatedCampaignRecipients = PaginatedResult<CampaignRecipientListItem>;
