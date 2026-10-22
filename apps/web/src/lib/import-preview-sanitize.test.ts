import { describe, expect, it } from "vitest";

import { sanitizeImportPreviewCell } from "./import-preview-sanitize";

describe("sanitizeImportPreviewCell", () => {
  it("strips HTML tags from preview text", () => {
    expect(sanitizeImportPreviewCell('<img src=x onerror="alert(1)">Kim')).toBe("Kim");
    expect(sanitizeImportPreviewCell("<b>Hello</b> world")).toBe("Hello world");
  });

  it("neutralizes spreadsheet formula prefixes", () => {
    expect(sanitizeImportPreviewCell("=1+1")).toBe("'=1+1");
  });
});
