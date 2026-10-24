import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
}, 20000);

beforeEach(async () => {
  fakeDb.resetTestState();
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function createAuthContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner"
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return { company, authorization: `Bearer ${accessToken}` };
}

describe("price-book items search", () => {
  it("GET /price-book/items/search returns tenant-scoped picker seeds", async () => {
    const auth = createAuthContext();
    const product = fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "AC Tune-Up",
      description: "Seasonal maintenance",
      unitPrice: "129.00",
      isTaxable: true
    });
    fakeDb.seedProductCatalog({
      companyId: auth.company.id,
      name: "Hidden Filter",
      unitPrice: "45.00",
      isActive: false
    });

    const otherCompany = fakeDb.seedCompany({ name: "Other Co", slug: "other-co" });
    fakeDb.seedProductCatalog({
      companyId: otherCompany.id,
      name: "AC Tune-Up",
      unitPrice: "99.00"
    });

    const response = await request(app.server)
      .get("/api/v1/price-book/items/search?q=tune")
      .set("Authorization", auth.authorization);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      priceBookItemId: product.id,
      name: "AC Tune-Up",
      description: "Seasonal maintenance",
      unitPrice: "129.00",
      isTaxable: true,
      itemType: "service"
    });
  });

  it("rejects cross-tenant catalog ids on unrelated company search surface", async () => {
    const companyA = createAuthContext();
    const companyB = createAuthContext();

    fakeDb.seedProductCatalog({
      companyId: companyB.company.id,
      name: "Secret Item",
      unitPrice: "10.00"
    });

    const response = await request(app.server)
      .get("/api/v1/price-book/items/search?q=secret")
      .set("Authorization", companyA.authorization);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(0);
  });

  it("GET /price-book/items/search requires auth", async () => {
    const response = await request(app.server).get("/api/v1/price-book/items/search?q=test");
    expect(response.status).toBe(401);
  });

  it("GET /price-book/items/search validates query", async () => {
    const auth = createAuthContext();
    const response = await request(app.server)
      .get("/api/v1/price-book/items/search?q=")
      .set("Authorization", auth.authorization);
    expect(response.status).toBe(400);
  });
});
