import type { FastifyReply, FastifyRequest } from "fastify";
import Stripe from "stripe";

import { env } from "@fsm/config";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

declare module "fastify" {
  interface FastifyRequest {
    stripeEvent?: Stripe.Event;
    twilioParams?: Record<string, string>;
  }
}

function getRawBody(body: unknown): Buffer {
  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (typeof body === "string") {
    return Buffer.from(body);
  }

  return Buffer.from("");
}

export async function stripeVerify(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const signature = request.headers["stripe-signature"];

  if (typeof signature !== "string") {
    reply.code(400).send({
      error: "INVALID_STRIPE_SIGNATURE",
      message: "Missing Stripe signature"
    });
    return;
  }

  try {
    request.stripeEvent = stripe.webhooks.constructEvent(getRawBody(request.body), signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    request.log.warn({ err: error }, "Stripe signature verification failed");
    reply.code(400).send({
      error: "INVALID_STRIPE_SIGNATURE",
      message: "Invalid Stripe signature"
    });
  }
}
