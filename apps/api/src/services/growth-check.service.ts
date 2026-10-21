import { and, desc, eq, isNull } from "drizzle-orm";

import {
  db,
  growthCheckAuditEvents,
  growthCheckFindings,
  growthCheckIdentityCandidates,
  growthChecks
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CreateGrowthCheckFindingInput,
  type CreateGrowthCheckIdentityCandidateInput,
  type CreateGrowthCheckInput,
  type ListGrowthCheckQueueQuery,
  type UpdateGrowthCheckFindingInput,
  type UpdateGrowthCheckIdentityCandidateInput,
  type UpdateGrowthCheckInput
} from "@fsm/types";

type GrowthCheckRow = typeof growthChecks.$inferSelect;
type IdentityCandidateRow = typeof growthCheckIdentityCandidates.$inferSelect;
type FindingRow = typeof growthCheckFindings.$inferSelect;
type AuditEntityType = typeof growthCheckAuditEvents.$inferInsert["entityType"];
type AuditAction = typeof growthCheckAuditEvents.$inferInsert["action"];
type DbExecutor = Pick<typeof db, "select" | "insert" | "update">;

function requireReturningRow<T>(rows: T[], message: string): T {
  const row = rows[0];

  if (!row) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, message);
  }

  return row;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function serializeAuditState(row: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
      continue;
    }

    serialized[key] = value;
  }

  return serialized;
}

async function appendAuditEvent(
  executor: DbExecutor,
  input: {
    companyId: string;
    entityType: AuditEntityType;
    entityId: string;
    growthCheckId: string | null;
    action: AuditAction;
    actorId: string;
    beforeState: Record<string, unknown> | null;
    afterState: Record<string, unknown> | null;
  }
): Promise<void> {
  await executor.insert(growthCheckAuditEvents).values({
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    growthCheckId: input.growthCheckId,
    action: input.action,
    actorId: input.actorId,
    beforeState: input.beforeState,
    afterState: input.afterState
  });
}

async function getGrowthCheckRecord(
  companyId: string,
  growthCheckId: string,
  executor: DbExecutor
): Promise<GrowthCheckRow> {
  const [row] = await executor
    .select()
    .from(growthChecks)
    .where(
      and(eq(growthChecks.companyId, companyId), eq(growthChecks.id, growthCheckId), isNull(growthChecks.deletedAt))
    )
    .limit(1);

  if (!row) {
    throw new AppError(ErrorCode.NOT_FOUND, "Growth check not found");
  }

  return row;
}

async function getIdentityCandidateRecord(
  companyId: string,
  growthCheckId: string,
  candidateId: string,
  executor: DbExecutor
): Promise<IdentityCandidateRow> {
  const [row] = await executor
    .select()
    .from(growthCheckIdentityCandidates)
    .where(
      and(
        eq(growthCheckIdentityCandidates.companyId, companyId),
        eq(growthCheckIdentityCandidates.growthCheckId, growthCheckId),
        eq(growthCheckIdentityCandidates.id, candidateId),
        isNull(growthCheckIdentityCandidates.deletedAt)
      )
    )
    .limit(1);

  if (!row) {
    throw new AppError(ErrorCode.NOT_FOUND, "Identity candidate not found");
  }

  return row;
}

async function getFindingRecord(
  companyId: string,
  growthCheckId: string,
  findingId: string,
  executor: DbExecutor
): Promise<FindingRow> {
  const [row] = await executor
    .select()
    .from(growthCheckFindings)
    .where(
      and(
        eq(growthCheckFindings.companyId, companyId),
        eq(growthCheckFindings.growthCheckId, growthCheckId),
        eq(growthCheckFindings.id, findingId),
        isNull(growthCheckFindings.deletedAt)
      )
    )
    .limit(1);

  if (!row) {
    throw new AppError(ErrorCode.NOT_FOUND, "Finding not found");
  }

  return row;
}

export async function listGrowthCheckQueue(
  companyId: string,
  query: ListGrowthCheckQueueQuery
): Promise<GrowthCheckRow[]> {
  const predicates = [eq(growthChecks.companyId, companyId), isNull(growthChecks.deletedAt)];

  if (query.status) {
    predicates.push(eq(growthChecks.status, query.status));
  }

  if (query.reviewNeeded !== undefined) {
    predicates.push(eq(growthChecks.reviewNeeded, query.reviewNeeded));
  }

  if (query.ownerUserId) {
    predicates.push(eq(growthChecks.ownerUserId, query.ownerUserId));
  }

  return db
    .select()
    .from(growthChecks)
    .where(and(...predicates))
    .orderBy(desc(growthChecks.updatedAt));
}

export async function getGrowthCheckById(companyId: string, growthCheckId: string): Promise<{
  check: GrowthCheckRow;
  identityCandidates: IdentityCandidateRow[];
  findings: FindingRow[];
}> {
  const check = await getGrowthCheckRecord(companyId, growthCheckId, db);

  const identityCandidates = await db
    .select()
    .from(growthCheckIdentityCandidates)
    .where(
      and(
        eq(growthCheckIdentityCandidates.companyId, companyId),
        eq(growthCheckIdentityCandidates.growthCheckId, growthCheckId),
        isNull(growthCheckIdentityCandidates.deletedAt)
      )
    )
    .orderBy(desc(growthCheckIdentityCandidates.createdAt));

  const findings = await db
    .select()
    .from(growthCheckFindings)
    .where(
      and(
        eq(growthCheckFindings.companyId, companyId),
        eq(growthCheckFindings.growthCheckId, growthCheckId),
        isNull(growthCheckFindings.deletedAt)
      )
    )
    .orderBy(desc(growthCheckFindings.createdAt));

  return { check, identityCandidates, findings };
}

export async function createGrowthCheck(
  companyId: string,
  actorId: string,
  input: CreateGrowthCheckInput
): Promise<GrowthCheckRow> {
  return db.transaction(async (tx) => {
    const ownerUserId = input.ownerUserId ?? actorId;
    const status = input.status ?? "queued";

    const created = requireReturningRow(
      await tx
      .insert(growthChecks)
      .values({
        companyId,
        status,
        ownerUserId,
        createdById: actorId,
        reviewNeeded: false,
        businessName: input.businessName.trim(),
        websiteUrl: normalizeOptionalString(input.websiteUrl),
        industry: normalizeOptionalString(input.industry),
        trade: normalizeOptionalString(input.trade),
        city: normalizeOptionalString(input.city),
        state: normalizeOptionalString(input.state),
        zip: normalizeOptionalString(input.zip),
        contactName: normalizeOptionalString(input.contactName),
        contactEmail: normalizeOptionalString(input.contactEmail),
        contactPhone: normalizeOptionalString(input.contactPhone),
        targetMarket: normalizeOptionalString(input.targetMarket),
        googleBusinessProfileUrl: normalizeOptionalString(input.googleBusinessProfileUrl),
        facebookPageUrl: normalizeOptionalString(input.facebookPageUrl),
        intakeNotes: normalizeOptionalString(input.intakeNotes)
      })
      .returning(),
      "Failed to create growth check"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check",
      entityId: created.id,
      growthCheckId: created.id,
      action: "created",
      actorId,
      beforeState: null,
      afterState: serializeAuditState(created as unknown as Record<string, unknown>)
    });

    return created;
  });
}

export async function updateGrowthCheck(
  companyId: string,
  actorId: string,
  growthCheckId: string,
  input: UpdateGrowthCheckInput
): Promise<GrowthCheckRow> {
  return db.transaction(async (tx) => {
    const existing = await getGrowthCheckRecord(companyId, growthCheckId, tx);

    const patch: Partial<typeof growthChecks.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.status !== undefined) {
      patch.status = input.status;
    }
    if (input.ownerUserId !== undefined) {
      patch.ownerUserId = input.ownerUserId;
    }
    if (input.reviewNeeded !== undefined) {
      patch.reviewNeeded = input.reviewNeeded;
    }
    if (input.lastScanAt !== undefined) {
      patch.lastScanAt = input.lastScanAt ? new Date(input.lastScanAt) : null;
    }
    if (input.businessName !== undefined) {
      patch.businessName = input.businessName.trim();
    }
    if (input.websiteUrl !== undefined) {
      patch.websiteUrl = normalizeOptionalString(input.websiteUrl);
    }
    if (input.industry !== undefined) {
      patch.industry = normalizeOptionalString(input.industry);
    }
    if (input.trade !== undefined) {
      patch.trade = normalizeOptionalString(input.trade);
    }
    if (input.city !== undefined) {
      patch.city = normalizeOptionalString(input.city);
    }
    if (input.state !== undefined) {
      patch.state = normalizeOptionalString(input.state);
    }
    if (input.zip !== undefined) {
      patch.zip = normalizeOptionalString(input.zip);
    }
    if (input.contactName !== undefined) {
      patch.contactName = normalizeOptionalString(input.contactName);
    }
    if (input.contactEmail !== undefined) {
      patch.contactEmail = normalizeOptionalString(input.contactEmail);
    }
    if (input.contactPhone !== undefined) {
      patch.contactPhone = normalizeOptionalString(input.contactPhone);
    }
    if (input.targetMarket !== undefined) {
      patch.targetMarket = normalizeOptionalString(input.targetMarket);
    }
    if (input.googleBusinessProfileUrl !== undefined) {
      patch.googleBusinessProfileUrl = normalizeOptionalString(input.googleBusinessProfileUrl);
    }
    if (input.facebookPageUrl !== undefined) {
      patch.facebookPageUrl = normalizeOptionalString(input.facebookPageUrl);
    }
    if (input.intakeNotes !== undefined) {
      patch.intakeNotes = normalizeOptionalString(input.intakeNotes);
    }

    const updated = requireReturningRow(
      await tx
        .update(growthChecks)
        .set(patch)
        .where(and(eq(growthChecks.companyId, companyId), eq(growthChecks.id, growthCheckId)))
        .returning(),
      "Failed to update growth check"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check",
      entityId: updated.id,
      growthCheckId: updated.id,
      action: "updated",
      actorId,
      beforeState: serializeAuditState(existing as unknown as Record<string, unknown>),
      afterState: serializeAuditState(updated as unknown as Record<string, unknown>)
    });

    return updated;
  });
}

export async function softDeleteGrowthCheck(
  companyId: string,
  actorId: string,
  growthCheckId: string
): Promise<GrowthCheckRow> {
  return db.transaction(async (tx) => {
    const existing = await getGrowthCheckRecord(companyId, growthCheckId, tx);
    const deletedAt = new Date();

    const updated = requireReturningRow(
      await tx
        .update(growthChecks)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(and(eq(growthChecks.companyId, companyId), eq(growthChecks.id, growthCheckId)))
        .returning(),
      "Failed to delete growth check"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check",
      entityId: updated.id,
      growthCheckId: updated.id,
      action: "deleted",
      actorId,
      beforeState: serializeAuditState(existing as unknown as Record<string, unknown>),
      afterState: serializeAuditState(updated as unknown as Record<string, unknown>)
    });

    return updated;
  });
}

export async function createGrowthCheckIdentityCandidate(
  companyId: string,
  actorId: string,
  growthCheckId: string,
  input: CreateGrowthCheckIdentityCandidateInput
): Promise<IdentityCandidateRow> {
  return db.transaction(async (tx) => {
    await getGrowthCheckRecord(companyId, growthCheckId, tx);

    const created = requireReturningRow(
      await tx
        .insert(growthCheckIdentityCandidates)
        .values({
          companyId,
          growthCheckId,
          displayName: input.displayName.trim(),
          domain: normalizeOptionalString(input.domain),
          source: input.source ?? "manual",
          confidenceScore:
            input.confidenceScore === undefined || input.confidenceScore === null
              ? null
              : String(input.confidenceScore),
          isPrimary: input.isPrimary ?? false,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "Failed to create identity candidate"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check_identity_candidate",
      entityId: created.id,
      growthCheckId,
      action: "created",
      actorId,
      beforeState: null,
      afterState: serializeAuditState(created as unknown as Record<string, unknown>)
    });

    return created;
  });
}

export async function updateGrowthCheckIdentityCandidate(
  companyId: string,
  actorId: string,
  growthCheckId: string,
  candidateId: string,
  input: UpdateGrowthCheckIdentityCandidateInput
): Promise<IdentityCandidateRow> {
  return db.transaction(async (tx) => {
    const existing = await getIdentityCandidateRecord(companyId, growthCheckId, candidateId, tx);

    const patch: Partial<typeof growthCheckIdentityCandidates.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.displayName !== undefined) {
      patch.displayName = input.displayName.trim();
    }
    if (input.domain !== undefined) {
      patch.domain = normalizeOptionalString(input.domain);
    }
    if (input.source !== undefined) {
      patch.source = input.source;
    }
    if (input.confidenceScore !== undefined) {
      patch.confidenceScore =
        input.confidenceScore === null ? null : String(input.confidenceScore);
    }
    if (input.isPrimary !== undefined) {
      patch.isPrimary = input.isPrimary;
    }
    if (input.metadata !== undefined) {
      patch.metadata = input.metadata;
    }

    const updated = requireReturningRow(
      await tx
        .update(growthCheckIdentityCandidates)
        .set(patch)
        .where(
          and(
            eq(growthCheckIdentityCandidates.companyId, companyId),
            eq(growthCheckIdentityCandidates.id, candidateId)
          )
        )
        .returning(),
      "Failed to update identity candidate"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check_identity_candidate",
      entityId: updated.id,
      growthCheckId,
      action: "updated",
      actorId,
      beforeState: serializeAuditState(existing as unknown as Record<string, unknown>),
      afterState: serializeAuditState(updated as unknown as Record<string, unknown>)
    });

    return updated;
  });
}

export async function softDeleteGrowthCheckIdentityCandidate(
  companyId: string,
  actorId: string,
  growthCheckId: string,
  candidateId: string
): Promise<IdentityCandidateRow> {
  return db.transaction(async (tx) => {
    const existing = await getIdentityCandidateRecord(companyId, growthCheckId, candidateId, tx);
    const deletedAt = new Date();

    const updated = requireReturningRow(
      await tx
        .update(growthCheckIdentityCandidates)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(
          and(
            eq(growthCheckIdentityCandidates.companyId, companyId),
            eq(growthCheckIdentityCandidates.id, candidateId)
          )
        )
        .returning(),
      "Failed to delete identity candidate"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check_identity_candidate",
      entityId: updated.id,
      growthCheckId,
      action: "deleted",
      actorId,
      beforeState: serializeAuditState(existing as unknown as Record<string, unknown>),
      afterState: serializeAuditState(updated as unknown as Record<string, unknown>)
    });

    return updated;
  });
}

export async function createGrowthCheckFinding(
  companyId: string,
  actorId: string,
  growthCheckId: string,
  input: CreateGrowthCheckFindingInput
): Promise<FindingRow> {
  return db.transaction(async (tx) => {
    await getGrowthCheckRecord(companyId, growthCheckId, tx);

    const created = requireReturningRow(
      await tx
        .insert(growthCheckFindings)
        .values({
          companyId,
          growthCheckId,
          category: input.category.trim(),
          severity: input.severity ?? "info",
          status: input.status ?? "open",
          title: input.title.trim(),
          description: normalizeOptionalString(input.description),
          recommendation: normalizeOptionalString(input.recommendation),
          evidence: input.evidence ?? {}
        })
        .returning(),
      "Failed to create finding"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check_finding",
      entityId: created.id,
      growthCheckId,
      action: "created",
      actorId,
      beforeState: null,
      afterState: serializeAuditState(created as unknown as Record<string, unknown>)
    });

    return created;
  });
}

export async function updateGrowthCheckFinding(
  companyId: string,
  actorId: string,
  growthCheckId: string,
  findingId: string,
  input: UpdateGrowthCheckFindingInput
): Promise<FindingRow> {
  return db.transaction(async (tx) => {
    const existing = await getFindingRecord(companyId, growthCheckId, findingId, tx);

    const patch: Partial<typeof growthCheckFindings.$inferInsert> = {
      updatedAt: new Date()
    };

    if (input.category !== undefined) {
      patch.category = input.category.trim();
    }
    if (input.severity !== undefined) {
      patch.severity = input.severity;
    }
    if (input.status !== undefined) {
      patch.status = input.status;
    }
    if (input.title !== undefined) {
      patch.title = input.title.trim();
    }
    if (input.description !== undefined) {
      patch.description = normalizeOptionalString(input.description);
    }
    if (input.recommendation !== undefined) {
      patch.recommendation = normalizeOptionalString(input.recommendation);
    }
    if (input.evidence !== undefined) {
      patch.evidence = input.evidence;
    }

    const updated = requireReturningRow(
      await tx
        .update(growthCheckFindings)
        .set(patch)
        .where(and(eq(growthCheckFindings.companyId, companyId), eq(growthCheckFindings.id, findingId)))
        .returning(),
      "Failed to update finding"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check_finding",
      entityId: updated.id,
      growthCheckId,
      action: "updated",
      actorId,
      beforeState: serializeAuditState(existing as unknown as Record<string, unknown>),
      afterState: serializeAuditState(updated as unknown as Record<string, unknown>)
    });

    return updated;
  });
}

export async function softDeleteGrowthCheckFinding(
  companyId: string,
  actorId: string,
  growthCheckId: string,
  findingId: string
): Promise<FindingRow> {
  return db.transaction(async (tx) => {
    const existing = await getFindingRecord(companyId, growthCheckId, findingId, tx);
    const deletedAt = new Date();

    const updated = requireReturningRow(
      await tx
        .update(growthCheckFindings)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(and(eq(growthCheckFindings.companyId, companyId), eq(growthCheckFindings.id, findingId)))
        .returning(),
      "Failed to delete finding"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_check_finding",
      entityId: updated.id,
      growthCheckId,
      action: "deleted",
      actorId,
      beforeState: serializeAuditState(existing as unknown as Record<string, unknown>),
      afterState: serializeAuditState(updated as unknown as Record<string, unknown>)
    });

    return updated;
  });
}

export async function listGrowthCheckAuditEvents(
  companyId: string,
  growthCheckId: string
): Promise<Array<typeof growthCheckAuditEvents.$inferSelect>> {
  const [checkExists] = await db
    .select({ id: growthChecks.id })
    .from(growthChecks)
    .where(and(eq(growthChecks.companyId, companyId), eq(growthChecks.id, growthCheckId)))
    .limit(1);

  if (!checkExists) {
    throw new AppError(ErrorCode.NOT_FOUND, "Growth check not found");
  }

  return db
    .select()
    .from(growthCheckAuditEvents)
    .where(and(eq(growthCheckAuditEvents.companyId, companyId), eq(growthCheckAuditEvents.growthCheckId, growthCheckId)))
    .orderBy(desc(growthCheckAuditEvents.createdAt));
}
