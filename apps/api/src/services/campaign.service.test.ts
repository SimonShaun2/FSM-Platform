import { randomUUID } from "node:crypto";

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

const { addQueueJob, generateCampaignMessageMock } = vi.hoisted(() => ({
  addQueueJob: vi.fn(),
  generateCampaignMessageMock: vi.fn()
}));

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  notificationsQueue: {
    add: addQueueJob
  }
}));

vi.mock("@fsm/ai", () => ({
  generateCampaignMessage: generateCampaignMessageMock
}));

type CampaignServiceModule = typeof import("./campaign.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let campaignService: CampaignServiceModule;
let fakeDb: FakeDbModule;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

beforeAll(async () => {
  campaignService = await import("./campaign.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
  addQueueJob.mockReset();
  generateCampaignMessageMock.mockReset();
});

function seedCompanyGraph() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const actor = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner"
  });
  const customer = fakeDb.seedCustomer({
    companyId: company.id,
    firstName: "Chris",
    lastName: "Pine",
    email: "chris@example.com",
    phone: "555-0100",
    lastServiceDate: "2025-10-01"
  });
  const secondCustomer = fakeDb.seedCustomer({
    companyId: company.id,
    firstName: "Morgan",
    lastName: "Lane",
    email: "morgan@example.com",
    phone: "555-0101"
  });
  const property = fakeDb.seedProperty({
    companyId: company.id,
    customerId: customer.id,
    addressLine1: "101 Main St",
    city: "Tulsa",
    state: "OK",
    zip: "74103"
  });
  const asset = fakeDb.seedAsset({
    companyId: company.id,
    customerId: customer.id,
    propertyId: property.id,
    name: "Main HVAC",
    assetType: "hvac",
    installDate: "2012-01-01"
  });
  const estimate = fakeDb.seedEstimate({
    companyId: company.id,
    customerId: customer.id,
    estimateNumber: "EST-1001",
    total: "425.00",
    subtotal: "425.00",
    status: "sent"
  });
  const recommendation = fakeDb.seedAiRecommendation({
    companyId: company.id,
    type: "reactivation",
    customerId: customer.id,
    assetId: asset.id,
    estimateId: estimate.id,
    estimatedRevenue: "300.00",
    urgencyScore: 80,
    headline: "Reach back out",
    body: "Dormant customer"
  });
  const secondRecommendation = fakeDb.seedAiRecommendation({
    companyId: company.id,
    type: "seasonal_campaign",
    customerId: secondCustomer.id,
    estimatedRevenue: "200.00",
    urgencyScore: 60,
    headline: "Seasonal push",
    body: "Send a seasonal reminder"
  });

  return {
    company,
    actor,
    customer,
    secondCustomer,
    property,
    asset,
    estimate,
    recommendation,
    secondRecommendation
  };
}

describe("campaign.service", () => {
  it("createCampaign creates recipients and links the first recommendation on the campaign", async () => {
    const { company, actor, recommendation, secondRecommendation } = seedCompanyGraph();

    const campaign = await campaignService.createCampaign(company.id, actor.id, {
      name: "Dormant win-back",
      type: "reactivation",
      channel: "email",
      recommendationIds: [recommendation.id, secondRecommendation.id],
      subject: "We'd love to help"
    });

    expect(campaign.status).toBe("draft");
    expect(campaign.aiRecommendationId).toBe(recommendation.id);
    expect(campaign.recipientCount).toBe(2);
    expect(fakeDb.getTestState().campaignRecipients).toHaveLength(2);
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("campaign.created");
  });

  it("generateDraft stores the generated body and marks the campaign as AI-generated", async () => {
    const { company, actor, customer, recommendation } = seedCompanyGraph();
    const campaign = fakeDb.seedCampaign({
      companyId: company.id,
      createdById: actor.id,
      type: "reactivation",
      name: "Dormant win-back",
      aiRecommendationId: recommendation.id,
      body: ""
    });
    fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: customer.id
    });
    generateCampaignMessageMock.mockResolvedValue("Hi Chris, it’s been a while. Reply if you’d like Acme HVAC to help schedule your next visit.");

    const updatedCampaign = await campaignService.generateDraft(company.id, actor.id, campaign.id);

    expect(updatedCampaign.isAiGenerated).toBe(true);
    expect(updatedCampaign.body).toContain("Hi Chris");
    expect(generateCampaignMessageMock).toHaveBeenCalledTimes(1);
  });

  it("sendCampaign enqueues send jobs for all eligible recipients and marks the campaign sent", async () => {
    const { company, actor, customer, secondCustomer } = seedCompanyGraph();
    const campaign = fakeDb.seedCampaign({
      companyId: company.id,
      createdById: actor.id,
      type: "reactivation",
      name: "Dormant win-back",
      channel: "sms",
      body: "Hi there, Acme HVAC can help with your next service visit. Reply if you’d like to get scheduled."
    });
    const firstRecipient = fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: customer.id
    });
    const secondRecipient = fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: secondCustomer.id
    });

    const updatedCampaign = await campaignService.sendCampaign(company.id, actor.id, campaign.id);

    expect(updatedCampaign.status).toBe("sent");
    expect(addQueueJob).toHaveBeenCalledTimes(2);
    expect(addQueueJob).toHaveBeenNthCalledWith(
      1,
      "send-campaign-message",
      expect.objectContaining({
        companyId: company.id,
        campaignId: campaign.id,
        recipientId: firstRecipient.id,
        customerId: customer.id,
        channel: "sms"
      }),
      expect.objectContaining({
        jobId: `campaign:${campaign.id}:recipient:${firstRecipient.id}`
      })
    );
    expect(addQueueJob).toHaveBeenNthCalledWith(
      2,
      "send-campaign-message",
      expect.objectContaining({
        recipientId: secondRecipient.id,
        customerId: secondCustomer.id
      }),
      expect.any(Object)
    );
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("campaign.sent");
  });

  it("sendCampaign throws CONFLICT when the campaign is not draft", async () => {
    const { company, actor } = seedCompanyGraph();
    const campaign = fakeDb.seedCampaign({
      companyId: company.id,
      createdById: actor.id,
      type: "reactivation",
      name: "Dormant win-back",
      status: "sent",
      body: "Hello"
    });

    await expect(campaignService.sendCampaign(company.id, actor.id, campaign.id)).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });
  });

  it("updateCampaign succeeds for draft campaigns and throws CONFLICT for sent campaigns", async () => {
    const { company, actor } = seedCompanyGraph();
    const draftCampaign = fakeDb.seedCampaign({
      companyId: company.id,
      createdById: actor.id,
      type: "custom",
      name: "Manual campaign",
      channel: "email",
      body: "Original body",
      subject: "Original subject"
    });
    const sentCampaign = fakeDb.seedCampaign({
      companyId: company.id,
      createdById: actor.id,
      type: "custom",
      name: "Sent campaign",
      status: "sent",
      body: "Already sent"
    });

    const updatedCampaign = await campaignService.updateCampaign(company.id, actor.id, draftCampaign.id, {
      body: "Updated body",
      subject: "Updated subject"
    });

    expect(updatedCampaign.body).toBe("Updated body");
    expect(updatedCampaign.subject).toBe("Updated subject");

    await expect(
      campaignService.updateCampaign(company.id, actor.id, sentCampaign.id, {
        body: "Nope"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });
  });

  it("listCampaigns returns paginated company-scoped results and filters by status, type, and channel", async () => {
    const { company } = seedCompanyGraph();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac",
      timezone: "America/Chicago"
    });

    const matchingCampaign = fakeDb.seedCampaign({
      companyId: company.id,
      type: "reactivation",
      name: "Matching campaign",
      status: "sent",
      channel: "sms",
      createdAt: new Date("2026-04-28T09:00:00.000Z")
    });
    const sameCompanyDifferentStatus = fakeDb.seedCampaign({
      companyId: company.id,
      type: "reactivation",
      name: "Draft campaign",
      status: "draft",
      channel: "sms",
      createdAt: new Date("2026-04-28T10:00:00.000Z")
    });
    const sameCompanyDifferentType = fakeDb.seedCampaign({
      companyId: company.id,
      type: "seasonal",
      name: "Seasonal campaign",
      status: "sent",
      channel: "email",
      createdAt: new Date("2026-04-28T11:00:00.000Z")
    });
    fakeDb.seedCampaign({
      companyId: otherCompany.id,
      type: "reactivation",
      name: "Other company campaign",
      status: "sent",
      channel: "sms",
      createdAt: new Date("2026-04-28T12:00:00.000Z")
    });

    const paginatedResult = await campaignService.listCampaigns(company.id, {
      page: 1,
      limit: 2
    });
    const filteredResult = await campaignService.listCampaigns(company.id, {
      page: 1,
      limit: 10,
      status: "sent",
      type: "reactivation",
      channel: "sms"
    });

    expect(paginatedResult.total).toBe(3);
    expect(paginatedResult.data).toHaveLength(2);
    expect(paginatedResult.data.map((campaign) => campaign.id)).toEqual([
      sameCompanyDifferentType.id,
      sameCompanyDifferentStatus.id
    ]);

    expect(filteredResult.total).toBe(1);
    expect(filteredResult.data).toHaveLength(1);
    expect(filteredResult.data[0]?.id).toBe(matchingCampaign.id);
  });

  it("getCampaign returns full detail with recipients", async () => {
    const { company, customer, secondCustomer } = seedCompanyGraph();
    const campaign = fakeDb.seedCampaign({
      companyId: company.id,
      type: "custom",
      name: "Manual campaign",
      status: "sent",
      channel: "email",
      body: "Hello customers",
      subject: "A quick note",
      recipientCount: 2,
      deliveredCount: 1,
      convertedCount: 1,
      revenueAttributed: "250.00"
    });
    fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: customer.id,
      sentToEmail: customer.email,
      sentAt: new Date("2026-04-28T10:00:00.000Z"),
      deliveredAt: new Date("2026-04-28T10:01:00.000Z")
    });
    fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: secondCustomer.id,
      sentToEmail: secondCustomer.email,
      sentAt: new Date("2026-04-28T10:02:00.000Z")
    });

    const detail = await campaignService.getCampaign(company.id, campaign.id);

    expect(detail.id).toBe(campaign.id);
    expect(detail.recipientCount).toBe(2);
    expect(detail.deliveredCount).toBe(1);
    expect(detail.convertedCount).toBe(1);
    expect(detail.recipients).toHaveLength(2);
    expect(detail.recipients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer: {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName
          },
          sentToEmail: customer.email
        })
      ])
    );
  });

  it("getCampaign throws NOT_FOUND for unknown and cross-tenant ids", async () => {
    const { company } = seedCompanyGraph();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac-detail",
      timezone: "America/Chicago"
    });
    const otherCampaign = fakeDb.seedCampaign({
      companyId: otherCompany.id,
      type: "custom",
      name: "Other company campaign"
    });

    await expect(campaignService.getCampaign(company.id, randomUUID())).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
    await expect(campaignService.getCampaign(company.id, otherCampaign.id)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
  });

  it("listRecipients returns paginated delivery statuses for a company campaign", async () => {
    const { company, customer, secondCustomer } = seedCompanyGraph();
    const campaign = fakeDb.seedCampaign({
      companyId: company.id,
      type: "reactivation",
      name: "Recipient status campaign",
      status: "sent"
    });
    const deliveredRecipient = fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: customer.id,
      sentAt: new Date("2026-04-28T10:00:00.000Z"),
      deliveredAt: new Date("2026-04-28T10:01:00.000Z"),
      sentToPhone: customer.phone,
      createdAt: new Date("2026-04-28T10:10:00.000Z")
    });
    fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: secondCustomer.id,
      sentAt: new Date("2026-04-28T10:05:00.000Z"),
      sentToEmail: secondCustomer.email,
      createdAt: new Date("2026-04-28T10:00:00.000Z")
    });
    fakeDb.seedMessageLog({
      companyId: company.id,
      customerId: secondCustomer.id,
      campaignId: campaign.id,
      channel: "email",
      direction: "outbound",
      toAddress: secondCustomer.email ?? "morgan@example.com",
      body: "We'd love to help",
      failedAt: new Date("2026-04-28T10:06:00.000Z"),
      failureReason: "Mailbox unavailable"
    });

    const result = await campaignService.listRecipients(company.id, campaign.id, {
      page: 1,
      limit: 1
    });

    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: deliveredRecipient.id,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName
      },
      sentToPhone: customer.phone,
      deliveredAt: new Date("2026-04-28T10:01:00.000Z"),
      status: "delivered"
    });
  });

  it("listRecipients throws NOT_FOUND when the campaign does not belong to the company", async () => {
    const { company } = seedCompanyGraph();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac-recipients",
      timezone: "America/Chicago"
    });
    const otherCampaign = fakeDb.seedCampaign({
      companyId: otherCompany.id,
      type: "custom",
      name: "Other company campaign"
    });

    await expect(
      campaignService.listRecipients(company.id, otherCampaign.id, {
        page: 1,
        limit: 10
      })
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
  });

  it("trackConversion attributes the first in-window job and does not double-attribute later jobs", async () => {
    const { company, customer } = seedCompanyGraph();
    const campaign = fakeDb.seedCampaign({
      companyId: company.id,
      type: "reactivation",
      name: "Dormant win-back",
      status: "sent",
      sentAt: daysAgo(7),
      recipientCount: 1
    });
    const recipient = fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: customer.id,
      sentAt: daysAgo(7)
    });
    const firstJob = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      estimateTotal: "275.00",
      title: "Booked visit"
    });
    const secondJob = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      estimateTotal: "325.00",
      title: "Second visit"
    });

    await campaignService.trackConversion(company.id, customer.id, firstJob.id);

    expect(fakeDb.getTestState().campaignRecipients.find((row) => row.id === recipient.id)?.conversionJobId).toBe(firstJob.id);
    expect(fakeDb.getTestState().campaigns.find((row) => row.id === campaign.id)?.convertedCount).toBe(1);
    expect(fakeDb.getTestState().campaigns.find((row) => row.id === campaign.id)?.revenueAttributed).toBe("275.00");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("campaign.converted");

    await campaignService.trackConversion(company.id, customer.id, secondJob.id);

    expect(fakeDb.getTestState().campaigns.find((row) => row.id === campaign.id)?.convertedCount).toBe(1);
    expect(fakeDb.getTestState().campaigns.find((row) => row.id === campaign.id)?.revenueAttributed).toBe("275.00");
  });

  it("trackConversion ignores recipients outside the 30-day attribution window", async () => {
    const { company, customer } = seedCompanyGraph();
    const campaign = fakeDb.seedCampaign({
      companyId: company.id,
      type: "reactivation",
      name: "Dormant win-back",
      status: "sent",
      sentAt: daysAgo(40),
      recipientCount: 1
    });
    const recipient = fakeDb.seedCampaignRecipient({
      companyId: company.id,
      campaignId: campaign.id,
      customerId: customer.id,
      sentAt: daysAgo(40)
    });
    const job = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      estimateTotal: "180.00",
      title: "Late booking"
    });

    await campaignService.trackConversion(company.id, customer.id, job.id);

    expect(fakeDb.getTestState().campaignRecipients.find((row) => row.id === recipient.id)?.convertedAt).toBeNull();
    expect(fakeDb.getTestState().campaigns.find((row) => row.id === campaign.id)?.convertedCount).toBe(0);
  });
});
