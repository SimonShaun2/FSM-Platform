/** Matches `uploadCsvToR2` / `file-upload.service` CSV cap (FS-11). */
export const CSV_IMPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** CSV import accepts exactly one file per request. */
export const CSV_IMPORT_MAX_FILES = 1;

/**
 * Multipart wrapper overhead for a single `file` part (boundaries + disposition headers).
 * FS-11-AC-07 supertest attach measures 204 bytes for `huge.csv`.
 */
export const CSV_IMPORT_MULTIPART_OVERHEAD_BYTES = 204;

/** Max HTTP body size for a valid 10MB CSV upload (file bytes + multipart framing). */
export const CSV_IMPORT_MAX_REQUEST_BODY_BYTES =
  CSV_IMPORT_MAX_FILE_SIZE_BYTES + CSV_IMPORT_MULTIPART_OVERHEAD_BYTES;

export const csvImportMultipartLimits = {
  fileSize: CSV_IMPORT_MAX_FILE_SIZE_BYTES,
  files: CSV_IMPORT_MAX_FILES,
  parts: 10
} as const;

export const CSV_IMPORT_FILE_TOO_LARGE_MESSAGE = "CSV files must be smaller than 10MB";
export const CSV_IMPORT_TOO_MANY_FILES_MESSAGE = "Only one CSV file can be uploaded per import request";
