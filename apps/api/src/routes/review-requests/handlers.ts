import type { FastifyReply, FastifyRequest } from "fastify";

import type { UpdateReviewRequestInput } from "@fsm/types";

import {
  listReviewRequests,
  updateReviewRequest
} from "../../services/review-request.service.js";
import type {
  ReviewRequestIdParams,
  ReviewRequestListQuery
} from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toReviewRequestResponse(
  reviewRequest: Awaited<ReturnType<typeof updateReviewRequest>>
) {
  return {
    id: reviewRequest.id,
    companyId: reviewRequest.companyId,
    jobId: reviewRequest.jobId,
    customerId: reviewRequest.customerId,
    technicianId: reviewRequest.technicianId,
    referenceId: reviewRequest.referenceId,
    status: reviewRequest.status,
    channel: reviewRequest.channel,
    reviewUrl: reviewRequest.reviewUrl,
    sentAt: toIsoString(reviewRequest.sentAt),
    clickedAt: toIsoString(reviewRequest.clickedAt),
    completedAt: toIsoString(reviewRequest.completedAt),
    rating: reviewRequest.rating,
    reviewText: reviewRequest.reviewText,
    createdAt: reviewRequest.createdAt.toISOString(),
    updatedAt: reviewRequest.updatedAt.toISOString(),
    deletedAt: toIsoString(reviewRequest.deletedAt)
  };
}

export async function listReviewRequestsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as ReviewRequestListQuery;
  const result = await listReviewRequests(request.company.id, {
    page: query.page,
    limit: query.limit,
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.channel !== undefined ? { channel: query.channel } : {})
  });

  return reply.send({
    data: result.result.data.map((item) => ({
      id: item.id,
      referenceId: item.referenceId,
      status: item.status,
      channel: item.channel,
      sentAt: toIsoString(item.sentAt),
      completedAt: toIsoString(item.completedAt),
      rating: item.rating,
      customer: item.customer,
      technician: item.technician,
      job: item.job,
      createdAt: item.createdAt.toISOString()
    })),
    total: result.result.total,
    page: result.result.page,
    limit: result.result.limit,
    totalPages: result.result.totalPages,
    stats: result.stats
  });
}

export async function updateReviewRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as ReviewRequestIdParams;
  const reviewRequest = await updateReviewRequest(
    request.company.id,
    request.user.id,
    params.id,
    request.body as UpdateReviewRequestInput
  );

  return reply.send({
    reviewRequest: toReviewRequestResponse(reviewRequest)
  });
}
