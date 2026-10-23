import { and, desc, eq, isNull } from "drizzle-orm";

import { EMAIL_TEMPLATE_IDS } from "@fsm/comms";
import { env } from "@fsm/config";
import {
  companies,
  customers,
  db,
  emitEvent,
  importBundles,
  savedCardMigrations
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type ApplySavedCardMigrationMappingsBody,
  type ConfirmStripeImportBody,
  type InternalAdminListSavedCardMigrationsQuery,
  type SavedCardMigration,
  type SavedCardMigrationCustomerMapping,
  type SavedCardMigrationMappingSummary,
  type SavedCardMigrationStatus,
  type StartSavedCardMigrationBody,
  savedCardMigrationCustomerMappingSchema,
  savedCardMigrationMappingSummarySchema
} from "@fsm/types";

import { sendRenderedTemplateEmail } from "../lib/outbound-email.js";
import {
  attachImportedPaymentMethodToCustomer,
  assertStripeTestModeForCardMigration,
  RENVANI_STRIPE_PAN_IMPORT_DOCS_URL
} from "../lib/stripe-saved-card-import.adapter.js";

type MigrationRow = typeof savedCardMigrations.$inferSelect;

function requireMigrationRow(row: MigrationRow | undefined, message: string): MigrationRow {
  if (!row) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, message);
  }
  return row;
}

function parseMappingSummary(value: unknown): SavedCardMigrationMappingSummary {
  const parsed = savedCardMigrationMappingSummarySchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  return { matched: 0, unmatched: 0, failed: 0, total: 0 };
}

function parseCustomerMappings(value: unknown): SavedCardMigrationCustomerMapping[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: SavedCardMigrationCustomerMapping[] = [];
  for (const entry of value) {
    const parsed = savedCardMigrationCustomerMappingSchema.safeParse(entry);
    if (parsed.success) {
      rows.push(parsed.data);
    }
  }
  return rows;
}

function toMigrationResponse(row: MigrationRow): SavedCardMigration {
  return {
    id: row.id,
    companyId: row.companyId,
    importBundleId: row.importBundleId,
    status: row.status as SavedCardMigrationStatus,
    priorProcessorName: row.priorProcessorName,
    stripeImportReference: row.stripeImportReference,
    mappingSummary: parseMappingSummary(row.mappingSummary),
    customerMappings: parseCustomerMappings(row.customerMappings),
    lastError: row.lastError,
    fallbackEmailSentAt: row.fallbackEmailSentAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    stripePanImportInstructionsUrl: RENVANI_STRIPE_PAN_IMPORT_DOCS_URL
  };
}

async function getScopedMigration(companyId: string, migrationId: string): Promise<MigrationRow> {
  const [row] = await db
    .select()
    .from(savedCardMigrations)
    .where(
      and(
        eq(savedCardMigrations.id, migrationId),
        eq(savedCardMigrations.companyId, companyId),
        isNull(savedCardMigrations.deletedAt)
      )
    )
    .limit(1);

  if (!row) {
    throw new AppError(ErrorCode.NOT_FOUND, "Saved card migration not found");
  }

  return row;
}

async function getScopedBundle(companyId: string, bundleId: string) {
  const [bundle] = await db
    .select()
    .from(importBundles)
    .where(
      and(eq(importBundles.id, bundleId), eq(importBundles.companyId, companyId), isNull(importBundles.deletedAt))
    )
    .limit(1);

  if (!bundle) {
    throw new AppError(ErrorCode.NOT_FOUND, "Onboarding bundle not found");
  }

  return bundle;
}

async function syncWizardRef(
  companyId: string,
  bundleId: string,
  migrationId: string,
  status: SavedCardMigrationStatus
): Promise<void> {
  const bundle = await getScopedBundle(companyId, bundleId);
  const stepState =
    typeof bundle.stepState === "object" && bundle.stepState !== null && !Array.isArray(bundle.stepState)
      ? { ...(bundle.stepState as Record<string, unknown>) }
      : {};

  stepState.savedCardMigration = {
    migrationId,
    status,
    updatedAt: new Date().toISOString()
  };

  await db
    .update(importBundles)
    .set({ stepState, updatedAt: new Date() })
    .where(and(eq(importBundles.id, bundleId), eq(importBundles.companyId, companyId)));
}

async function requireCompanyStripeConnect(companyId: string): Promise<string> {
  const [company] = await db
    .select({ stripeAccountId: companies.stripeAccountId })
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company?.stripeAccountId) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Connect Stripe before starting saved card migration");
  }

  return company.stripeAccountId;
}

export async function startSavedCardMigrationForBundle(
  companyId: string,
  actorId: string,
  bundleId: string,
  input: StartSavedCardMigrationBody
): Promise<SavedCardMigration> {
  assertStripeTestModeForCardMigration();
  await getScopedBundle(companyId, bundleId);
  await requireCompanyStripeConnect(companyId);

  const now = new Date();
  const [createdRow] = await db
    .insert(savedCardMigrations)
    .values({
      companyId,
      importBundleId: bundleId,
      createdById: actorId,
      status: "awaiting_stripe_import",
      priorProcessorName: input.priorProcessorName,
      stripeImportReference: input.stripeImportReference ?? null,
      mappingSummary: { matched: 0, unmatched: 0, failed: 0, total: 0 },
      customerMappings: [],
      updatedAt: now
    })
    .returning();

  const created = requireMigrationRow(createdRow, "Failed to create saved card migration");

  await syncWizardRef(companyId, bundleId, created.id, created.status as SavedCardMigrationStatus);

  await emitEvent({
    eventType: "payment_method_migration.requested",
    companyId,
    actorId,
    actorType: "user",
    entityType: "saved_card_migration",
    entityId: created.id,
    summary: `Saved card migration requested from ${input.priorProcessorName}`,
    payload: {
      importBundleId: bundleId,
      priorProcessorName: input.priorProcessorName,
      stripeImportReference: input.stripeImportReference ?? null
    }
  });

  return toMigrationResponse(created);
}

export async function getSavedCardMigrationForBundle(
  companyId: string,
  bundleId: string
): Promise<SavedCardMigration | null> {
  const rows = await db
    .select()
    .from(savedCardMigrations)
    .where(
      and(
        eq(savedCardMigrations.companyId, companyId),
        eq(savedCardMigrations.importBundleId, bundleId),
        isNull(savedCardMigrations.deletedAt)
      )
    )
    .orderBy(desc(savedCardMigrations.createdAt));

  const row = rows[0];
  return row ? toMigrationResponse(row) : null;
}

export async function confirmStripeImportForBundle(
  companyId: string,
  actorId: string,
  bundleId: string,
  input: ConfirmStripeImportBody
): Promise<SavedCardMigration> {
  assertStripeTestModeForCardMigration();
  const migration = await getSavedCardMigrationForBundle(companyId, bundleId);
  if (!migration) {
    throw new AppError(ErrorCode.NOT_FOUND, "No saved card migration for this bundle");
  }

  const now = new Date();
  const [updatedRow] = await db
    .update(savedCardMigrations)
    .set({
      status: "mapping",
      stripeImportReference: input.stripeImportReference,
      updatedAt: now
    })
    .where(and(eq(savedCardMigrations.id, migration.id), eq(savedCardMigrations.companyId, companyId)))
    .returning();

  const updated = requireMigrationRow(updatedRow, "Failed to update saved card migration");

  await syncWizardRef(companyId, bundleId, updated.id, "mapping");

  await emitEvent({
    eventType: "payment_method_migration.mappings_applied",
    companyId,
    actorId,
    actorType: "user",
    entityType: "saved_card_migration",
    entityId: updated.id,
    summary: "Stripe card import confirmed; ready to map payment methods",
    payload: { stripeImportReference: input.stripeImportReference }
  });

  return toMigrationResponse(updated);
}

async function resolveRenvaniCustomer(
  companyId: string,
  renvaniCustomerId?: string,
  email?: string
): Promise<{ id: string; email: string | null; stripeCustomerId: string | null } | null> {
  if (renvaniCustomerId) {
    const [byId] = await db
      .select({
        id: customers.id,
        email: customers.email,
        stripeCustomerId: customers.stripeCustomerId
      })
      .from(customers)
      .where(
        and(eq(customers.id, renvaniCustomerId), eq(customers.companyId, companyId), isNull(customers.deletedAt))
      )
      .limit(1);
    if (byId) {
      return byId;
    }
  }

  if (email) {
    const normalized = email.trim().toLowerCase();
    const candidates = await db
      .select({
        id: customers.id,
        email: customers.email,
        stripeCustomerId: customers.stripeCustomerId
      })
      .from(customers)
      .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)));

    const byEmail = candidates.find((row) => (row.email ?? "").trim().toLowerCase() === normalized);
    if (byEmail) {
      return byEmail;
    }
  }

  return null;
}

export async function applySavedCardMigrationMappingsForBundle(
  companyId: string,
  actorId: string,
  bundleId: string,
  input: ApplySavedCardMigrationMappingsBody
): Promise<SavedCardMigration> {
  assertStripeTestModeForCardMigration();
  const existing = await getSavedCardMigrationForBundle(companyId, bundleId);
  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "No saved card migration for this bundle");
  }
  if (existing.status !== "mapping" && existing.status !== "fallback_required") {
    throw new AppError(ErrorCode.CONFLICT, "Migration is not in a mappable state");
  }

  const stripeConnectAccountId = await requireCompanyStripeConnect(companyId);
  const mappings: SavedCardMigrationCustomerMapping[] = [];
  let matched = 0;
  let unmatched = 0;
  let failed = 0;

  for (const row of input.rows) {
    const customer = await resolveRenvaniCustomer(companyId, row.renvaniCustomerId, row.email);
    if (!customer) {
      unmatched += 1;
      mappings.push({
        renvaniCustomerId: row.renvaniCustomerId ?? null,
        email: row.email ?? null,
        stripeCustomerId: row.stripeCustomerId,
        stripePaymentMethodId: row.stripePaymentMethodId,
        matchMethod: "unmatched",
        status: "fallback_required"
      });
      continue;
    }

    const matchMethod = row.renvaniCustomerId ? "renvani_customer_id" : "email";

    try {
      const attachResult = await attachImportedPaymentMethodToCustomer({
        stripeConnectAccountId,
        stripeCustomerId: row.stripeCustomerId,
        stripePaymentMethodId: row.stripePaymentMethodId,
        renvaniCustomerId: customer.id,
        companyId
      });

      if (customer.stripeCustomerId !== row.stripeCustomerId) {
        await db
          .update(customers)
          .set({ stripeCustomerId: row.stripeCustomerId, updatedAt: new Date() })
          .where(and(eq(customers.id, customer.id), eq(customers.companyId, companyId)));
      }

      matched += 1;
      mappings.push({
        renvaniCustomerId: customer.id,
        email: customer.email,
        stripeCustomerId: row.stripeCustomerId,
        stripePaymentMethodId: row.stripePaymentMethodId,
        matchMethod,
        status: "attached",
        paymentMethodLabel: attachResult.paymentMethodLabel
      });
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Attach failed";
      mappings.push({
        renvaniCustomerId: customer.id,
        email: customer.email,
        stripeCustomerId: row.stripeCustomerId,
        stripePaymentMethodId: row.stripePaymentMethodId,
        matchMethod,
        status: "failed",
        errorMessage: message
      });
    }
  }

  const summary: SavedCardMigrationMappingSummary = {
    matched,
    unmatched,
    failed,
    total: input.rows.length
  };

  const nextStatus: SavedCardMigrationStatus =
    unmatched > 0 || failed > 0 ? "fallback_required" : "completed";

  const now = new Date();
  const [updatedRow] = await db
    .update(savedCardMigrations)
    .set({
      status: nextStatus,
      mappingSummary: summary,
      customerMappings: mappings,
      completedAt: nextStatus === "completed" ? now : null,
      updatedAt: now
    })
    .where(and(eq(savedCardMigrations.id, existing.id), eq(savedCardMigrations.companyId, companyId)))
    .returning();

  const updated = requireMigrationRow(updatedRow, "Failed to apply saved card migration mappings");

  await syncWizardRef(companyId, bundleId, updated.id, nextStatus);

  await emitEvent({
    eventType: nextStatus === "completed" ? "payment_method_migration.completed" : "payment_method_migration.mappings_applied",
    companyId,
    actorId,
    actorType: "user",
    entityType: "saved_card_migration",
    entityId: updated.id,
    summary: `Saved card migration mappings applied (${summary.matched}/${summary.total} attached)`,
    payload: { mappingSummary: summary }
  });

  return toMigrationResponse(updated);
}

export async function sendSavedCardMigrationFallbackEmail(
  companyId: string,
  actorId: string,
  bundleId: string,
  renvaniCustomerId: string
): Promise<SavedCardMigration> {
  assertStripeTestModeForCardMigration();
  const migration = await getSavedCardMigrationForBundle(companyId, bundleId);
  if (!migration) {
    throw new AppError(ErrorCode.NOT_FOUND, "No saved card migration for this bundle");
  }

  const [customer] = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName
    })
    .from(customers)
    .where(
      and(eq(customers.id, renvaniCustomerId), eq(customers.companyId, companyId), isNull(customers.deletedAt))
    )
    .limit(1);

  if (!customer?.email) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Customer email is required to send fallback message");
  }

  const [company] = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  const paymentPortalUrl = `${env.APP_URL}/pay`;

  await sendRenderedTemplateEmail(
    customer.email,
    EMAIL_TEMPLATE_IDS.savedCardMigrationReenterCard,
    {
      firstName: customer.firstName ?? "",
      companyName: company?.name ?? "Your service provider",
      paymentPortalUrl
    },
    ["saved-card-migration", "fallback"]
  );

  const now = new Date();
  const [updatedRow] = await db
    .update(savedCardMigrations)
    .set({ fallbackEmailSentAt: now, updatedAt: now })
    .where(and(eq(savedCardMigrations.id, migration.id), eq(savedCardMigrations.companyId, companyId)))
    .returning();

  const updated = requireMigrationRow(updatedRow, "Failed to record fallback email");

  await emitEvent({
    eventType: "payment_method_migration.fallback_sent",
    companyId,
    actorId,
    actorType: "user",
    entityType: "saved_card_migration",
    entityId: updated.id,
    customerId: renvaniCustomerId,
    summary: "Re-enter card fallback email sent",
    payload: { renvaniCustomerId }
  });

  return toMigrationResponse(updated);
}

export async function getSavedCardMigrationByIdForAdmin(
  migrationId: string
): Promise<SavedCardMigration> {
  const [row] = await db
    .select()
    .from(savedCardMigrations)
    .where(and(eq(savedCardMigrations.id, migrationId), isNull(savedCardMigrations.deletedAt)))
    .limit(1);

  if (!row) {
    throw new AppError(ErrorCode.NOT_FOUND, "Saved card migration not found");
  }

  return toMigrationResponse(row);
}

export async function listSavedCardMigrationsForAdmin(
  query: InternalAdminListSavedCardMigrationsQuery
): Promise<{ items: SavedCardMigration[]; total: number }> {
  const conditions = [isNull(savedCardMigrations.deletedAt)];
  if (query.companyId) {
    conditions.push(eq(savedCardMigrations.companyId, query.companyId));
  }
  if (query.status) {
    conditions.push(eq(savedCardMigrations.status, query.status));
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select()
    .from(savedCardMigrations)
    .where(whereClause)
    .orderBy(desc(savedCardMigrations.createdAt));

  const total = rows.length;
  const page = rows.slice(query.offset, query.offset + query.limit);

  return {
    items: page.map(toMigrationResponse),
    total
  };
}
