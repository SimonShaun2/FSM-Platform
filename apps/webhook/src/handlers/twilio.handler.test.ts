import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

type CompanyRecord = {
  id: string;
  name: string;
  deletedAt: Date | null;
};

type CustomerRecord = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  doNotContact: boolean;
  deletedAt: Date | null;
  updatedAt: Date;
};

type MessageLogRecord = {
  id: string;
  companyId: string;
  customerId: string | null;
  channel: "sms";
  direction: "inbound" | "outbound";
  fromAddress: string | null;
  toAddress: string | null;
  body: string;
  providerMessageId: string | null;
};

type ActivityEventRecord = {
  id: string;
  companyId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  customerId: string | null;
  payload: unknown;
  summary: string;
};

type Predicate<T> = (row: T) => boolean;

interface MockTable {
  __name: string;
}

interface MockTransaction {
  insert(table: MockTable): {
    values(values: Record<string, unknown>): {
      returning(): Promise<Array<Record<string, unknown>>>;
    };
  };
  update(table: MockTable): {
    set(values: Record<string, unknown>): {
      where(predicate: Predicate<Record<string, unknown>>): {
        returning(): Promise<Array<Record<string, unknown>>>;
      };
    };
  };
}

const state = {
  companies: [] as CompanyRecord[],
  customers: [] as CustomerRecord[],
  messageLogs: [] as MessageLogRecord[],
  activityEvents: [] as ActivityEventRecord[]
};

const companiesTable = {
  __name: "companies",
  id: "id",
  deletedAt: "deletedAt"
} as const;

const customersTable = {
  __name: "customers",
  id: "id",
  companyId: "companyId",
  phone: "phone",
  deletedAt: "deletedAt"
} as const;

const messageLogsTable = {
  __name: "messageLogs"
} as const;

function getRows(tableName: string): Array<Record<string, unknown>> {
  switch (tableName) {
    case "companies":
      return state.companies;
    case "customers":
      return state.customers;
    case "messageLogs":
      return state.messageLogs;
    default:
      return [];
  }
}

function resetState(): void {
  state.companies.length = 0;
  state.customers.length = 0;
  state.messageLogs.length = 0;
  state.activityEvents.length = 0;
}

function seedCompany(values: Partial<CompanyRecord> = {}): CompanyRecord {
  const company: CompanyRecord = {
    id: values.id ?? randomUUID(),
    name: values.name ?? "Acme HVAC",
    deletedAt: values.deletedAt ?? null
  };
  state.companies.push(company);
  return company;
}

function seedCustomer(values: Partial<CustomerRecord> & Pick<CustomerRecord, "companyId">): CustomerRecord {
  const customer: CustomerRecord = {
    id: values.id ?? randomUUID(),
    companyId: values.companyId,
    firstName: values.firstName ?? "Chris",
    lastName: values.lastName ?? "Pine",
    phone: values.phone ?? "555-0100",
    doNotContact: values.doNotContact ?? false,
    deletedAt: values.deletedAt ?? null,
    updatedAt: values.updatedAt ?? new Date()
  };
  state.customers.push(customer);
  return customer;
}

vi.mock("drizzle-orm", () => ({
  and: <T>(...predicates: Array<Predicate<T>>) => (row: T) => predicates.every((predicate) => predicate(row)),
  eq: <T>(field: keyof T, value: T[keyof T]) => (row: T) => row[field] === value,
  isNull: <T>(field: keyof T) => (row: T) => row[field] === null
}));

vi.mock("@fsm/db", () => ({
  companies: companiesTable,
  customers: customersTable,
  messageLogs: messageLogsTable,
  db: {
    select() {
      return {
        from(table: MockTable) {
          let filteredRows = [...getRows(table.__name)];

          return {
            where(predicate: Predicate<Record<string, unknown>>) {
              filteredRows = filteredRows.filter(predicate);
              return {
                limit(limitCount: number) {
                  return Promise.resolve(filteredRows.slice(0, limitCount));
                }
              };
            }
          };
        }
      };
    },
    insert(table: MockTable) {
      return {
        values(values: Record<string, unknown>) {
          const row = {
            id: randomUUID(),
            ...values
          };
          getRows(table.__name).push(row);
          return {
            returning() {
              return Promise.resolve([row]);
            }
          };
        }
      };
    },
    update(table: MockTable) {
      return {
        set(values: Record<string, unknown>) {
          return {
            where(predicate: Predicate<Record<string, unknown>>) {
              const rows = getRows(table.__name).filter(predicate);

              for (const row of rows) {
                Object.assign(row, values);
              }

              return {
                returning() {
                  return Promise.resolve(rows);
                }
              };
            }
          };
        }
      };
    },
    async transaction<T>(callback: (tx: MockTransaction) => Promise<T>): Promise<T> {
      const tx: MockTransaction = {
        insert: this.insert,
        update: this.update
      };

      return callback(tx);
    }
  },
  emitEventWithExecutor: async (
    _executor: unknown,
    event: Omit<ActivityEventRecord, "id">
  ) => {
    state.activityEvents.push({
      id: randomUUID(),
      ...event
    });
  }
}));

type TwilioHandlerModule = typeof import("./twilio.handler.js");

let twilioHandlerModule: TwilioHandlerModule;

beforeAll(async () => {
  twilioHandlerModule = await import("./twilio.handler.js");
});

beforeEach(() => {
  resetState();
});

function createReply() {
  const reply = {
    statusCode: 200,
    contentType: "",
    payload: undefined as unknown,
    code(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    type(contentType: string) {
      this.contentType = contentType;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return this;
    }
  };

  return reply as unknown as FastifyReply & {
    statusCode: number;
    contentType: string;
    payload: unknown;
  };
}

function createRequest(params: Record<string, string>): FastifyRequest {
  return {
    twilioParams: params,
    headers: {},
    protocol: "https",
    url: "/twilio",
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }
  } as unknown as FastifyRequest;
}

describe("twilio.handler", () => {
  it("marks the customer doNotContact on STOP and emits customer.updated", async () => {
    const company = seedCompany({
      name: "Acme HVAC"
    });
    const customer = seedCustomer({
      companyId: company.id,
      firstName: "Chris",
      lastName: "Pine",
      phone: "555-0100",
      doNotContact: false
    });
    const request = createRequest({
      From: "555-0100",
      To: "+15555555555",
      Body: "STOP",
      MessageSid: "SM123"
    });
    const reply = createReply();

    await twilioHandlerModule.twilioHandler(request, reply);

    expect(reply.statusCode).toBe(200);
    expect(reply.contentType).toBe("text/xml");
    expect(state.customers.find((row) => row.id === customer.id)?.doNotContact).toBe(true);
    expect(state.messageLogs).toHaveLength(1);
    expect(state.activityEvents.some((row) => row.eventType === "customer.updated")).toBe(true);
  });

  it("logs non-STOP inbound messages without changing doNotContact", async () => {
    const company = seedCompany({
      name: "Acme HVAC"
    });
    const customer = seedCustomer({
      companyId: company.id,
      firstName: "Chris",
      lastName: "Pine",
      phone: "555-0100",
      doNotContact: false
    });
    const request = createRequest({
      From: "555-0100",
      To: "+15555555555",
      Body: "Can you call me back?",
      MessageSid: "SM124"
    });
    const reply = createReply();

    await twilioHandlerModule.twilioHandler(request, reply);

    expect(reply.statusCode).toBe(200);
    expect(state.customers.find((row) => row.id === customer.id)?.doNotContact).toBe(false);
    expect(state.messageLogs).toHaveLength(1);
    expect(state.activityEvents.some((row) => row.eventType === "customer.updated")).toBe(false);
    expect(state.activityEvents.some((row) => row.eventType === "message.received")).toBe(true);
  });
});
