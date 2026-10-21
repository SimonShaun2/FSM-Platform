import { describe, expect, it } from "vitest";

import { sanitizeSpreadsheetCell } from "./spreadsheet-sanitize.js";

describe("sanitizeSpreadsheetCell", () => {
  it("prefixes formula triggers", () => {
    expect(sanitizeSpreadsheetCell("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(sanitizeSpreadsheetCell("+1234")).toBe("'+1234");
    expect(sanitizeSpreadsheetCell("-sum(A1)")).toBe("'-sum(A1)");
    expect(sanitizeSpreadsheetCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(sanitizeSpreadsheetCell("\t=hidden")).toBe("'\t=hidden");
  });

  it("strips carriage returns", () => {
    expect(sanitizeSpreadsheetCell("safe\rvalue")).toBe("safevalue");
  });

  it("leaves normal text unchanged", () => {
    expect(sanitizeSpreadsheetCell("Kim Patel")).toBe("Kim Patel");
  });
});
