import { describe, expect, it } from "vitest";

import {
  CSV_IMPORT_FILE_TOO_LARGE_MESSAGE,
  csvImportMultipartParserOptions
} from "./upload-limits.js";

describe("csvImportMultipartParserOptions", () => {
  it("enables throwFileSizeLimit for @fastify/multipart v9 parts()/toBuffer()", () => {
    expect(csvImportMultipartParserOptions.throwFileSizeLimit).toBe(true);
    expect(csvImportMultipartParserOptions.limits.fileSize).toBe(10 * 1024 * 1024);
  });

  it("uses the FS-11 CSV file-too-large operator message", () => {
    expect(CSV_IMPORT_FILE_TOO_LARGE_MESSAGE).toBe("CSV files must be smaller than 10MB");
  });
});
