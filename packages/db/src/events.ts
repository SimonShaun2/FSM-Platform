import { db } from "./client.js";
import { activityEvents } from "./schema.js";

type ActivityEventInsert = typeof activityEvents.$inferInsert;
type EventExecutor = Pick<typeof db, "insert">;

export interface EmitEventContext {
  companyId: ActivityEventInsert["companyId"];
  eventType: ActivityEventInsert["eventType"];
  actorId?: ActivityEventInsert["actorId"];
  actorType?: ActivityEventInsert["actorType"];
  actorName?: ActivityEventInsert["actorName"];
  entityType: ActivityEventInsert["entityType"];
  entityId: ActivityEventInsert["entityId"];
  customerId?: ActivityEventInsert["customerId"];
  jobId?: ActivityEventInsert["jobId"];
  estimateId?: ActivityEventInsert["estimateId"];
  invoiceId?: ActivityEventInsert["invoiceId"];
  payload?: ActivityEventInsert["payload"];
  summary: ActivityEventInsert["summary"];
  occurredAt?: ActivityEventInsert["occurredAt"];
}

function resolveEmitEventContext(
  eventOrContext: EmitEventContext | NonNullable<ActivityEventInsert["eventType"]>,
  maybeContext?: Omit<EmitEventContext, "eventType">
): EmitEventContext {
  if (typeof eventOrContext === "string") {
    if (!maybeContext) {
      throw new Error("EmitEventContext is required when eventType is passed separately");
    }

    return {
      ...maybeContext,
      eventType: eventOrContext
    };
  }

  return eventOrContext;
}

async function writeActivityEvent(executor: EventExecutor, resolvedContext: EmitEventContext): Promise<void> {
  await executor.insert(activityEvents).values({
    companyId: resolvedContext.companyId,
    eventType: resolvedContext.eventType,
    actorId: resolvedContext.actorId,
    actorType: resolvedContext.actorType,
    actorName: resolvedContext.actorName,
    entityType: resolvedContext.entityType,
    entityId: resolvedContext.entityId,
    customerId: resolvedContext.customerId,
    jobId: resolvedContext.jobId,
    estimateId: resolvedContext.estimateId,
    invoiceId: resolvedContext.invoiceId,
    payload: resolvedContext.payload ?? {},
    summary: resolvedContext.summary,
    occurredAt: resolvedContext.occurredAt
  });
}

export async function emitEvent(ctx: EmitEventContext): Promise<void>;
export async function emitEvent(
  eventType: NonNullable<ActivityEventInsert["eventType"]>,
  ctx: Omit<EmitEventContext, "eventType">
): Promise<void>;
export async function emitEvent(
  eventOrContext: EmitEventContext | NonNullable<ActivityEventInsert["eventType"]>,
  maybeContext?: Omit<EmitEventContext, "eventType">
): Promise<void> {
  await writeActivityEvent(db, resolveEmitEventContext(eventOrContext, maybeContext));
}

export async function emitEventWithExecutor(executor: EventExecutor, ctx: EmitEventContext): Promise<void>;
export async function emitEventWithExecutor(
  executor: EventExecutor,
  eventType: NonNullable<ActivityEventInsert["eventType"]>,
  ctx: Omit<EmitEventContext, "eventType">
): Promise<void>;
export async function emitEventWithExecutor(
  executor: EventExecutor,
  eventOrContext: EmitEventContext | NonNullable<ActivityEventInsert["eventType"]>,
  maybeContext?: Omit<EmitEventContext, "eventType">
): Promise<void> {
  await writeActivityEvent(executor, resolveEmitEventContext(eventOrContext, maybeContext));
}
