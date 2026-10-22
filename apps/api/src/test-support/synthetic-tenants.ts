import { expect } from "vitest";

type FakeDb = typeof import("./fake-db.js");
type Tokens = typeof import("../lib/tokens.js");

export interface SyntheticTenantAuth {
  company: ReturnType<FakeDb["seedCompany"]>;
  user: ReturnType<FakeDb["seedUser"]>;
  authorization: string;
}

export interface SyntheticTenantBFixtures {
  customer: ReturnType<FakeDb["seedCustomer"]>;
  property: ReturnType<FakeDb["seedProperty"]>;
  job: ReturnType<FakeDb["seedJob"]>;
  estimate: ReturnType<FakeDb["seedEstimate"]>;
  invoice: ReturnType<FakeDb["seedInvoice"]>;
  importSession: ReturnType<FakeDb["seedImportSession"]>;
}

/** Distinctive marker — cross-tenant responses must never echo tenant B PII. */
export const TENANT_B_PROBE_EMAIL = "fs92-probe-tenant-b@isolation.test";
export const TENANT_B_PROBE_NAME = "FS92-Tenant-B-Probe-Customer";

export function createSyntheticTenantAuth(
  fakeDb: FakeDb,
  tokens: Tokens,
  label: "A" | "B"
): SyntheticTenantAuth {
  const company = fakeDb.seedCompany({
    name: label === "A" ? "FS92 Synthetic Tenant A" : "FS92 Synthetic Tenant B",
    slug: label === "A" ? "fs92-tenant-a" : "fs92-tenant-b"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: label === "A" ? "owner-a@fs92.test" : "owner-b@fs92.test",
    firstName: "Owner",
    lastName: label,
    role: "owner"
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return {
    company,
    user,
    authorization: `Bearer ${accessToken}`
  };
}

export function seedSyntheticTenantBFixtures(
  fakeDb: FakeDb,
  tenantBCompanyId: string
): SyntheticTenantBFixtures {
  const customer = fakeDb.seedCustomer({
    companyId: tenantBCompanyId,
    firstName: TENANT_B_PROBE_NAME,
    lastName: "Secret",
    email: TENANT_B_PROBE_EMAIL,
    phone: "555-FS92-B"
  });
  const property = fakeDb.seedProperty({
    companyId: tenantBCompanyId,
    customerId: customer.id,
    addressLine1: "999 Tenant B Secret Lane",
    city: "Probe City",
    state: "TX",
    zip: "75001"
  });
  const job = fakeDb.seedJob({
    companyId: tenantBCompanyId,
    customerId: customer.id,
    propertyId: property.id,
    title: "Tenant B secret job",
    status: "scheduled"
  });
  const estimate = fakeDb.seedEstimate({
    companyId: tenantBCompanyId,
    customerId: customer.id,
    propertyId: property.id,
    jobId: job.id,
    status: "sent",
    title: "Tenant B secret estimate"
  });
  const invoice = fakeDb.seedInvoice({
    companyId: tenantBCompanyId,
    customerId: customer.id,
    jobId: job.id,
    status: "sent",
    title: "Tenant B secret invoice"
  });
  const importSession = fakeDb.seedImportSession({
    companyId: tenantBCompanyId,
    status: "preview",
    entityType: "customers",
    fileName: "tenant-b-secret.csv",
    fileUrl: "https://r2.test/fs92-tenant-b-import"
  });

  return { customer, property, job, estimate, invoice, importSession };
}

export function assertTenantIsolationNotFound(response: { status: number; body: Record<string, unknown> }) {
  expect(response.status).toBe(404);
  expect(response.body.error).toBe("NOT_FOUND");
  const serialized = JSON.stringify(response.body);
  expect(serialized).not.toContain(TENANT_B_PROBE_EMAIL);
  expect(serialized).not.toContain(TENANT_B_PROBE_NAME);
  expect(serialized).not.toContain("999 Tenant B Secret Lane");
}

export function assertUnauthorized(response: { status: number; body: Record<string, unknown> }) {
  expect(response.status).toBe(401);
  expect(response.body.error).toBe("UNAUTHORIZED");
}
