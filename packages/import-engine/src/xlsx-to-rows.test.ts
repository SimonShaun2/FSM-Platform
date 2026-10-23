import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { parseXlsxBufferToSheetRows } from "./xlsx-to-rows.js";

describe("parseXlsxBufferToSheetRows", () => {
  it("parses first sheet headers and rows", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Customer ID", "Name"],
      ["c1", "Acme"]
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Customers");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const parsed = parseXlsxBufferToSheetRows(buffer);
    expect(parsed.sheetName).toBe("Customers");
    expect(parsed.headers).toEqual(["Customer ID", "Name"]);
    expect(parsed.rows).toEqual([["c1", "Acme"]]);
  });
});
