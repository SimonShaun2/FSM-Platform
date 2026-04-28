import { randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import type { Job, Processor } from "bullmq";
import Papa from "papaparse";
import pino from "pino";

import { mapCsvColumns } from "@fsm/ai";
import { downloadFile, getFileKeyFromUrl } from "@fsm/config/storage";
import {
  customers,
  db,
  emitEventWithExecutor,
  importSessions,
  properties
} from "@fsm/db";
import { aiQueue } from "@fsm/jobs";
import type { ColumnMapping, ValidationError } from "@fsm/types";

type ImportSessionRow = typeof importSessions.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;
type CustomerInsert = typeof customers.$inferInsert;
type PropertyInsert = typeof properties.$inferInsert;

interface ParsedCsvRow {
  rowNumber: number;
  values: Record<string, string>;
}

interface CustomerImportRow {
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  altPhone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  tags: string[];
}

interface ValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  validationErrors: ValidationError[];
}

const logger = pino({
  name: "csv-import-processor"
});

const IMPORT_BATCH_SIZE = 100;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeColumnMappings(value: unknown): ColumnMapping {
  if (!isPlainObject(value)) {
    return {};
  }

  const mapping: ColumnMapping = {};

  for (const [key, entryValue] of Object.entries(value)) {
    if (typeof entryValue === "string" || entryValue === null) {
      mapping[key] = entryValue;
    }
  }

  return mapping;
}

function normalizeValidationErrors(value: unknown): ValidationError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const validationErrors: ValidationError[] = [];

  for (const entry of value) {
    if (!isPlainObject(entry)) {
      continue;
    }

    if (
      typeof entry.row === "number" &&
      typeof entry.field === "string" &&
      typeof entry.message === "string" &&
      typeof entry.value === "string"
    ) {
      validationErrors.push({
        row: entry.row,
        field: entry.field,
        message: entry.message,
        value: entry.value
      });
    }
  }

  return validationErrors;
}

function buildEmptyMapping(headers: string[]): ColumnMapping {
  return Object.fromEntries(headers.map((header) => [header, null]));
}

function normalizeTextValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeEmailValue(value: string | null | undefined): string | null {
  const normalizedValue = normalizeTextValue(value);
  return normalizedValue ? normalizedValue.toLowerCase() : null;
}

function normalizePhoneValue(value: string | null | undefined): string | null {
  const normalizedValue = normalizeTextValue(value);

  if (!normalizedValue) {
    return null;
  }

  const digitsOnly = normalizedValue.replace(/\D+/gu, "");
  return digitsOnly.length > 0 ? digitsOnly : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

function parseCsv(buffer: Buffer): { headers: string[]; rows: ParsedCsvRow[] } {
  const csvText = buffer.toString("utf8").replace(/^\uFEFF/u, "");
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true
  });
  const headers = (result.meta.fields ?? []).map((header) => header.trim());
  const rows: ParsedCsvRow[] = [];

  for (let index = 0; index < result.data.length; index += 1) {
    const sourceRow = result.data[index];
    const normalizedRow: Record<string, string> = {};

    for (const header of headers) {
      const rawValue = sourceRow?.[header];
      normalizedRow[header] = typeof rawValue === "string" ? rawValue.trim() : "";
    }

    rows.push({
      rowNumber: index + 2,
      values: normalizedRow
    });
  }

  return {
    headers,
    rows
  };
}

function mapCustomerRow(values: Record<string, string>, columnMapping: ColumnMapping): CustomerImportRow {
  const mappedValues: Record<string, string> = {};

  for (const [csvColumn, fieldName] of Object.entries(columnMapping)) {
    if (typeof fieldName !== "string" || fieldName.length === 0) {
      continue;
    }

    mappedValues[fieldName] = values[csvColumn] ?? "";
  }

  const firstName = normalizeTextValue(mappedValues.firstName);
  const lastName = normalizeTextValue(mappedValues.lastName);
  const displayName = normalizeTextValue(mappedValues.displayName);

  return {
    firstName: firstName ?? (displayName ?? ""),
    lastName: lastName ?? "",
    displayName,
    email: normalizeEmailValue(mappedValues.email),
    phone: normalizeTextValue(mappedValues.phone),
    altPhone: normalizeTextValue(mappedValues.altPhone),
    addressLine1: normalizeTextValue(mappedValues.addressLine1),
    city: normalizeTextValue(mappedValues.city),
    state: normalizeTextValue(mappedValues.state),
    zip: normalizeTextValue(mappedValues.zip),
    notes: normalizeTextValue(mappedValues.notes),
    tags: normalizeTextValue(mappedValues.tags)
      ?.split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0) ?? []
  };
}

function validateCustomerRows(rows: ParsedCsvRow[], columnMapping: ColumnMapping, existingCustomers: CustomerRow[]): ValidationResult {
  const validationErrors: ValidationError[] = [];
  const rowErrors = new Set<number>();
  let duplicateRows = 0;
  const emailSet = new Set(
    existingCustomers
      .map((customer) => normalizeEmailValue(customer.email))
      .filter((value): value is string => value !== null)
  );
  const phoneSet = new Set(
    existingCustomers
      .map((customer) => normalizePhoneValue(customer.phone))
      .filter((value): value is string => value !== null)
  );

  for (const row of rows) {
    const mappedRow = mapCustomerRow(row.values, columnMapping);
    const hasDisplayName = mappedRow.displayName !== null;
    const hasFirstAndLastName = mappedRow.firstName.length > 0 && mappedRow.lastName.length > 0;

    if (!hasDisplayName && !hasFirstAndLastName) {
      validationErrors.push({
        row: row.rowNumber,
        field: "firstName",
        message: "Required field missing",
        value: mappedRow.firstName
      });
      rowErrors.add(row.rowNumber);
    }

    if (mappedRow.email && !isValidEmail(mappedRow.email)) {
      validationErrors.push({
        row: row.rowNumber,
        field: "email",
        message: "Invalid email format",
        value: mappedRow.email
      });
      rowErrors.add(row.rowNumber);
    }

    if (rowErrors.has(row.rowNumber)) {
      continue;
    }

    const normalizedEmail = normalizeEmailValue(mappedRow.email);
    const normalizedPhone = normalizePhoneValue(mappedRow.phone);

    if (
      (normalizedEmail && emailSet.has(normalizedEmail)) ||
      (normalizedPhone && phoneSet.has(normalizedPhone))
    ) {
      duplicateRows += 1;
    }
  }

  return {
    totalRows: rows.length,
    validRows: rows.length - rowErrors.size - duplicateRows,
    errorRows: rowErrors.size,
    duplicateRows,
    validationErrors
  };
}

async function getImportSessionOrNull(companyId: string, importSessionId: string): Promise<ImportSessionRow | null> {
  return (
    await db.query.importSessions.findFirst({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.companyId, companyId),
          operators.eq(table.id, importSessionId),
          operators.isNull(table.deletedAt)
        )
    })
  ) ?? null;
}

async function getCompanyCustomers(companyId: string): Promise<CustomerRow[]> {
  return db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)));
}

async function markImportFailed(importSession: ImportSessionRow, error: unknown): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : "CSV import failed";
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(importSessions)
      .set({
        status: "failed",
        errorMessage,
        updatedAt: now
      })
      .where(
        and(
          eq(importSessions.companyId, importSession.companyId),
          eq(importSessions.id, importSession.id),
          isNull(importSessions.deletedAt)
        )
      )
      .returning();

    await emitEventWithExecutor(tx, {
      companyId: importSession.companyId,
      eventType: "import.failed",
      actorType: "system",
      entityType: "import_session",
      entityId: importSession.id,
      payload: {
        errorMessage
      },
      summary: `Import ${importSession.fileName} failed`
    });
  });
}

export async function handleMapCsvColumns(job: Job<Record<string, unknown>>): Promise<void> {
  const companyId = typeof job.data.companyId === "string" ? job.data.companyId : null;
  const importSessionId = typeof job.data.importSessionId === "string" ? job.data.importSessionId : null;

  if (!companyId || !importSessionId) {
    logger.warn({ jobId: job.id ?? null }, "CSV mapping job missing required identifiers");
    return;
  }

  const importSession = await getImportSessionOrNull(companyId, importSessionId);

  if (!importSession) {
    logger.warn({ companyId, importSessionId }, "CSV mapping job skipped because import session was not found");
    return;
  }

  try {
    const fileBuffer = await downloadFile(getFileKeyFromUrl(importSession.fileUrl));
    const parsedCsv = parseCsv(fileBuffer);
    let columnMapping: ColumnMapping;

    try {
      columnMapping = await mapCsvColumns(
        parsedCsv.headers,
        parsedCsv.rows.slice(0, 5).map((row) => row.values),
        importSession.entityType
      );
    } catch (error: unknown) {
      logger.error(
        {
          err: error,
          companyId,
          importSessionId
        },
        "AI column mapping failed; falling back to empty mapping"
      );
      columnMapping = buildEmptyMapping(parsedCsv.headers);
    }

    await db
      .update(importSessions)
      .set({
        columnMappings: columnMapping,
        status: "mapping",
        updatedAt: new Date()
      })
      .where(and(eq(importSessions.companyId, companyId), eq(importSessions.id, importSessionId), isNull(importSessions.deletedAt)))
      .returning();
  } catch (error: unknown) {
    logger.error(
      {
        err: error,
        companyId,
        importSessionId
      },
      "CSV mapping job failed"
    );
    await markImportFailed(importSession, error);
    throw error;
  }
}

export async function handleValidateCsvRows(job: Job<Record<string, unknown>>): Promise<void> {
  const companyId = typeof job.data.companyId === "string" ? job.data.companyId : null;
  const importSessionId = typeof job.data.importSessionId === "string" ? job.data.importSessionId : null;

  if (!companyId || !importSessionId) {
    logger.warn({ jobId: job.id ?? null }, "CSV validation job missing required identifiers");
    return;
  }

  const importSession = await getImportSessionOrNull(companyId, importSessionId);

  if (!importSession) {
    logger.warn({ companyId, importSessionId }, "CSV validation job skipped because import session was not found");
    return;
  }

  try {
    const fileBuffer = await downloadFile(getFileKeyFromUrl(importSession.fileUrl));
    const parsedCsv = parseCsv(fileBuffer);
    const existingCustomers = await getCompanyCustomers(companyId);
    const validationResult = validateCustomerRows(
      parsedCsv.rows,
      normalizeColumnMappings(importSession.columnMappings),
      existingCustomers
    );

    await db
      .update(importSessions)
      .set({
        totalRows: validationResult.totalRows,
        validRows: validationResult.validRows,
        errorRows: validationResult.errorRows,
        duplicateRows: validationResult.duplicateRows,
        validationErrors: validationResult.validationErrors,
        status: "preview",
        updatedAt: new Date()
      })
      .where(and(eq(importSessions.companyId, companyId), eq(importSessions.id, importSessionId), isNull(importSessions.deletedAt)))
      .returning();

    await job.updateProgress?.(100);
  } catch (error: unknown) {
    logger.error(
      {
        err: error,
        companyId,
        importSessionId
      },
      "CSV validation job failed"
    );
    await markImportFailed(importSession, error);
    throw error;
  }
}

export async function handleExecuteImport(job: Job<Record<string, unknown>>): Promise<void> {
  const companyId = typeof job.data.companyId === "string" ? job.data.companyId : null;
  const importSessionId = typeof job.data.importSessionId === "string" ? job.data.importSessionId : null;

  if (!companyId || !importSessionId) {
    logger.warn({ jobId: job.id ?? null }, "CSV import execution job missing required identifiers");
    return;
  }

  const importSession = await getImportSessionOrNull(companyId, importSessionId);

  if (!importSession) {
    logger.warn({ companyId, importSessionId }, "CSV import execution skipped because import session was not found");
    return;
  }

  try {
    const fileBuffer = await downloadFile(getFileKeyFromUrl(importSession.fileUrl));
    const parsedCsv = parseCsv(fileBuffer);
    const columnMapping = normalizeColumnMappings(importSession.columnMappings);
    const validationErrors = normalizeValidationErrors(importSession.validationErrors);
    const invalidRowNumbers = new Set(validationErrors.map((validationError) => validationError.row));
    const existingCustomers = await getCompanyCustomers(companyId);
    const emailSet = new Set(
      existingCustomers
        .map((customer) => normalizeEmailValue(customer.email))
        .filter((value): value is string => value !== null)
    );
    const phoneSet = new Set(
      existingCustomers
        .map((customer) => normalizePhoneValue(customer.phone))
        .filter((value): value is string => value !== null)
    );
    let importedRows = 0;
    let skippedRows = 0;
    let duplicateRows = 0;
    let processedRows = 0;

    for (let startIndex = 0; startIndex < parsedCsv.rows.length; startIndex += IMPORT_BATCH_SIZE) {
      const batch = parsedCsv.rows.slice(startIndex, startIndex + IMPORT_BATCH_SIZE);
      const customerInserts: CustomerInsert[] = [];
      const propertyInserts: PropertyInsert[] = [];

      for (const row of batch) {
        processedRows += 1;

        if (invalidRowNumbers.has(row.rowNumber)) {
          skippedRows += 1;
          continue;
        }

        const mappedRow = mapCustomerRow(row.values, columnMapping);
        const normalizedEmail = normalizeEmailValue(mappedRow.email);
        const normalizedPhone = normalizePhoneValue(mappedRow.phone);

        if (
          (normalizedEmail && emailSet.has(normalizedEmail)) ||
          (normalizedPhone && phoneSet.has(normalizedPhone))
        ) {
          duplicateRows += 1;
          skippedRows += 1;

          logger.debug(
            {
              companyId,
              importSessionId,
              rowNumber: row.rowNumber
            },
            "Skipping duplicate customer row during import"
          );
          continue;
        }

        const customerId = randomUUID();

        customerInserts.push({
          id: customerId,
          companyId,
          firstName: mappedRow.firstName,
          lastName: mappedRow.lastName,
          displayName: mappedRow.displayName,
          email: mappedRow.email,
          phone: mappedRow.phone,
          altPhone: mappedRow.altPhone,
          internalNotes: mappedRow.notes,
          tags: mappedRow.tags,
          importSessionId
        });

        if (mappedRow.addressLine1 && mappedRow.city && mappedRow.state && mappedRow.zip) {
          propertyInserts.push({
            id: randomUUID(),
            companyId,
            customerId,
            addressLine1: mappedRow.addressLine1,
            city: mappedRow.city,
            state: mappedRow.state,
            zip: mappedRow.zip,
            type: "residential",
            isPrimary: true,
            importSessionId
          });
        }

        if (normalizedEmail) {
          emailSet.add(normalizedEmail);
        }

        if (normalizedPhone) {
          phoneSet.add(normalizedPhone);
        }
      }

      if (customerInserts.length > 0 || propertyInserts.length > 0) {
        await db.transaction(async (tx) => {
          if (customerInserts.length > 0) {
            await tx.insert(customers).values(customerInserts).returning();
          }

          if (propertyInserts.length > 0) {
            await tx.insert(properties).values(propertyInserts).returning();
          }
        });
      }

      importedRows += customerInserts.length;
      const progress = parsedCsv.rows.length === 0
        ? 100
        : Math.round((processedRows / parsedCsv.rows.length) * 100);
      await job.updateProgress?.(progress);
    }

    const completedAt = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(importSessions)
        .set({
          status: "completed",
          importedRows,
          skippedRows,
          duplicateRows,
          completedAt,
          errorMessage: null,
          updatedAt: completedAt
        })
        .where(
          and(
            eq(importSessions.companyId, companyId),
            eq(importSessions.id, importSessionId),
            isNull(importSessions.deletedAt)
          )
        )
        .returning();

      await emitEventWithExecutor(tx, {
        companyId,
        eventType: "import.completed",
        actorType: "system",
        entityType: "import_session",
        entityId: importSessionId,
        payload: {
          importedRows,
          skippedRows,
          duplicateRows
        },
        summary: `Import ${importSession.fileName} completed`
      });
    });

    await aiQueue.add(
      "dormant-customer-scan",
      {
        companyId,
        triggeredBy: "import"
      },
      {
        delay: 5000,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        }
      }
    );
  } catch (error: unknown) {
    logger.error(
      {
        err: error,
        companyId,
        importSessionId
      },
      "CSV import execution job failed"
    );
    await markImportFailed(importSession, error);
    throw error;
  }
}

export function createCsvImportProcessor(): Processor<Record<string, unknown>, void, string> {
  return async (job) => {
    switch (job.name) {
      case "map-csv-columns":
        await handleMapCsvColumns(job);
        return;
      case "validate-csv-rows":
        await handleValidateCsvRows(job);
        return;
      case "execute-import":
        await handleExecuteImport(job);
        return;
      default:
        logger.warn({ jobId: job.id ?? null, jobName: job.name }, "Unknown CSV import job received");
    }
  };
}

export const processCsvImport = createCsvImportProcessor();
