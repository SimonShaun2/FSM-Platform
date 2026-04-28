import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

const {
  archiveStripePriceMock,
  createServiceAgreementPriceMock
} = vi.hoisted(() => ({
  archiveStripePriceMock: vi.fn(),
  createServiceAgreementPriceMock: vi.fn()
}));

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("../lib/stripe.js", async () => {
  const actual = await vi.importActual<typeof import("../lib/stripe.js")>("../lib/stripe.js");
  return {
    ...actual,
    archiveStripePrice: archiveStripePriceMock,
    createServiceAgreementPrice: createServiceAgreementPriceMock
  };
});

type TemplateServiceModule = typeof import("./service-agreement-template.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let fakeDb: FakeDbModule;
let templateService: TemplateServiceModule;

beforeAll(async () => {
  fakeDb = await import("../test-support/fake-db.js");
  templateService = await import("./service-agreement-template.service.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
  archiveStripePriceMock.mockReset();
  createServiceAgreementPriceMock.mockReset();
  createServiceAgreementPriceMock
    .mockResolvedValueOnce({ id: "price_monthly_123" })
    .mockResolvedValueOnce({ id: "price_annual_123" })
    .mockResolvedValue({ id: "price_default_123" });
});

function createAdminContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac"
  });
  const actor = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner"
  });

  return { company, actor };
}

describe("service-agreement-template.service", () => {
  it("listTemplates returns active templates ordered by sortOrder", async () => {
    const { company } = createAdminContext();
    fakeDb.seedServiceAgreementTemplate({
      companyId: company.id,
      name: "Late Plan",
      visitsPerYear: 2,
      frequency: "bi_annual",
      sortOrder: 20
    });
    fakeDb.seedServiceAgreementTemplate({
      companyId: company.id,
      name: "First Plan",
      visitsPerYear: 4,
      frequency: "quarterly",
      sortOrder: 5
    });
    fakeDb.seedServiceAgreementTemplate({
      companyId: company.id,
      name: "Inactive Plan",
      visitsPerYear: 1,
      frequency: "annual",
      sortOrder: 1,
      isActive: false
    });

    const templates = await templateService.listTemplates(company.id);

    expect(templates.map((template) => template.name)).toEqual(["First Plan", "Late Plan"]);
  });

  it("createTemplate succeeds without pricing and emits an activity event", async () => {
    const { company, actor } = createAdminContext();

    const template = await templateService.createTemplate(company.id, actor.id, {
      name: "Gold Plan",
      visitsPerYear: 2,
      frequency: "bi_annual",
      includedServices: ["Tune-up"],
      applicableAssetTypes: ["hvac"]
    });

    expect(template.name).toBe("Gold Plan");
    expect(template.monthlyPrice).toBeNull();
    expect(template.annualPrice).toBeNull();
    expect(createServiceAgreementPriceMock).not.toHaveBeenCalled();
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("service_agreement_template.created");
  });

  it("createTemplate creates Stripe prices when pricing is provided", async () => {
    const { company, actor } = createAdminContext();

    const template = await templateService.createTemplate(company.id, actor.id, {
      name: "Silver Plan",
      visitsPerYear: 4,
      frequency: "quarterly",
      monthlyPrice: "29.99",
      annualPrice: "299.00"
    });

    expect(template.stripeMthlyPriceId).toBe("price_monthly_123");
    expect(template.stripeAnnualPriceId).toBe("price_annual_123");
    expect(createServiceAgreementPriceMock).toHaveBeenNthCalledWith(1, {
      companyId: company.id,
      templateId: template.id,
      name: "Silver Plan",
      amount: "29.99",
      interval: "month"
    });
    expect(createServiceAgreementPriceMock).toHaveBeenNthCalledWith(2, {
      companyId: company.id,
      templateId: template.id,
      name: "Silver Plan",
      amount: "299.00",
      interval: "year"
    });
  });

  it("updateTemplate creates a new Stripe price when price changes and archives the old one", async () => {
    const { company, actor } = createAdminContext();
    const template = fakeDb.seedServiceAgreementTemplate({
      companyId: company.id,
      name: "Silver Plan",
      visitsPerYear: 4,
      frequency: "quarterly",
      monthlyPrice: "29.99",
      stripeMthlyPriceId: "price_old_monthly"
    });
    createServiceAgreementPriceMock.mockReset();
    createServiceAgreementPriceMock.mockResolvedValueOnce({ id: "price_new_monthly" });

    const updated = await templateService.updateTemplate(company.id, actor.id, template.id, {
      monthlyPrice: "34.99"
    });

    expect(updated.monthlyPrice).toBe("34.99");
    expect(updated.stripeMthlyPriceId).toBe("price_new_monthly");
    expect(createServiceAgreementPriceMock).toHaveBeenCalledWith({
      companyId: company.id,
      templateId: template.id,
      name: "Silver Plan",
      amount: "34.99",
      interval: "month"
    });
    expect(archiveStripePriceMock).toHaveBeenCalledWith("price_old_monthly");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("service_agreement_template.updated");
  });

  it("deleteTemplate throws CONFLICT when active plans exist", async () => {
    const { company, actor } = createAdminContext();
    const template = fakeDb.seedServiceAgreementTemplate({
      companyId: company.id,
      name: "Protected Plan",
      visitsPerYear: 2,
      frequency: "bi_annual"
    });
    fakeDb.seedMaintenancePlan({
      companyId: company.id,
      customerId: fakeDb.seedCustomer({
        companyId: company.id,
        firstName: "Chris",
        lastName: "Pine"
      }).id,
      serviceAgreementTemplateId: template.id,
      status: "active"
    });

    await expect(templateService.deleteTemplate(company.id, actor.id, template.id)).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });
  });

  it("deleteTemplate soft deletes the template and emits a deleted activity event", async () => {
    const { company, actor } = createAdminContext();
    const template = fakeDb.seedServiceAgreementTemplate({
      companyId: company.id,
      name: "Retired Plan",
      visitsPerYear: 2,
      frequency: "bi_annual"
    });

    await templateService.deleteTemplate(company.id, actor.id, template.id);

    const deletedTemplate = fakeDb.getTestState().serviceAgreementTemplates.find((row) => row.id === template.id);

    expect(deletedTemplate?.isActive).toBe(false);
    expect(deletedTemplate?.deletedAt).toBeInstanceOf(Date);
    expect(fakeDb.getTestState().activityEvents.at(-1)).toMatchObject({
      eventType: "service_agreement_template.deleted",
      entityId: template.id
    });
  });
});
