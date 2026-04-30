import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  AvailabilityResult,
  CreateTechnicianInput,
  ListTechniciansQuery,
  PerformanceSummary,
  Technician,
  TechnicianDetail,
  UpdateTechnicianInput
} from "@fsm/types";

import {
  createTechnician,
  deleteTechnician,
  getTechnician,
  getTechnicianAvailability,
  getTechnicianPerformance,
  linkUserToTechnician,
  listTechnicians,
  updateTechnician
} from "../../services/technician.service.js";
import type {
  AvailabilityQuery,
  LinkUserBody,
  TechnicianIdParams
} from "./schemas.js";

function toTechnicianListItem(technician: Technician) {
  return {
    id: technician.id,
    firstName: technician.firstName,
    lastName: technician.lastName,
    email: technician.email,
    phone: technician.phone,
    skills: technician.skills ?? [],
    serviceZipCodes: technician.serviceZipCodes ?? [],
    status: technician.status,
    calendarColor: technician.calendarColor ?? "#6366f1",
    hoursPerDay: technician.hoursPerDay ?? "8",
    totalJobsCompleted: technician.totalJobsCompleted ?? 0,
    userId: technician.userId,
    createdAt: technician.createdAt.toISOString()
  };
}

function toTechnicianDetailResponse(technician: TechnicianDetail) {
  return {
    id: technician.id,
    firstName: technician.firstName,
    lastName: technician.lastName,
    email: technician.email,
    phone: technician.phone,
    skills: technician.skills ?? [],
    serviceAreaIds: technician.serviceAreaIds ?? [],
    serviceZipCodes: technician.serviceZipCodes ?? [],
    status: technician.status,
    calendarColor: technician.calendarColor ?? "#6366f1",
    hoursPerDay: technician.hoursPerDay ?? "8",
    notes: technician.notes,
    totalJobsCompleted: technician.totalJobsCompleted ?? 0,
    avgJobDurationMinutes: technician.avgJobDurationMinutes ?? null,
    estimateCloseRate: technician.estimateCloseRate ?? null,
    avgTicketValue: technician.avgTicketValue ?? null,
    userId: technician.userId,
    todayJobCount: technician.todayJobCount,
    activeJobCount: technician.activeJobCount,
    createdAt: technician.createdAt.toISOString()
  };
}

function toAvailabilityResponse(availability: AvailabilityResult) {
  return {
    technicianId: availability.technicianId,
    startDate: availability.startDate,
    endDate: availability.endDate,
    days: availability.days.map((day) => ({
      date: day.date,
      totalBookedMinutes: day.totalBookedMinutes,
      availableMinutes: day.availableMinutes,
      slots: day.slots.map((slot) => ({
        id: slot.id,
        jobId: slot.jobId,
        isBlockedTime: slot.isBlockedTime ?? false,
        blockReason: slot.blockReason,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        isConfirmed: slot.isConfirmed ?? false
      }))
    }))
  };
}

function toPerformanceResponse(performance: PerformanceSummary) {
  return {
    technicianId: performance.technicianId,
    totalJobsCompleted: performance.totalJobsCompleted,
    avgJobDurationMinutes: performance.avgJobDurationMinutes,
    estimateCloseRate: performance.estimateCloseRate,
    avgTicketValue: performance.avgTicketValue,
    last30Days: {
      jobsCompleted: performance.last30Days.jobsCompleted,
      revenue: performance.last30Days.revenue,
      avgTicket: performance.last30Days.avgTicket
    }
  };
}

export async function listTechniciansHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const result = await listTechnicians(request.company.id, request.query as ListTechniciansQuery);

  return reply.send({
    data: result.data.map((technician) => toTechnicianListItem(technician)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function createTechnicianHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const technician = await createTechnician(
    request.company.id,
    request.user.id,
    request.body as CreateTechnicianInput
  );
  const detail = await getTechnician(request.company.id, technician.id);

  return reply.status(201).send({
    technician: toTechnicianDetailResponse(detail)
  });
}

export async function getTechnicianHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  const technician = await getTechnician(request.company.id, params.id);

  return reply.send({
    technician: toTechnicianDetailResponse(technician)
  });
}

export async function updateTechnicianHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  await updateTechnician(
    request.company.id,
    request.user.id,
    params.id,
    request.body as UpdateTechnicianInput
  );
  const detail = await getTechnician(request.company.id, params.id);

  return reply.send({
    technician: toTechnicianDetailResponse(detail)
  });
}

export async function deleteTechnicianHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  await deleteTechnician(request.company.id, request.user.id, params.id);

  return reply.send({
    success: true
  });
}

export async function getTechnicianAvailabilityHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  const query = request.query as AvailabilityQuery;
  const availability = await getTechnicianAvailability(
    request.company.id,
    params.id,
    query.startDate,
    query.endDate
  );

  return reply.send({
    availability: toAvailabilityResponse(availability)
  });
}

export async function getTechnicianPerformanceHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  const performance = await getTechnicianPerformance(request.company.id, params.id);

  return reply.send({
    performance: toPerformanceResponse(performance)
  });
}

export async function linkUserToTechnicianHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  const body = request.body as LinkUserBody;
  await linkUserToTechnician(request.company.id, request.user.id, params.id, body.userId);
  const detail = await getTechnician(request.company.id, params.id);

  return reply.send({
    technician: toTechnicianDetailResponse(detail)
  });
}
