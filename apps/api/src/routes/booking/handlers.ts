import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  BookingHandoff,
  ConfirmBookingRequestInput,
  DeclineBookingRequestInput,
  InitiateBookingHandoffInput,
  ListBookingRequestsQuery,
  ReconcileBookingHandoffInput,
  UpdateBookingSettingsInput
} from "@fsm/types";

import {
  getLatestBookingHandoff,
  initiateBookingHandoff,
  reconcileBookingHandoff
} from "../../services/booking-handoff.service.js";

import {
  checkBookingSlugAvailability,
  confirmBookingRequest,
  declineBookingRequest,
  getBookingDemandByZip,
  getBookingRequest,
  getBookingRequestStats,
  getBookingSettings,
  listBookingRequests,
  updateBookingSettings
} from "../../services/booking.service.js";
import type {
  BookingAnalyticsQuery,
  BookingHandoffIdParams,
  BookingRequestIdParams,
  BookingSlugAvailabilityQuery
} from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toBookingRequestResponse(request: Awaited<ReturnType<typeof getBookingRequest>>) {
  return {
    id: request.id,
    companyId: request.companyId,
    customerId: request.customerId,
    jobId: request.jobId,
    assignedTechnicianId: request.assignedTechnicianId,
    firstName: request.firstName,
    lastName: request.lastName,
    phone: request.phone,
    email: request.email,
    addressLine1: request.addressLine1,
    addressLine2: request.addressLine2,
    city: request.city,
    state: request.state,
    zip: request.zip,
    propertyType: request.propertyType,
    serviceCategory: request.serviceCategory,
    serviceType: request.serviceType,
    serviceDetail: request.serviceDetail,
    urgency: request.urgency,
    customerNotes: request.customerNotes,
    preferredDate: request.preferredDate,
    preferredWindow: request.preferredWindow,
    status: request.status,
    source: request.source,
    referenceNumber: request.referenceNumber,
    isPropertyOwner: request.isPropertyOwner,
    smsConsentAppointments: request.smsConsentAppointments,
    smsConsentMarketing: request.smsConsentMarketing,
    confirmedAt: toIsoString(request.confirmedAt),
    confirmedById: request.confirmedById,
    confirmationSentAt: toIsoString(request.confirmationSentAt),
    cancelledAt: toIsoString(request.cancelledAt),
    cancellationReason: request.cancellationReason,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    deletedAt: toIsoString(request.deletedAt)
  };
}

function toBookingSettingsResponse(settings: Awaited<ReturnType<typeof getBookingSettings>>) {
  return {
    id: settings.id,
    companyId: settings.companyId,
    isEnabled: settings.isEnabled,
    bookingSlug: settings.bookingSlug,
    offeredServices: settings.offeredServices,
    availableHoursStart: settings.availableHoursStart,
    availableHoursEnd: settings.availableHoursEnd,
    availableDays: settings.availableDays ?? [],
    slotDuration: settings.slotDuration,
    maxAdvanceDays: settings.maxAdvanceDays,
    autoConfirm: settings.autoConfirm,
    googleReviewUrl: settings.googleReviewUrl,
    yelpReviewUrl: settings.yelpReviewUrl,
    facebookReviewUrl: settings.facebookReviewUrl,
    customReviewUrl: settings.customReviewUrl,
    tagline: settings.tagline,
    allowZipOverflow: settings.allowZipOverflow,
    balanceWorkload: settings.balanceWorkload,
    notifyOnNewBooking: settings.notifyOnNewBooking,
    notificationEmail: settings.notificationEmail,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
    deletedAt: toIsoString(settings.deletedAt)
  };
}

export async function listBookingRequestsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await listBookingRequests(request.company.id, request.query as ListBookingRequestsQuery);

  return reply.send({
    data: result.data.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    })),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function getBookingRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingRequestIdParams;
  const bookingRequest = await getBookingRequest(request.company.id, params.id);

  return reply.send({
    bookingRequest: toBookingRequestResponse(bookingRequest)
  });
}

export async function confirmBookingRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingRequestIdParams;
  const bookingRequest = await confirmBookingRequest(
    request.company.id,
    request.user.id,
    params.id,
    request.body as ConfirmBookingRequestInput
  );

  return reply.send({
    bookingRequest: toBookingRequestResponse(bookingRequest)
  });
}

export async function declineBookingRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingRequestIdParams;
  const body = request.body as DeclineBookingRequestInput;
  const bookingRequest = await declineBookingRequest(request.company.id, request.user.id, params.id, body.reason);

  return reply.send({
    bookingRequest: toBookingRequestResponse(bookingRequest)
  });
}

export async function getBookingSettingsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const settings = await getBookingSettings(request.company.id);

  return reply.send({
    settings: toBookingSettingsResponse(settings)
  });
}

export async function updateBookingSettingsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const settings = await updateBookingSettings(
    request.company.id,
    request.user.id,
    request.body as UpdateBookingSettingsInput
  );

  return reply.send({
    settings: toBookingSettingsResponse(settings)
  });
}

export async function getBookingSlugAvailabilityHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as BookingSlugAvailabilityQuery;
  const result = await checkBookingSlugAvailability(request.company.id, query.slug);

  return reply.send(result);
}

export async function getBookingRequestStatsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as BookingAnalyticsQuery;
  const stats = await getBookingRequestStats(request.company.id, query.days);

  return reply.send({ stats });
}

function toBookingHandoffResponse(handoff: BookingHandoff) {
  return {
    id: handoff.id,
    companyId: handoff.companyId,
    bookingRequestId: handoff.bookingRequestId,
    targetSystem: handoff.targetSystem,
    status: handoff.status,
    externalReference: handoff.externalReference,
    failureReason: handoff.failureReason,
    operatorNotes: handoff.operatorNotes,
    initiatedById: handoff.initiatedById,
    reconciledById: handoff.reconciledById,
    reconciledAt: handoff.reconciledAt ? handoff.reconciledAt.toISOString() : null,
    createdAt: handoff.createdAt.toISOString(),
    updatedAt: handoff.updatedAt.toISOString(),
    deletedAt: handoff.deletedAt ? handoff.deletedAt.toISOString() : null
  };
}

export async function getBookingHandoffHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingRequestIdParams;
  const handoff = await getLatestBookingHandoff(request.company.id, params.id);

  if (!handoff) {
    return reply.code(404).send({
      error: "NOT_FOUND",
      message: "No booking handoff found for this request",
      requestId: request.id
    });
  }

  return reply.send({
    handoff: toBookingHandoffResponse(handoff)
  });
}

export async function initiateBookingHandoffHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingRequestIdParams;
  const handoff = await initiateBookingHandoff(
    request.company.id,
    request.user.id,
    params.id,
    request.body as InitiateBookingHandoffInput
  );

  return reply.code(201).send({
    handoff: toBookingHandoffResponse(handoff)
  });
}

export async function reconcileBookingHandoffHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as BookingHandoffIdParams;
  const handoff = await reconcileBookingHandoff(
    request.company.id,
    request.user.id,
    params.id,
    params.handoffId,
    request.body as ReconcileBookingHandoffInput
  );

  return reply.send({
    handoff: toBookingHandoffResponse(handoff)
  });
}

export async function getBookingDemandByZipHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const query = request.query as BookingAnalyticsQuery;
  const data = await getBookingDemandByZip(request.company.id, query.days);

  return reply.send({
    data,
    total: data.length,
    page: 1,
    limit: data.length,
    totalPages: data.length === 0 ? 0 : 1
  });
}
