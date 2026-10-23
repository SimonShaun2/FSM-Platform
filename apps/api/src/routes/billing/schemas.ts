import type { FastifySchema } from "fastify";

export const platformBillingStatusSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        subscribed: { type: "boolean" },
        status: { type: ["string", "null"] },
        stripeCustomerId: { type: ["string", "null"] },
        stripeSubscriptionId: { type: ["string", "null"] },
        currentPeriodEnd: { type: ["string", "null"] },
        checkoutAvailable: { type: "boolean" }
      },
      required: ["enabled", "subscribed", "checkoutAvailable"]
    }
  }
};

export const platformBillingCheckoutSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        url: { type: "string" }
      },
      required: ["url"]
    }
  }
};
