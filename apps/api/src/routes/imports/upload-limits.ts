/** Matches `uploadCsvToR2` / `file-upload.service` CSV cap (FS-11). */
export const CSV_IMPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** CSV import accepts exactly one file per request. */
export const CSV_IMPORT_MAX_FILES = 1;

export const csvImportMultipartLimits = {
  fileSize: CSV_IMPORT_MAX_FILE_SIZE_BYTES,
  files: CSV_IMPORT_MAX_FILES,
  parts: 10
} as const;

export const CSV_IMPORT_FILE_TOO_LARGE_MESSAGE = "CSV files must be smaller than 10MB";
export const CSV_IMPORT_TOO_MANY_FILES_MESSAGE = "Only one CSV file can be uploaded per import request";
