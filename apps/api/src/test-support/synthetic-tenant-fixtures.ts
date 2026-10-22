import type * as FakeDbModule from "./fake-db.js";
import type * as TokensModule from "../lib/tokens.js";

export interface SyntheticTenant {
  company: FakeDbModule.TestCompanyRecord;
  owner: FakeDbModule.TestUserRecord;
  authorization: string;
}

export interface SyntheticTenantPair {
  tenantA: SyntheticTenant;
  tenantB: SyntheticTenant;
}

export interface TenantIsolationSeedBundle {
  customer: FakeDbModule.TestCustomerRecord;
  job: FakeDbModule.TestJobRecord;
  estimate: FakeDbModule.TestEstimateRecord;
  invoice: FakeDbModule.TestInvoiceRecord;
  technician: FakeDbModule.TestTechnicianRecord;
  product: FakeDbModule.TestProductCatalogRecord;
  aiRecommendation: FakeDbModule.TestAiRecommendationRecord;
  campaign: FakeDbModule.TestCampaignRecord;
  maintenancePlan: FakeDbModule.TestMaintenancePlanRecord;
  importSession: FakeDbModule.TestImportSessionRecord;
  fileAttachment: FakeDbModule.TestFileAttachmentRecord;
  automationRule: FakeDbModule.TestAutomationRuleRecord;
  bookingRequest: FakeDbModule.TestBookingRequestRecord;
  payment: FakeDbModule.TestPaymentRecord;
}

function createTenant(
  fakeDb: typeof FakeDbModule,
  tokens: typeof TokensModule,
  label: "a" | "b",
  slugSuffix: string
): SyntheticTenant {
  const company = fakeDb.seedCompany({
    name: `FS-92 Synthetic Org ${label.toUpperCase()}`,
    slug: `fs-92-synthetic-${label}-${slugSuffix}`
  });
  const owner = fakeDb.seedUser({
    companyId: company.id,
    email: `owner-${label}@fs-92-synthetic.test`,
    firstName: "Synthetic",
    lastName: `Owner${label.toUpperCase()}`,
    role: "owner"
  });
  const accessToken = tokens.generateAccessToken({
    userId: owner.id,
    companyId: company.id,
    role: owner.role
  });

  return {
    company,
    owner,
    authorization: `Bearer ${accessToken}`
  };
}

export function seedSyntheticTenantPair(
  fakeDb: typeof FakeDbModule,
  tokens: typeof TokensModule,
  slugSuffix = "default"
): SyntheticTenantPair {
  return {
    tenantA: createTenant(fakeDb, tokens, "a", slugSuffix),
    tenantB: createTenant(fakeDb, tokens, "b", slugSuffix)
  };
}

/** Representative tenant-owned records for cross-tenant negative API tests (no real customer data). */
export function seedTenantIsolationBundle(
  fakeDb: typeof FakeDbModule,
  companyId: string,
  uploadedById: string
): TenantIsolationSeedBundle {
  const customer = fakeDb.seedCustomer({
    companyId,
    firstName: "Synthetic",
    lastName: "Customer",
    email: `customer-${companyId.slice(0, 8)}@fs-92.test`
  });
  const job = fakeDb.seedJob({
    companyId,
    customerId: customer.id,
    title: "FS-92 isolation job",
    status: "scheduled"
  });
  const estimate = fakeDb.seedEstimate({
    companyId,
    customerId: customer.id,
    title: "FS-92 isolation estimate",
    status: "draft"
  });
  const invoice = fakeDb.seedInvoice({
    companyId,
    customerId: customer.id,
    status: "draft"
  });
  const technician = fakeDb.seedTechnician({
    companyId,
    userId: uploadedById,
    firstName: "Tech",
    lastName: "Synthetic",
    phone: "555-0192",
    status: "active"
  });
  const product = fakeDb.seedProductCatalog({
    companyId,
    name: "FS-92 isolation SKU",
    sku: `FS92-${companyId.slice(0, 6)}`,
    unitPrice: "99.00"
  });
  const aiRecommendation = fakeDb.seedAiRecommendation({
    companyId,
    customerId: customer.id,
    type: "reactivation",
    headline: "FS-92 secret headline",
    body: "Synthetic recommendation body"
  });
  const campaign = fakeDb.seedCampaign({
    companyId,
    name: "FS-92 isolation campaign",
    type: "custom",
    status: "draft"
  });
  const maintenancePlan = fakeDb.seedMaintenancePlan({
    companyId,
    customerId: customer.id,
    name: "FS-92 isolation plan"
  });
  const importSession = fakeDb.seedImportSession({
    companyId,
    fileName: "fs-92-secret.csv",
    fileUrl: `https://r2.test/fs-92/${companyId}/secret.csv`,
    status: "preview"
  });
  const fileAttachment = fakeDb.seedFileAttachment({
    companyId,
    entityType: "job",
    entityId: job.id,
    jobId: job.id,
    customerId: customer.id,
    uploadedById,
    fileName: "fs-92-secret.jpg",
    fileUrl: `https://r2.test/fs-92/${companyId}/secret.jpg`
  });
  const automationRule = fakeDb.seedAutomationRule({
    companyId,
    ruleType: "estimate_follow_up"
  });
  const bookingRequest = fakeDb.seedBookingRequest({
    companyId,
    firstName: "Book",
    lastName: "Synthetic",
    phone: "555-0193",
    addressLine1: "1 Synthetic Way",
    city: "Austin",
    state: "TX",
    zip: "78701",
    status: "pending"
  });
  const payment = fakeDb.seedPayment({
    companyId,
    invoiceId: invoice.id,
    customerId: customer.id,
    amount: "25.00",
    status: "succeeded"
  });

  return {
    customer,
    job,
    estimate,
    invoice,
    technician,
    product,
    aiRecommendation,
    campaign,
    maintenancePlan,
    importSession,
    fileAttachment,
    automationRule,
    bookingRequest,
    payment
  };
}
