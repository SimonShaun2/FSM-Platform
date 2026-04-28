import { AppError, ErrorCode } from "@fsm/types";

import { uploadFile } from "../lib/storage.js";

const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024;
const CSV_MIME_TYPES = new Set(["text/csv", "application/vnd.ms-excel"]);

function sanitizeFileName(fileName: string): string {
  const trimmedValue = fileName.trim();
  const sanitizedValue = trimmedValue.replace(/[^a-zA-Z0-9._-]+/gu, "-");
  return sanitizedValue.length > 0 ? sanitizedValue : "import.csv";
}

function isCsvFile(fileName: string, mimeType: string): boolean {
  if (CSV_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return fileName.trim().toLowerCase().endsWith(".csv");
}

export async function uploadCsvToR2(
  companyId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ fileUrl: string; fileKey: string }> {
  if (!isCsvFile(fileName, mimeType)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Only CSV files can be uploaded");
  }

  if (fileBuffer.byteLength > MAX_CSV_SIZE_BYTES) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "CSV files must be smaller than 10MB");
  }

  const sanitizedFileName = sanitizeFileName(fileName);
  const fileKey = `imports/${companyId}/${Date.now()}-${sanitizedFileName}`;
  const uploadedFile = await uploadFile(fileKey, fileBuffer, mimeType);

  return {
    fileUrl: uploadedFile.url,
    fileKey: uploadedFile.key
  };
}
