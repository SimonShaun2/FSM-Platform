import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  CreateGrowthCheckFindingInput,
  CreateGrowthCheckIdentityCandidateInput,
  CreateGrowthCheckInput,
  ListGrowthCheckQueueQuery,
  UpdateGrowthCheckFindingInput,
  UpdateGrowthCheckIdentityCandidateInput,
  UpdateGrowthCheckInput
} from "@fsm/types";

import {
  createGrowthCheck,
  createGrowthCheckFinding,
  createGrowthCheckIdentityCandidate,
  getGrowthCheckById,
  listGrowthCheckAuditEvents,
  listGrowthCheckQueue,
  softDeleteGrowthCheck,
  softDeleteGrowthCheckFinding,
  softDeleteGrowthCheckIdentityCandidate,
  updateGrowthCheck,
  updateGrowthCheckFinding,
  updateGrowthCheckIdentityCandidate
} from "../../services/growth-intake-foundation.service.js";
import type {
  GrowthCheckCandidateParams,
  GrowthCheckFindingParams,
  GrowthCheckParams
} from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toGrowthCheckResponse(check: Awaited<ReturnType<typeof createGrowthCheck>>) {
  return {
    id: check.id,
    companyId: check.companyId,
    status: check.status,
    ownerUserId: check.ownerUserId,
    createdById: check.createdById,
    reviewNeeded: check.reviewNeeded,
    lastScanAt: toIsoString(check.lastScanAt),
    businessName: check.businessName,
    websiteUrl: check.websiteUrl,
    industry: check.industry,
    trade: check.trade,
    city: check.city,
    state: check.state,
    zip: check.zip,
    contactName: check.contactName,
    contactEmail: check.contactEmail,
    contactPhone: check.contactPhone,
    targetMarket: check.targetMarket,
    googleBusinessProfileUrl: check.googleBusinessProfileUrl,
    facebookPageUrl: check.facebookPageUrl,
    intakeNotes: check.intakeNotes,
    createdAt: check.createdAt.toISOString(),
    updatedAt: check.updatedAt.toISOString(),
    deletedAt: toIsoString(check.deletedAt)
  };
}

function toIdentityCandidateResponse(
  candidate: Awaited<ReturnType<typeof createGrowthCheckIdentityCandidate>>
) {
  return {
    id: candidate.id,
    companyId: candidate.companyId,
    growthCheckId: candidate.growthIntakeCheckId,
    displayName: candidate.displayName,
    domain: candidate.domain,
    source: candidate.source,
    confidenceScore: candidate.confidenceScore,
    isPrimary: candidate.isPrimary,
    metadata: candidate.metadata ?? {},
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    deletedAt: toIsoString(candidate.deletedAt)
  };
}

function toFindingResponse(finding: Awaited<ReturnType<typeof createGrowthCheckFinding>>) {
  return {
    id: finding.id,
    companyId: finding.companyId,
    growthCheckId: finding.growthIntakeCheckId,
    category: finding.category,
    severity: finding.severity,
    status: finding.status,
    title: finding.title,
    description: finding.description,
    recommendation: finding.recommendation,
    evidence: finding.evidence ?? {},
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
    deletedAt: toIsoString(finding.deletedAt)
  };
}

export async function listGrowthCheckQueueHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const checks = await listGrowthCheckQueue(
    request.company.id,
    request.query as ListGrowthCheckQueueQuery
  );

  return reply.send({
    checks: checks.map((check) => toGrowthCheckResponse(check))
  });
}

export async function createGrowthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const check = await createGrowthCheck(
    request.company.id,
    request.user.id,
    request.body as CreateGrowthCheckInput
  );

  return reply.code(201).send({
    check: toGrowthCheckResponse(check)
  });
}

export async function getGrowthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckParams;
  const detail = await getGrowthCheckById(request.company.id, params.id);

  return reply.send({
    check: toGrowthCheckResponse(detail.check),
    identityCandidates: detail.identityCandidates.map((candidate) => toIdentityCandidateResponse(candidate)),
    findings: detail.findings.map((finding) => toFindingResponse(finding))
  });
}

export async function updateGrowthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckParams;
  const check = await updateGrowthCheck(
    request.company.id,
    request.user.id,
    params.id,
    request.body as UpdateGrowthCheckInput
  );

  return reply.send({
    check: toGrowthCheckResponse(check)
  });
}

export async function deleteGrowthCheckHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckParams;
  const check = await softDeleteGrowthCheck(request.company.id, request.user.id, params.id);

  return reply.send({
    check: toGrowthCheckResponse(check)
  });
}

export async function listGrowthCheckAuditHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckParams;
  const events = await listGrowthCheckAuditEvents(request.company.id, params.id);

  return reply.send({
    events: events.map((event) => ({
      id: event.id,
      companyId: event.companyId,
      entityType: event.entityType,
      entityId: event.entityId,
      growthCheckId: event.growthIntakeCheckId,
      action: event.action,
      actorId: event.actorId,
      beforeState: event.beforeState,
      afterState: event.afterState,
      createdAt: event.createdAt.toISOString()
    }))
  });
}

export async function createIdentityCandidateHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckParams;
  const candidate = await createGrowthCheckIdentityCandidate(
    request.company.id,
    request.user.id,
    params.id,
    request.body as CreateGrowthCheckIdentityCandidateInput
  );

  return reply.code(201).send({
    identityCandidate: toIdentityCandidateResponse(candidate)
  });
}

export async function updateIdentityCandidateHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckCandidateParams;
  const candidate = await updateGrowthCheckIdentityCandidate(
    request.company.id,
    request.user.id,
    params.id,
    params.candidateId,
    request.body as UpdateGrowthCheckIdentityCandidateInput
  );

  return reply.send({
    identityCandidate: toIdentityCandidateResponse(candidate)
  });
}

export async function deleteIdentityCandidateHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckCandidateParams;
  const candidate = await softDeleteGrowthCheckIdentityCandidate(
    request.company.id,
    request.user.id,
    params.id,
    params.candidateId
  );

  return reply.send({
    identityCandidate: toIdentityCandidateResponse(candidate)
  });
}

export async function createFindingHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckParams;
  const finding = await createGrowthCheckFinding(
    request.company.id,
    request.user.id,
    params.id,
    request.body as CreateGrowthCheckFindingInput
  );

  return reply.code(201).send({
    finding: toFindingResponse(finding)
  });
}

export async function updateFindingHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckFindingParams;
  const finding = await updateGrowthCheckFinding(
    request.company.id,
    request.user.id,
    params.id,
    params.findingId,
    request.body as UpdateGrowthCheckFindingInput
  );

  return reply.send({
    finding: toFindingResponse(finding)
  });
}

export async function deleteFindingHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const params = request.params as GrowthCheckFindingParams;
  const finding = await softDeleteGrowthCheckFinding(
    request.company.id,
    request.user.id,
    params.id,
    params.findingId
  );

  return reply.send({
    finding: toFindingResponse(finding)
  });
}
