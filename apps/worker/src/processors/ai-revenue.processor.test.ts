import type { Job } from "bullmq";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../../api/src/test-support/env-setup.js";
import { resetTestState } from "../../../api/src/test-support/fake-db.js";

setupTestEnv();

const {
  aiQueueAddMock,
  redisDelMock,
  redisGetMock,
  redisSetMock
} = vi.hoisted(() => ({
  aiQueueAddMock: vi.fn(),
  redisDelMock: vi.fn(async () => 1),
  redisGetMock: vi.fn(async () => null),
  redisSetMock: vi.fn(async () => "OK")
}));

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../../api/src/test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../../api/src/test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  aiQueue: {
    add: aiQueueAddMock
  },
  redisConnection: {
    get: redisGetMock,
    set: redisSetMock,
    del: redisDelMock
  }
}));

vi.mock("@fsm/ai", () => ({
  generateAgingAssetMessage: vi.fn(async () => "Aging asset message"),
  generateEstimateFollowUpMessage: vi.fn(async () => "Estimate follow-up message"),
  generateInvoiceRecoveryMessage: vi.fn(async () => "Invoice recovery message"),
  generateReactivationMessage: vi.fn(async () => "Reactivation message")
}));

type AiRevenueProcessorModule = typeof import("./ai-revenue.processor.js");

let aiRevenueProcessor: AiRevenueProcessorModule;

beforeAll(async () => {
  aiRevenueProcessor = await import("./ai-revenue.processor.js");
});

function createJob(name: string, data: Record<string, unknown>): Job<Record<string, unknown>> {
  return {
    id: `job-${name}`,
    name,
    data
  } as unknown as Job<Record<string, unknown>>;
}

function createDependencies(): aiRevenueProcessor.AiRevenueDependencies {
  return {
    loadCompany: vi.fn(async () => null),
    loadCustomerOpportunityContext: vi.fn(async () => null),
    loadEstimateFollowUpContext: vi.fn(async () => null),
    loadInvoiceRecoveryContext: vi.fn(async () => null),
    listCompanyIds: vi.fn(async () => []),
    listActiveCompanyIdsForRevenueSummary: vi.fn(async () => []),
    listDormantCustomerIds: vi.fn(async () => []),
    findAutomationRule: vi.fn(async () => null),
    findPendingRecommendation: vi.fn(async () => null),
    createRecommendation: vi.fn(async () => ({ id: "recommendation-1" })),
    computeRevenueSummarySnapshot: vi.fn(async () => ({
      dormantCustomers: {
        count: 1,
        estimatedRevenue: "300.00",
        topRecommendations: []
      },
      unsoldEstimates: {
        count: 0,
        totalValue: "0.00",
        topRecommendations: []
      },
      unpaidInvoices: {
        count: 0,
        totalValue: "0.00",
        topRecommendations: []
      },
      agingAssets: {
        count: 0,
        estimatedRevenue: "0.00",
        topRecommendations: []
      },
      maintenancePlanOpportunities: {
        count: 0,
        estimatedRevenue: "0.00",
        topRecommendations: []
      },
      totalOpportunityValue: "300.00",
      generatedAt: "2026-04-28T12:00:00.000Z"
    })),
    cacheRevenueSummary: vi.fn(async () => undefined),
    enqueueRevenueSummary: vi.fn(async () => undefined),
    invalidateRevenueSummaryCache: vi.fn(async () => undefined),
    emitRecommendationCreated: vi.fn(async () => undefined),
    generateAgingAssetMessage: vi.fn(async () => "Aging asset message"),
    generateEstimateFollowUpMessage: vi.fn(async () => "Estimate follow-up message"),
    generateInvoiceRecoveryMessage: vi.fn(async () => "Invoice recovery message"),
    generateReactivationMessage: vi.fn(async () => "Reactivation message")
  };
}

function createCustomerContext(
  overrides: Partial<Awaited<ReturnType<aiRevenueProcessor.AiRevenueDependencies["loadCustomerOpportunityContext"]>>> = {}
) {
  return {
    company: {
      id: "company-1",
      name: "Acme HVAC"
    },
    customerId: "customer-1",
    customerFirstName: "Chris",
    customerLastName: "Pine",
    doNotContact: false,
    lastServiceDate: "2025-12-01",
    activeAssets: [],
    openEstimates: [],
    activeMaintenancePlans: [{ id: "plan-1", propertyId: null }],
    recentJobs: [],
    companyAverageTicket: "350.00",
    cheapestAnnualPlanPrice: null,
    recentReplacementEstimateAssetIds: [],
    ...overrides
  };
}

describe("ai-revenue.processor", () => {
  let dependencies: aiRevenueProcessor.AiRevenueDependencies;

  beforeEach(() => {
    dependencies = createDependencies();
    resetTestState();
    aiQueueAddMock.mockReset();
    redisDelMock.mockReset();
    redisGetMock.mockReset();
    redisSetMock.mockReset();
    vi.useRealTimers();
  });

  it("getCurrentSeason returns the expected season for representative months", () => {
    expect(aiRevenueProcessor.getCurrentSeason(new Date("2026-03-15T12:00:00.000Z"))).toBe("spring");
    expect(aiRevenueProcessor.getCurrentSeason(new Date("2026-07-15T12:00:00.000Z"))).toBe("summer");
    expect(aiRevenueProcessor.getCurrentSeason(new Date("2026-10-15T12:00:00.000Z"))).toBe("fall");
    expect(aiRevenueProcessor.getCurrentSeason(new Date("2026-12-15T12:00:00.000Z"))).toBe("winter");
  });

  it("computeUrgencyScore covers all recommendation types with the expected thresholds", () => {
    expect(aiRevenueProcessor.computeUrgencyScore("reactivation", { daysSinceService: 90 })).toBe(30);
    expect(aiRevenueProcessor.computeUrgencyScore("reactivation", { daysSinceService: 180 })).toBe(55);
    expect(aiRevenueProcessor.computeUrgencyScore("reactivation", { daysSinceService: 365 })).toBe(90);

    expect(aiRevenueProcessor.computeUrgencyScore("aging_asset", { assetAgeYears: 10 })).toBe(50);
    expect(aiRevenueProcessor.computeUrgencyScore("aging_asset", { assetAgeYears: 12 })).toBe(70);
    expect(aiRevenueProcessor.computeUrgencyScore("aging_asset", { assetAgeYears: 15 })).toBe(90);

    expect(aiRevenueProcessor.computeUrgencyScore("unsold_estimate", { hoursElapsed: 24 })).toBe(60);
    expect(aiRevenueProcessor.computeUrgencyScore("unsold_estimate", { hoursElapsed: 48 })).toBe(75);
    expect(aiRevenueProcessor.computeUrgencyScore("unsold_estimate", { hoursElapsed: 72 })).toBe(85);

    expect(aiRevenueProcessor.computeUrgencyScore("unpaid_invoice", { daysOverdue: 5 })).toBe(50);
    expect(aiRevenueProcessor.computeUrgencyScore("unpaid_invoice", { daysOverdue: 10 })).toBe(70);
    expect(aiRevenueProcessor.computeUrgencyScore("unpaid_invoice", { daysOverdue: 20 })).toBe(90);

    expect(aiRevenueProcessor.computeUrgencyScore("maintenance_plan_offer", {})).toBe(40);
    expect(aiRevenueProcessor.computeUrgencyScore("maintenance_due", { daysToDue: 0 })).toBe(90);
    expect(aiRevenueProcessor.computeUrgencyScore("maintenance_due", { daysToDue: 5 })).toBe(70);
    expect(aiRevenueProcessor.computeUrgencyScore("maintenance_due", { daysToDue: 30 })).toBe(40);
    expect(aiRevenueProcessor.computeUrgencyScore("seasonal_campaign", {})).toBe(30);
    expect(aiRevenueProcessor.computeUrgencyScore("upsell_opportunity", {})).toBe(30);
  });

  it("estimateRevenue uses decimal math for each supported recommendation type", () => {
    expect(aiRevenueProcessor.estimateRevenue("reactivation", {}, "350.00")).toBe("350.00");
    expect(aiRevenueProcessor.estimateRevenue("aging_asset", {}, "350.00")).toBe("1050.00");
    expect(
      aiRevenueProcessor.estimateRevenue(
        "maintenance_plan_offer",
        { annualPlanPrice: "299.00" },
        "350.00"
      )
    ).toBe("299.00");
    expect(
      aiRevenueProcessor.estimateRevenue(
        "unsold_estimate",
        { estimateTotal: "825.50" },
        "350.00"
      )
    ).toBe("825.50");
    expect(
      aiRevenueProcessor.estimateRevenue(
        "unpaid_invoice",
        { balanceDue: "149.95" },
        "350.00"
      )
    ).toBe("149.95");
    expect(aiRevenueProcessor.estimateRevenue("maintenance_due", {}, "350.00")).toBe("175.00");
  });

  it("evaluate-revenue-opportunities applies seasonal HVAC reactivation scoring and invalidates cache on create", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-28T12:00:00.000Z"));
    vi.mocked(dependencies.loadCustomerOpportunityContext).mockResolvedValue(
      createCustomerContext({
        activeAssets: [
          {
            id: "asset-1",
            propertyId: null,
            assetType: "hvac",
            brand: "Carrier",
            installDate: "2024-01-01"
          }
        ],
        activeMaintenancePlans: [],
        cheapestAnnualPlanPrice: null,
        lastServiceDate: "2025-12-01"
      })
    );
    vi.mocked(dependencies.findAutomationRule).mockImplementation(async (_companyId, ruleType) => {
      if (ruleType === "dormant_customer") {
        return {
          companyId: "company-1",
          delayHours: null,
          thresholdDays: 90
        };
      }

      return null;
    });

    await aiRevenueProcessor.handleEvaluateRevenueOpportunities(
      createJob("evaluate-revenue-opportunities", {
        companyId: "company-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.generateReactivationMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceType: "cooling tune-up"
      })
    );
    expect(dependencies.createRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "reactivation",
        urgencyScore: 40,
        estimatedRevenue: "350.00"
      })
    );
    expect(dependencies.invalidateRevenueSummaryCache).toHaveBeenCalledWith("company-1");
  });

  it("evaluate-revenue-opportunities creates an aging_asset recommendation for equipment older than 10 years", async () => {
    vi.mocked(dependencies.loadCustomerOpportunityContext).mockResolvedValue(
      createCustomerContext({
        activeAssets: [
          {
            id: "asset-1",
            propertyId: "property-1",
            assetType: "AC",
            brand: "Carrier",
            installDate: "2012-01-01"
          }
        ]
      })
    );

    await aiRevenueProcessor.handleEvaluateRevenueOpportunities(
      createJob("evaluate-revenue-opportunities", {
        companyId: "company-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.createRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "aging_asset",
        assetId: "asset-1",
        customerId: "customer-1"
      })
    );
  });

  it("estimate-follow-up-check creates a recommendation using urgency thresholds from sentAt", async () => {
    vi.mocked(dependencies.findAutomationRule).mockImplementation(async (_companyId, ruleType) => {
      if (ruleType === "estimate_follow_up") {
        return {
          companyId: "company-1",
          delayHours: 24,
          thresholdDays: null
        };
      }

      return null;
    });
    vi.mocked(dependencies.loadEstimateFollowUpContext).mockResolvedValue({
      company: {
        id: "company-1",
        name: "Acme HVAC"
      },
      estimateId: "estimate-1",
      customerId: "customer-1",
      customerFirstName: "Chris",
      status: "sent",
      estimateNumber: "EST-1001",
      total: "325.00",
      sentAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
    });

    await aiRevenueProcessor.handleEstimateFollowUpCheck(
      createJob("estimate-follow-up-check", {
        companyId: "company-1",
        estimateId: "estimate-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.createRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "unsold_estimate",
        urgencyScore: 85
      })
    );
  });

  it("invoice-recovery-check creates a recommendation with the correct urgency score", async () => {
    vi.mocked(dependencies.findAutomationRule).mockImplementation(async (_companyId, ruleType) => {
      if (ruleType === "invoice_overdue") {
        return {
          companyId: "company-1",
          delayHours: null,
          thresholdDays: null
        };
      }

      return null;
    });
    vi.mocked(dependencies.loadInvoiceRecoveryContext).mockResolvedValue({
      company: {
        id: "company-1",
        name: "Acme HVAC"
      },
      invoiceId: "invoice-1",
      customerId: "customer-1",
      customerFirstName: "Chris",
      status: "overdue",
      invoiceNumber: "INV-1001",
      balanceDue: "275.00",
      dueAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paymentLinkUrl: "https://example.com/pay"
    });

    await aiRevenueProcessor.handleInvoiceRecoveryCheck(
      createJob("invoice-recovery-check", {
        companyId: "company-1",
        invoiceId: "invoice-1",
        customerId: "customer-1"
      }),
      dependencies
    );

    expect(dependencies.createRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "unpaid_invoice",
        urgencyScore: 70
      })
    );
  });

  it("compute-revenue-summary caches the computed snapshot", async () => {
    await aiRevenueProcessor.handleComputeRevenueSummary(
      createJob("compute-revenue-summary", {
        companyId: "company-1"
      }),
      dependencies
    );

    expect(dependencies.computeRevenueSummarySnapshot).toHaveBeenCalledWith("company-1");
    expect(dependencies.cacheRevenueSummary).toHaveBeenCalledWith(
      "company-1",
      expect.objectContaining({
        totalOpportunityValue: "300.00"
      })
    );
  });

  it("compute-revenue-summary stores the cache with the expected Redis key format and TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-28T12:00:00.000Z"));

    await aiRevenueProcessor.processAiRevenue(
      createJob("compute-revenue-summary", {
        companyId: "company-1"
      })
    );

    expect(redisSetMock).toHaveBeenCalledTimes(1);
    expect(redisSetMock).toHaveBeenCalledWith(
      "revenue-summary:company-1",
      expect.any(String),
      "EX",
      300,
      "NX"
    );

    const [[, cachedSummary]] = redisSetMock.mock.calls as [[string, string, string, number, string]];

    expect(JSON.parse(cachedSummary)).toEqual(
      expect.objectContaining({
        totalOpportunityValue: "0.00",
        generatedAt: "2026-04-28T12:00:00.000Z"
      })
    );
  });

  it("compute-revenue-summary-batch pages active companies in batches of 20 and enqueues per-company jobs", async () => {
    vi.mocked(dependencies.listActiveCompanyIdsForRevenueSummary).mockImplementation(async (_since, offset) => {
      if (offset === 0) {
        return Array.from({ length: 20 }, (_, index) => `company-${index + 1}`);
      }

      if (offset === 20) {
        return ["company-21"];
      }

      return [];
    });

    await aiRevenueProcessor.handleComputeRevenueSummaryBatch(
      createJob("compute-revenue-summary-batch", {}),
      dependencies
    );

    expect(dependencies.listActiveCompanyIdsForRevenueSummary).toHaveBeenNthCalledWith(
      1,
      expect.any(Date),
      0,
      20
    );
    expect(dependencies.listActiveCompanyIdsForRevenueSummary).toHaveBeenNthCalledWith(
      2,
      expect.any(Date),
      20,
      20
    );
    expect(dependencies.listActiveCompanyIdsForRevenueSummary).toHaveBeenNthCalledWith(
      3,
      expect.any(Date),
      40,
      20
    );
    expect(dependencies.enqueueRevenueSummary).toHaveBeenCalledTimes(21);
    expect(dependencies.enqueueRevenueSummary).toHaveBeenCalledWith("company-21");
  });

  it("dormant-customer-scan processes multiple companies and deduplicates existing recommendations", async () => {
    vi.mocked(dependencies.listCompanyIds).mockImplementation(async (offset) => {
      if (offset === 0) {
        return ["company-1", "company-2"];
      }

      return [];
    });
    vi.mocked(dependencies.findAutomationRule).mockImplementation(async (companyId, ruleType) => {
      if (ruleType !== "dormant_customer") {
        return null;
      }

      if (companyId === "company-1") {
        return {
          companyId: "company-1",
          delayHours: null,
          thresholdDays: 90
        };
      }

      return null;
    });
    vi.mocked(dependencies.listDormantCustomerIds).mockImplementation(async (companyId, _thresholdDays, offset) => {
      if (companyId === "company-1" && offset === 0) {
        return ["customer-1", "customer-2"];
      }

      return [];
    });
    vi.mocked(dependencies.loadCustomerOpportunityContext).mockImplementation(async (companyId, customerId) => {
      if (companyId !== "company-1") {
        return null;
      }

      return createCustomerContext({
        company: {
          id: companyId,
          name: "Acme HVAC"
        },
        customerId,
        customerFirstName: customerId === "customer-1" ? "Chris" : "Jamie",
        lastServiceDate: "2025-08-01"
      });
    });
    vi.mocked(dependencies.findPendingRecommendation).mockImplementation(async (criteria) => {
      if (criteria.customerId === "customer-2") {
        return { id: "existing-reactivation" };
      }

      return null;
    });

    await aiRevenueProcessor.handleDormantCustomerScan(
      createJob("dormant-customer-scan", {}),
      dependencies
    );

    expect(dependencies.createRecommendation).toHaveBeenCalledTimes(1);
    expect(dependencies.createRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "reactivation",
        customerId: "customer-1"
      })
    );
  });
});
