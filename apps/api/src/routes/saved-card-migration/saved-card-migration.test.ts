import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { closeTestApp } from "../../test-support/close-test-app.js";
import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

const attachImportedPaymentMethodMock = vi.fn();

vi.mock("../../lib/stripe-saved-card-import.adapter.js", () => ({
  assertStripeTestModeForCardMigration: vi.fn(),
  RENVANI_STRIPE_PAN_IMPORT_DOCS_URL: "https://docs.stripe.com/test",
  attachImportedPaymentMethodToCustomer: attachImportedPaymentMethodMock
}));

const sendRenderedTemplateEmailMock = vi.fn();

vi.mock("../../lib/outbound-email.js", () => ({
  sendRenderedTemplateEmail: sendRenderedTemplateEmailMock,
  deliverTransactionalEmail: vi.fn(),
  getTransactionalEmailFromAddress: vi.fn()
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;

beforeAll(async () => {
  buildAppModule = await import("../../app.js");
  fakeDb = await import("../../test-support/fake-db.js");
  tokens = await import("../../lib/tokens.js");
});

beforeEach(async () => {
  fakeDb.resetTestState();
  attachImportedPaymentMethodMock.mockReset();
  sendRenderedTemplateEmailMock.mockReset();
  attachImportedPaymentMethodMock.mockResolvedValue({ paymentMethodLabel: "VISA ending in 4242" });
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await closeTestApp(app);
});

function createAuthContext(role: "owner" | "admin" = "owner") {
  const company = fakeDb.seedCompany({
    name: "Card Migrate Co",
    slug: `card-migrate-${String(Math.random()).slice(2, 8)}`,
    timezone: "America/Chicago",
    stripeAccountId: "acct_test_connect"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}@card-migrate.test`,
    firstName: "Owner",
    lastName: "User",
    role
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return { company, user, authorization: `Bearer ${accessToken}` };
}

function createInternalAdminContext() {
  const company = fakeDb.seedCompany({
    id: fakeDb.RENAVANI_INTERNAL_TEST_COMPANY_ID,
    name: "Renvani Internal",
    slug: "renvani-internal",
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: "internal@renvani.test",
    firstName: "Internal",
    lastName: "Admin",
    role: "admin"
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });
  return { company, authorization: `Bearer ${accessToken}` };
}

describe("saved card migration (FS-138)", () => {
  it("starts migration, confirms Stripe import, maps payment methods, and exposes wizard status", async () => {
    const { company, authorization } = createAuthContext("owner");
    const bundle = fakeDb.seedImportBundle({ companyId: company.id, wizardStep: 3 });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Pat",
      lastName: "Lee",
      email: "pat@example.com"
    });

    const start = await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration`)
      .set("Authorization", authorization)
      .send({ priorProcessorName: "Legacy Processor" });

    expect(start.status).toBe(201);
    expect(start.body.status).toBe("awaiting_stripe_import");
    expect(start.body.stripePanImportInstructionsUrl).toContain("https://");

    const confirm = await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration/confirm-stripe-import`)
      .set("Authorization", authorization)
      .send({ stripeImportReference: "stripe_import_job_test_1" });

    expect(confirm.status).toBe(200);
    expect(confirm.body.status).toBe("mapping");

    const apply = await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration/apply-mappings`)
      .set("Authorization", authorization)
      .send({
        rows: [
          {
            stripeCustomerId: "cus_test_1",
            stripePaymentMethodId: "pm_test_1",
            renvaniCustomerId: customer.id
          }
        ]
      });

    expect(apply.status).toBe(200);
    expect(apply.body.status).toBe("completed");
    expect(apply.body.mappingSummary.matched).toBe(1);
    expect(attachImportedPaymentMethodMock).toHaveBeenCalled();

    const status = await request(app.server)
      .get(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration`)
      .set("Authorization", authorization);

    expect(status.status).toBe(200);
    expect(status.body.migration.status).toBe("completed");

    const updatedBundle = fakeDb.getTestState().importBundles.find((row) => row.id === bundle.id);
    expect(updatedBundle?.stepState).toMatchObject({
      savedCardMigration: { status: "completed" }
    });
  });

  it("sends Resend fallback email for unmatched customers", async () => {
    const { company, authorization } = createAuthContext("owner");
    const bundle = fakeDb.seedImportBundle({ companyId: company.id });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "No",
      lastName: "Card",
      email: "nocard@example.com"
    });

    await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration`)
      .set("Authorization", authorization)
      .send({ priorProcessorName: "Legacy Processor" });

    await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration/confirm-stripe-import`)
      .set("Authorization", authorization)
      .send({ stripeImportReference: "stripe_import_job_test_2" });

    await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration/apply-mappings`)
      .set("Authorization", authorization)
      .send({
        rows: [
          {
            stripeCustomerId: "cus_orphan",
            stripePaymentMethodId: "pm_orphan",
            email: "unknown@example.com"
          }
        ]
      });

    const fallback = await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundle.id}/saved-card-migration/send-fallback-email`)
      .set("Authorization", authorization)
      .send({ renvaniCustomerId: customer.id });

    expect(fallback.status).toBe(200);
    expect(sendRenderedTemplateEmailMock).toHaveBeenCalled();
    expect(fallback.body.fallbackEmailSentAt).toBeTruthy();
  });

  it("lists migrations for internal admin", async () => {
    const tenant = createAuthContext("owner");
    const bundle = fakeDb.seedImportBundle({ companyId: tenant.company.id });
    fakeDb.seedSavedCardMigration({
      companyId: tenant.company.id,
      importBundleId: bundle.id,
      priorProcessorName: "Jobber",
      status: "mapping"
    });

    const internal = createInternalAdminContext();
    const response = await request(app.server)
      .get(`/api/v1/internal/admin/saved-card-migrations?companyId=${tenant.company.id}`)
      .set("Authorization", internal.authorization);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].priorProcessorName).toBe("Jobber");
  });

  it("rejects internal admin routes for tenant companies", async () => {
    const { authorization } = createAuthContext("admin");
    const response = await request(app.server)
      .get("/api/v1/internal/admin/saved-card-migrations")
      .set("Authorization", authorization);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(ErrorCode.FORBIDDEN);
  });
});
