import { describe, expect, it } from "vitest";

import { exportAuditOperationFixture } from "./fixtures";
import {
  exportAuditRecordSchema,
  reportDefinitionSchema,
  reportFormatSchema,
  reportTypeSchema,
} from "./reports";

describe("report contracts", () => {
  it("parses the supported report types and formats", () => {
    expect(reportTypeSchema.parse("student_masterlist")).toBe("student_masterlist");
    expect(reportFormatSchema.parse("pdf")).toBe("pdf");
    expect(() => reportTypeSchema.parse("daily_summary")).toThrow(/invalid enum/i);
    expect(() => reportFormatSchema.parse("csv")).toThrow(/invalid enum/i);
  });

  it("requires school year for the student masterlist report", () => {
    expect(() =>
      reportDefinitionSchema.parse({
        type: "student_masterlist",
        format: "pdf",
        schoolYear: null,
      }),
    ).toThrow(/school year/i);
  });

  it("requires a bounded date range for attendance and accomplishment reports", () => {
    expect(() =>
      reportDefinitionSchema.parse({
        type: "attendance_register_summary",
        format: "xlsx",
        dateFrom: "2025-05-31",
        dateTo: "2025-05-01",
      }),
    ).toThrow(/date range/i);
  });

  it("accepts export audit metadata for synchronized operations", () => {
    expect(exportAuditRecordSchema.parse(exportAuditOperationFixture.exportAudit)).toEqual(
      exportAuditOperationFixture.exportAudit,
    );
  });
});
