import type { FastifyReply, FastifyRequest } from "fastify";

import type { ListTechnicianTimeQuery, UpdateTechnicianInput } from "@fsm/types";

import { getTechnician, updateTechnician } from "../../services/technician.service.js";
import { listTechnicianTime } from "../../services/time-tracking.service.js";
import type {
  ServiceAreaBody,
  TechnicianIdParams,
  TechnicianTimeQuery
} from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toTimeEntryResponse(entry: Awaited<ReturnType<typeof listTechnicianTime>>["data"][number]) {
  return {
    id: entry.id,
    companyId: entry.companyId,
    jobId: entry.jobId,
    technicianId: entry.technicianId,
    startedAt: entry.startedAt.toISOString(),
    endedAt: toIsoString(entry.endedAt),
    durationMinutes: entry.durationMinutes,
    entryType: entry.entryType,
    notes: entry.notes,
    travelFromAddress: entry.travelFromAddress,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    deletedAt: toIsoString(entry.deletedAt)
  };
}

function toTechnicianResponse(technician: Awaited<ReturnType<typeof getTechnician>>) {
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

export async function listTechnicianTimeHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  const query = request.query as TechnicianTimeQuery;
  const result = await listTechnicianTime(request.company.id, params.id, query as ListTechnicianTimeQuery);

  return reply.send({
    data: result.data.map((entry) => toTimeEntryResponse(entry)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function updateTechnicianServiceAreasHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as TechnicianIdParams;
  const body = request.body as ServiceAreaBody;
  await updateTechnician(
    request.company.id,
    request.user.id,
    params.id,
    { serviceZipCodes: body.serviceZipCodes } satisfies UpdateTechnicianInput
  );
  const technician = await getTechnician(request.company.id, params.id);

  return reply.send({
    technician: toTechnicianResponse(technician)
  });
}
