import type { FastifyReply, FastifyRequest } from "fastify";

export async function stripeHandler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const event = request.stripeEvent;

  if (!event) {
    return reply.code(400).send({
      error: "INVALID_STRIPE_EVENT",
      message: "Stripe event was not verified"
    });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "account.updated":
      request.log.info({ eventType: event.type }, "Stripe event received");
      break;
    default:
      request.log.warn({ eventType: event.type }, "Unhandled Stripe event received");
      break;
  }

  return reply.code(200).send({
    received: true
  });
}
