import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  AgreementDetail,
  AgreementListItem,
  CancelAgreementInput,
  CreateAgreementInput,
  CreateTemplateInput,
  ListAgreementsQuery,
  MaintenanceVisit,
  RecordVisitInput,
  ServiceAgreementTemplate,
  UpdateAgreementInput,
  UpdateTemplateInput
} from "@fsm/types";

import {
  cancelAgreement,
  createAgreement,
  getAgreement,
  listAgreements,
  listVisits,
  recordVisit,
  updateAgreement
} from "../../services/service-agreement.service.js";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate
} from "../../services/service-agreement-template.service.js";
import type {
  CancelAgreementBody,
  ServiceAgreementIdParams
} from "./schemas.js";

function toIsoString(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString();
}

function toTemplateResponse(template: ServiceAgreementTemplate) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    visitsPerYear: template.visitsPerYear,
    frequency: template.frequency,
    monthlyPrice: template.monthlyPrice,
    annualPrice: template.annualPrice,
    applicableAssetTypes: template.applicableAssetTypes ?? [],
    sortOrder: template.sortOrder,
    isActive: template.isActive
  };
}

function toAgreementListItemResponse(agreement: AgreementListItem) {
  return {
    id: agreement.id,
    name: agreement.name,
    status: agreement.status,
    frequency: agreement.frequency,
    nextServiceDate: agreement.nextServiceDate,
    lastServiceDate: agreement.lastServiceDate,
    price: agreement.price,
    billingCycle: agreement.billingCycle,
    customer: agreement.customer,
    createdAt: agreement.createdAt.toISOString()
  };
}

function toAgreementDetailResponse(agreement: AgreementDetail) {
  return {
    id: agreement.id,
    name: agreement.name,
    description: agreement.description,
    status: agreement.status,
    frequency: agreement.frequency,
    startDate: agreement.startDate,
    endDate: agreement.endDate,
    nextServiceDate: agreement.nextServiceDate,
    lastServiceDate: agreement.lastServiceDate,
    price: agreement.price,
    billingCycle: agreement.billingCycle,
    stripeCancelAtPeriodEnd: agreement.stripeCancelAtPeriodEnd,
    stripeCurrentPeriodEnd: toIsoString(agreement.stripeCurrentPeriodEnd),
    includedServices: agreement.includedServices,
    notes: agreement.notes,
    customer: agreement.customer,
    property: agreement.property,
    template: agreement.template,
    assets: agreement.assets,
    recentVisits: agreement.recentVisits
  };
}

function toVisitResponse(visit: MaintenanceVisit) {
  return {
    id: visit.id,
    companyId: visit.companyId,
    maintenancePlanId: visit.maintenancePlanId,
    jobId: visit.jobId,
    scheduledDate: visit.scheduledDate,
    completedDate: visit.completedDate,
    notes: visit.notes,
    createdAt: visit.createdAt.toISOString(),
    updatedAt: visit.updatedAt.toISOString(),
    deletedAt: toIsoString(visit.deletedAt)
  };
}

export async function listTemplatesHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const templates = await listTemplates(request.company.id);

  return reply.send({
    templates: templates.map((template) => toTemplateResponse(template))
  });
}

export async function createTemplateHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const template = await createTemplate(
    request.company.id,
    request.user.id,
    request.body as CreateTemplateInput
  );

  return reply.status(201).send({
    template: toTemplateResponse(template)
  });
}

export async function updateTemplateHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as ServiceAgreementIdParams;
  const template = await updateTemplate(
    request.company.id,
    request.user.id,
    params.id,
    request.body as UpdateTemplateInput
  );

  return reply.send({
    template: toTemplateResponse(template)
  });
}

export async function deleteTemplateHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as ServiceAgreementIdParams;
  await deleteTemplate(request.company.id, request.user.id, params.id);

  return reply.status(204).send();
}

export async function listAgreementsHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const result = await listAgreements(request.company.id, request.query as ListAgreementsQuery);

  return reply.send({
    data: result.data.map((agreement) => toAgreementListItemResponse(agreement)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function createAgreementHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const agreement = await createAgreement(
    request.company.id,
    request.user.id,
    request.body as CreateAgreementInput
  );
  const detail = await getAgreement(request.company.id, agreement.id);

  return reply.status(201).send({
    agreement: toAgreementDetailResponse(detail)
  });
}

export async function getAgreementHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as ServiceAgreementIdParams;
  const agreement = await getAgreement(request.company.id, params.id);

  return reply.send({
    agreement: toAgreementDetailResponse(agreement)
  });
}

export async function updateAgreementHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as ServiceAgreementIdParams;
  await updateAgreement(
    request.company.id,
    request.user.id,
    params.id,
    request.body as UpdateAgreementInput
  );
  const detail = await getAgreement(request.company.id, params.id);

  return reply.send({
    agreement: toAgreementDetailResponse(detail)
  });
}

export async function cancelAgreementHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as ServiceAgreementIdParams;
  const body = request.body as CancelAgreementBody;
  const cancelInput: CancelAgreementInput = {
    cancelImmediately: body.cancelImmediately,
    ...(body.reason !== undefined ? { reason: body.reason } : {})
  };

  await cancelAgreement(
    request.company.id,
    request.user.id,
    params.id,
    cancelInput
  );
  const detail = await getAgreement(request.company.id, params.id);

  return reply.send({
    agreement: toAgreementDetailResponse(detail)
  });
}

export async function recordVisitHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as ServiceAgreementIdParams;
  const body = request.body as { completedDate: string; jobId?: string; notes?: string };
  const visitInput: RecordVisitInput = {
    completedDate: body.completedDate,
    ...(body.jobId !== undefined ? { jobId: body.jobId } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {})
  };
  const visit = await recordVisit(
    request.company.id,
    request.user.id,
    params.id,
    visitInput
  );

  return reply.status(201).send({
    visit: toVisitResponse(visit)
  });
}

export async function listVisitsHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as ServiceAgreementIdParams;
  const visits = await listVisits(request.company.id, params.id);

  return reply.send({
    visits: visits.map((visit) => toVisitResponse(visit))
  });
}
