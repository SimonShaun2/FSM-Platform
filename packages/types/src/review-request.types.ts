import type { PaginatedResult } from "./customer.types.js";

export type ReviewRequestStatus = "pending" | "sent" | "clicked" | "completed" | "declined";
export type ReviewRequestChannel = "sms" | "email";

export interface ReviewRequest {
  id: string;
  companyId: string;
  jobId: string | null;
  customerId: string;
  technicianId: string | null;
  referenceId: string;
  status: ReviewRequestStatus;
  channel: ReviewRequestChannel;
  reviewUrl: string | null;
  sentAt: Date | null;
  clickedAt: Date | null;
  completedAt: Date | null;
  rating: number | null;
  reviewText: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ReviewRequestListItem {
  id: string;
  referenceId: string;
  status: ReviewRequestStatus;
  channel: ReviewRequestChannel;
  sentAt: Date | null;
  completedAt: Date | null;
  rating: number | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
  technician: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  job: {
    id: string;
    jobNumber: string;
    title: string;
  } | null;
  createdAt: Date;
}

export interface CreateReviewRequestInput {
  channel?: ReviewRequestChannel;
}

export interface UpdateReviewRequestInput {
  status?: ReviewRequestStatus;
  rating?: number;
  reviewText?: string;
}

export interface CompleteReviewRequestInput {
  rating: number;
  reviewText?: string;
}

export interface ListReviewRequestsQuery {
  status?: ReviewRequestStatus;
  channel?: ReviewRequestChannel;
  page?: number;
  limit?: number;
}

export interface ReviewRequestFunnelStats {
  pending: number;
  sent: number;
  clicked: number;
  completed: number;
  declined: number;
  averageRating: number | null;
}

export interface ReviewRequestListResponse extends PaginatedResult<ReviewRequestListItem> {
  stats: ReviewRequestFunnelStats;
}

export interface ReviewRequestSettings {
  google: {
    label: "Google";
    url: string | null;
    isActive: boolean;
  };
  yelp: {
    label: "Yelp";
    url: string | null;
    isActive: boolean;
  };
  facebook: {
    label: "Facebook";
    url: string | null;
    isActive: boolean;
  };
  custom: {
    label: "Custom";
    url: string | null;
    isActive: boolean;
  };
}

export interface PublicReviewLanding {
  reviewRequestId: string;
  companyName: string;
  technicianName: string | null;
  status: ReviewRequestStatus;
  reviewUrl: string | null;
  expiresAt: string | null;
  settings: ReviewRequestSettings;
  reviewLinks: {
    google: string | null;
    yelp: string | null;
    facebook: string | null;
    custom: string | null;
  };
}

export type ReviewRequestListResult = PaginatedResult<ReviewRequestListItem>;
