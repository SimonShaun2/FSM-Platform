import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  ActivityEvent,
  AddNoteInput,
  AddPhotoInput,
  CompleteJobInput,
  CreateJobInput,
  JobDetail,
  JobListItem,
  JobNote,
  JobPhoto,
  ListJobsQuery,
  ScheduleJobInput,
  UpdateJobInput
} from "@fsm/types";

import {
  addNote,
  addPhoto,
  assignTechnician,
  completeJob,
  createJob,
  getJob,
  getJobNotes,
  getJobPhotos,
  getJobTimeline,
  listJobs,
  scheduleJob,
  transitionStatus,
  updateJob
} from "../../services/job.service.js";
import type {
  AssignTechnicianBody,
  JobIdParams,
  TransitionStatusBody
} from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toJobListItemResponse(job: JobListItem) {
  return {
    id: job.id,
    jobNumber: job.jobNumber,
    title: job.title,
    type: job.type,
    priority: job.priority,
    status: job.status,
    scheduledStart: toIsoString(job.scheduledStart),
    scheduledEnd: toIsoString(job.scheduledEnd),
    customer: {
      id: job.customer.id,
      firstName: job.customer.firstName,
      lastName: job.customer.lastName,
      phone: job.customer.phone
    },
    property: job.property
      ? {
          id: job.property.id,
          addressLine1: job.property.addressLine1,
          city: job.property.city,
          state: job.property.state
        }
      : null,
    technician: job.technician
      ? {
          id: job.technician.id,
          firstName: job.technician.firstName,
          lastName: job.technician.lastName,
          phone: job.technician.phone,
          calendarColor: job.technician.calendarColor
        }
      : null,
    createdAt: job.createdAt.toISOString()
  };
}

function toJobDetailResponse(job: JobDetail) {
  return {
    id: job.id,
    companyId: job.companyId,
    jobNumber: job.jobNumber,
    customerId: job.customerId,
    propertyId: job.propertyId,
    assetId: job.assetId,
    technicianId: job.technicianId,
    assignedById: job.assignedById,
    type: job.type,
    priority: job.priority,
    status: job.status,
    leadSource: job.leadSource,
    title: job.title,
    description: job.description,
    scheduledStart: toIsoString(job.scheduledStart),
    scheduledEnd: toIsoString(job.scheduledEnd),
    scheduledDurationMinutes: job.scheduledDurationMinutes,
    actualStart: toIsoString(job.actualStart),
    actualEnd: toIsoString(job.actualEnd),
    techNotes: job.techNotes,
    completionNotes: job.completionNotes,
    signatureUrl: job.signatureUrl,
    signedAt: toIsoString(job.signedAt),
    signedByName: job.signedByName,
    estimateTotal: job.estimateTotal,
    invoiceTotal: job.invoiceTotal,
    amountPaid: job.amountPaid,
    maintenancePlanId: job.maintenancePlanId,
    parentJobId: job.parentJobId,
    tags: job.tags ?? [],
    customer: {
      id: job.customer.id,
      firstName: job.customer.firstName,
      lastName: job.customer.lastName,
      phone: job.customer.phone,
      email: job.customer.email ?? null
    },
    property: job.property
      ? {
          id: job.property.id,
          addressLine1: job.property.addressLine1,
          city: job.property.city,
          state: job.property.state,
          zip: job.property.zip ?? "",
          accessNotes: job.property.accessNotes ?? null
        }
      : null,
    asset: job.asset
      ? {
          id: job.asset.id,
          name: job.asset.name,
          assetType: job.asset.assetType,
          brand: job.asset.brand,
          model: job.asset.model,
          installDate: job.asset.installDate,
          lastServiceDate: job.asset.lastServiceDate
        }
      : null,
    technician: job.technician
      ? {
          id: job.technician.id,
          firstName: job.technician.firstName,
          lastName: job.technician.lastName,
          phone: job.technician.phone,
          calendarColor: job.technician.calendarColor
        }
      : null,
    availableTransitions: job.availableTransitions,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    deletedAt: toIsoString(job.deletedAt)
  };
}

function toJobNoteResponse(note: JobNote) {
  return {
    id: note.id,
    companyId: note.companyId,
    jobId: note.jobId,
    authorId: note.authorId,
    content: note.content,
    isInternal: note.isInternal,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    deletedAt: toIsoString(note.deletedAt)
  };
}

function toJobPhotoResponse(photo: JobPhoto) {
  return {
    id: photo.id,
    companyId: photo.companyId,
    jobId: photo.jobId,
    uploadedById: photo.uploadedById,
    url: photo.url,
    thumbnailUrl: photo.thumbnailUrl,
    caption: photo.caption,
    takenAt: toIsoString(photo.takenAt),
    photoType: photo.photoType,
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
    deletedAt: toIsoString(photo.deletedAt)
  };
}

function toActivityEventResponse(event: ActivityEvent) {
  return {
    id: event.id,
    companyId: event.companyId,
    eventType: event.eventType,
    actorId: event.actorId,
    actorType: event.actorType,
    actorName: event.actorName,
    entityType: event.entityType,
    entityId: event.entityId,
    customerId: event.customerId,
    jobId: event.jobId,
    estimateId: event.estimateId,
    invoiceId: event.invoiceId,
    payload: event.payload,
    summary: event.summary,
    occurredAt: event.occurredAt.toISOString()
  };
}

export async function listJobsHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const result = await listJobs(request.company.id, request.query as ListJobsQuery);

  return reply.send({
    data: result.data.map((job) => toJobListItemResponse(job)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function createJobHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const job = await createJob(request.company.id, request.user.id, request.body as CreateJobInput);
  const detail = await getJob(request.company.id, job.id);

  return reply.status(201).send({
    job: toJobDetailResponse(detail)
  });
}

export async function getJobHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const job = await getJob(request.company.id, params.id);

  return reply.send({
    job: toJobDetailResponse(job)
  });
}

export async function updateJobHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  await updateJob(request.company.id, request.user.id, params.id, request.body as UpdateJobInput);
  const detail = await getJob(request.company.id, params.id);

  return reply.send({
    job: toJobDetailResponse(detail)
  });
}

export async function transitionStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const body = request.body as TransitionStatusBody;
  await transitionStatus(request.company.id, request.user.id, params.id, body.status, body.reason);
  const detail = await getJob(request.company.id, params.id);

  return reply.send({
    job: toJobDetailResponse(detail)
  });
}

export async function assignTechnicianHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const body = request.body as AssignTechnicianBody;
  await assignTechnician(request.company.id, request.user.id, params.id, body.technicianId);
  const detail = await getJob(request.company.id, params.id);

  return reply.send({
    job: toJobDetailResponse(detail)
  });
}

export async function scheduleJobHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  await scheduleJob(request.company.id, request.user.id, params.id, request.body as ScheduleJobInput);
  const detail = await getJob(request.company.id, params.id);

  return reply.send({
    job: toJobDetailResponse(detail)
  });
}

export async function completeJobHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  await completeJob(request.company.id, request.user.id, params.id, request.body as CompleteJobInput);
  const detail = await getJob(request.company.id, params.id);

  return reply.send({
    job: toJobDetailResponse(detail)
  });
}

export async function addNoteHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const note = await addNote(request.company.id, request.user.id, params.id, request.body as AddNoteInput);

  return reply.status(201).send({
    note: toJobNoteResponse(note)
  });
}

export async function getNotesHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const notes = await getJobNotes(request.company.id, params.id);

  return reply.send({
    notes: notes.map((note) => toJobNoteResponse(note))
  });
}

export async function addPhotoHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const photo = await addPhoto(request.company.id, request.user.id, params.id, request.body as AddPhotoInput);

  return reply.status(201).send({
    photo: toJobPhotoResponse(photo)
  });
}

export async function getPhotosHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const photos = await getJobPhotos(request.company.id, params.id);

  return reply.send({
    photos: photos.map((photo) => toJobPhotoResponse(photo))
  });
}

export async function getJobTimelineHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as JobIdParams;
  const timeline = await getJobTimeline(request.company.id, params.id);

  return reply.send({
    activity: timeline.map((event) => toActivityEventResponse(event))
  });
}
