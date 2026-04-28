import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  Campaign,
  CampaignDetail,
  CampaignDetailRecipient,
  CampaignListItem,
  CampaignRecipientListItem,
  CreateCampaignInput,
  ListCampaignsQuery,
  ListRecipientsQuery,
  UpdateCampaignInput
} from "@fsm/types";

import {
  createCampaign,
  generateDraft,
  getCampaign,
  listCampaigns,
  listRecipients,
  sendCampaign,
  updateCampaign
} from "../../services/campaign.service.js";
import type {
  CampaignIdParams,
  CreateCampaignBody,
  ListCampaignsQueryInput,
  ListRecipientsQueryInput,
  UpdateCampaignBody
} from "./schemas.js";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toCampaignListItemResponse(item: CampaignListItem) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    status: item.status,
    channel: item.channel,
    recipientCount: item.recipientCount,
    deliveredCount: item.deliveredCount,
    convertedCount: item.convertedCount,
    revenueAttributed: item.revenueAttributed,
    sentAt: toIsoString(item.sentAt),
    createdAt: item.createdAt.toISOString()
  };
}

function toCampaignDetailRecipientResponse(recipient: CampaignDetailRecipient) {
  return {
    id: recipient.id,
    customer: recipient.customer,
    sentToPhone: recipient.sentToPhone,
    sentToEmail: recipient.sentToEmail,
    sentAt: toIsoString(recipient.sentAt),
    deliveredAt: toIsoString(recipient.deliveredAt),
    convertedAt: toIsoString(recipient.convertedAt)
  };
}

function toCampaignRecipientListItemResponse(recipient: CampaignRecipientListItem) {
  return {
    ...toCampaignDetailRecipientResponse(recipient),
    status: recipient.status
  };
}

function toCampaignResponse(campaign: Campaign | CampaignDetail) {
  const baseResponse = {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    channel: campaign.channel,
    body: campaign.body && campaign.body.trim().length > 0 ? campaign.body : null,
    subject: campaign.subject,
    isAiGenerated: Boolean(campaign.isAiGenerated),
    recipientCount: campaign.recipientCount ?? 0,
    deliveredCount: campaign.deliveredCount ?? 0,
    openedCount: campaign.openedCount ?? 0,
    repliedCount: campaign.repliedCount ?? 0,
    convertedCount: campaign.convertedCount ?? 0,
    revenueAttributed: campaign.revenueAttributed ?? "0.00",
    sentAt: toIsoString(campaign.sentAt),
    createdAt: campaign.createdAt.toISOString()
  };

  if ("recipients" in campaign) {
    return {
      ...baseResponse,
      recipients: campaign.recipients.map((recipient) => toCampaignDetailRecipientResponse(recipient))
    };
  }

  return baseResponse;
}

function toCreateCampaignInput(input: CreateCampaignBody): CreateCampaignInput {
  return {
    name: input.name,
    type: input.type,
    channel: input.channel,
    recommendationIds: input.recommendationIds,
    ...(input.subject ? { subject: input.subject } : {})
  };
}

function toUpdateCampaignInput(input: UpdateCampaignBody): UpdateCampaignInput {
  return {
    ...(input.body ? { body: input.body } : {}),
    ...(input.subject ? { subject: input.subject } : {}),
    ...(input.channel ? { channel: input.channel } : {})
  };
}

function toListCampaignsQuery(input: ListCampaignsQueryInput): ListCampaignsQuery {
  return {
    page: input.page,
    limit: input.limit,
    ...(input.status ? { status: input.status } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.channel ? { channel: input.channel } : {}),
    ...(input.createdAfter ? { createdAfter: input.createdAfter } : {}),
    ...(input.createdBefore ? { createdBefore: input.createdBefore } : {})
  };
}

function toListRecipientsQuery(input: ListRecipientsQueryInput): ListRecipientsQuery {
  return {
    page: input.page,
    limit: input.limit
  };
}

export async function createCampaignHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const campaign = await createCampaign(
    request.company.id,
    request.user.id,
    toCreateCampaignInput(request.body as CreateCampaignBody)
  );
  const detail = await getCampaign(request.company.id, campaign.id);

  return reply.status(201).send({
    campaign: toCampaignResponse(detail)
  });
}

export async function listCampaignsHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const result = await listCampaigns(
    request.company.id,
    toListCampaignsQuery(request.query as ListCampaignsQueryInput)
  );

  return reply.send({
    data: result.data.map((item) => toCampaignListItemResponse(item)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}

export async function getCampaignHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as CampaignIdParams;
  const campaign = await getCampaign(request.company.id, params.id);

  return reply.send({
    campaign: toCampaignResponse(campaign)
  });
}

export async function updateCampaignHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as CampaignIdParams;
  await updateCampaign(
    request.company.id,
    request.user.id,
    params.id,
    toUpdateCampaignInput(request.body as UpdateCampaignBody)
  );
  const detail = await getCampaign(request.company.id, params.id);

  return reply.send({
    campaign: toCampaignResponse(detail)
  });
}

export async function generateDraftHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as CampaignIdParams;
  await generateDraft(request.company.id, request.user.id, params.id);
  const detail = await getCampaign(request.company.id, params.id);

  return reply.send({
    campaign: toCampaignResponse(detail)
  });
}

export async function sendCampaignHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as CampaignIdParams;
  await sendCampaign(request.company.id, request.user.id, params.id);
  const detail = await getCampaign(request.company.id, params.id);

  return reply.send({
    campaign: toCampaignResponse(detail)
  });
}

export async function listRecipientsHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const params = request.params as CampaignIdParams;
  const result = await listRecipients(
    request.company.id,
    params.id,
    toListRecipientsQuery(request.query as ListRecipientsQueryInput)
  );

  return reply.send({
    data: result.data.map((recipient) => toCampaignRecipientListItemResponse(recipient)),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages
  });
}
