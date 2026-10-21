import { and, desc, eq, isNull } from "drizzle-orm";

import {
  db,
  growthIntakeAuditEvents,
  growthIntakeFindings,
  growthIntakeIdentityCandidates,
  growthIntakeChecks
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

type GrowthCheckRow = typeof growthIntakeChecks.$inferSelect;
type IdentityCandidateRow = typeof growthIntakeIdentityCandidates.$inferSelect;
type FindingRow = typeof growthIntakeFindings.$inferSelect;
type AuditEntityType = typeof growthIntakeAuditEvents.$inferInsert["entityType"];
type AuditAction = typeof growthIntakeAuditEvents.$inferInsert["action"];
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
    growthIntakeCheckId: string | null;
    action: AuditAction;
    actorId: string;
    beforeState: Record<string, unknown> | null;
    afterState: Record<string, unknown> | null;
  }
): Promise<void> {
  await executor.insert(growthIntakeAuditEvents).values({
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    growthIntakeCheckId: input.growthIntakeCheckId,
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
    .from(growthIntakeChecks)
    .where(
      and(eq(growthIntakeChecks.companyId, companyId), eq(growthIntakeChecks.id, growthCheckId), isNull(growthIntakeChecks.deletedAt))
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
    .from(growthIntakeIdentityCandidates)
    .where(
      and(
        eq(growthIntakeIdentityCandidates.companyId, companyId),
        eq(growthIntakeIdentityCandidates.growthIntakeCheckId, growthCheckId),
        eq(growthIntakeIdentityCandidates.id, candidateId),
        isNull(growthIntakeIdentityCandidates.deletedAt)
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
    .from(growthIntakeFindings)
    .where(
      and(
        eq(growthIntakeFindings.companyId, companyId),
        eq(growthIntakeFindings.growthIntakeCheckId, growthCheckId),
        eq(growthIntakeFindings.id, findingId),
        isNull(growthIntakeFindings.deletedAt)
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
  const predicates = [eq(growthIntakeChecks.companyId, companyId), isNull(growthIntakeChecks.deletedAt)];

  if (query.status) {
    predicates.push(eq(growthIntakeChecks.status, query.status));
  }

  if (query.reviewNeeded !== undefined) {
    predicates.push(eq(growthIntakeChecks.reviewNeeded, query.reviewNeeded));
  }

  if (query.ownerUserId) {
    predicates.push(eq(growthIntakeChecks.ownerUserId, query.ownerUserId));
  }

  return db
    .select()
    .from(growthIntakeChecks)
    .where(and(...predicates))
    .orderBy(desc(growthIntakeChecks.updatedAt));
}

export async function getGrowthCheckById(companyId: string, growthCheckId: string): Promise<{
  check: GrowthCheckRow;
  identityCandidates: IdentityCandidateRow[];
  findings: FindingRow[];
}> {
  const check = await getGrowthCheckRecord(companyId, growthCheckId, db);

  const identityCandidates = await db
    .select()
    .from(growthIntakeIdentityCandidates)
    .where(
      and(
        eq(growthIntakeIdentityCandidates.companyId, companyId),
        eq(growthIntakeIdentityCandidates.growthIntakeCheckId, growthCheckId),
        isNull(growthIntakeIdentityCandidates.deletedAt)
      )
    )
    .orderBy(desc(growthIntakeIdentityCandidates.createdAt));

  const findings = await db
    .select()
    .from(growthIntakeFindings)
    .where(
      and(
        eq(growthIntakeFindings.companyId, companyId),
        eq(growthIntakeFindings.growthIntakeCheckId, growthCheckId),
        isNull(growthIntakeFindings.deletedAt)
      )
    )
    .orderBy(desc(growthIntakeFindings.createdAt));

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
      .insert(growthIntakeChecks)
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
      entityType: "growth_intake_check",
      entityId: created.id,
      growthIntakeCheckId: created.id,
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

    const patch: Partial<typeof growthIntakeChecks.$inferInsert> = {
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
        .update(growthIntakeChecks)
        .set(patch)
        .where(and(eq(growthIntakeChecks.companyId, companyId), eq(growthIntakeChecks.id, growthCheckId)))
        .returning(),
      "Failed to update growth check"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_intake_check",
      entityId: updated.id,
      growthIntakeCheckId: updated.id,
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
        .update(growthIntakeChecks)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(and(eq(growthIntakeChecks.companyId, companyId), eq(growthIntakeChecks.id, growthCheckId)))
        .returning(),
      "Failed to delete growth check"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_intake_check",
      entityId: updated.id,
      growthIntakeCheckId: updated.id,
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
        .insert(growthIntakeIdentityCandidates)
        .values({
          companyId,
          growthIntakeCheckId: growthCheckId,
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
      entityType: "growth_intake_identity_candidate",
      entityId: created.id,
      growthIntakeCheckId: growthCheckId,
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

    const patch: Partial<typeof growthIntakeIdentityCandidates.$inferInsert> = {
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
        .update(growthIntakeIdentityCandidates)
        .set(patch)
        .where(
          and(
            eq(growthIntakeIdentityCandidates.companyId, companyId),
            eq(growthIntakeIdentityCandidates.id, candidateId)
          )
        )
        .returning(),
      "Failed to update identity candidate"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_intake_identity_candidate",
      entityId: updated.id,
      growthIntakeCheckId: growthCheckId,
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
        .update(growthIntakeIdentityCandidates)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(
          and(
            eq(growthIntakeIdentityCandidates.companyId, companyId),
            eq(growthIntakeIdentityCandidates.id, candidateId)
          )
        )
        .returning(),
      "Failed to delete identity candidate"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_intake_identity_candidate",
      entityId: updated.id,
      growthIntakeCheckId: growthCheckId,
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
        .insert(growthIntakeFindings)
        .values({
          companyId,
          growthIntakeCheckId: growthCheckId,
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
      entityType: "growth_intake_finding",
      entityId: created.id,
      growthIntakeCheckId: growthCheckId,
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

    const patch: Partial<typeof growthIntakeFindings.$inferInsert> = {
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
        .update(growthIntakeFindings)
        .set(patch)
        .where(and(eq(growthIntakeFindings.companyId, companyId), eq(growthIntakeFindings.id, findingId)))
        .returning(),
      "Failed to update finding"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_intake_finding",
      entityId: updated.id,
      growthIntakeCheckId: growthCheckId,
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
        .update(growthIntakeFindings)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(and(eq(growthIntakeFindings.companyId, companyId), eq(growthIntakeFindings.id, findingId)))
        .returning(),
      "Failed to delete finding"
    );

    await appendAuditEvent(tx, {
      companyId,
      entityType: "growth_intake_finding",
      entityId: updated.id,
      growthIntakeCheckId: growthCheckId,
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
): Promise<Array<typeof growthIntakeAuditEvents.$inferSelect>> {
  const [checkExists] = await db
    .select({ id: growthIntakeChecks.id })
    .from(growthIntakeChecks)
    .where(and(eq(growthIntakeChecks.companyId, companyId), eq(growthIntakeChecks.id, growthCheckId)))
    .limit(1);

  if (!checkExists) {
    throw new AppError(ErrorCode.NOT_FOUND, "Growth check not found");
  }

  return db
    .select()
    .from(growthIntakeAuditEvents)
    .where(and(eq(growthIntakeAuditEvents.companyId, companyId), eq(growthIntakeAuditEvents.growthIntakeCheckId, growthCheckId)))
    .orderBy(desc(growthIntakeAuditEvents.createdAt));
}
