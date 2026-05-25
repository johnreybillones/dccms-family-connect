import { describe, expect, it } from "vitest";

import { attendanceRecordFixture } from "./fixtures";
import {
  attendanceRecordSchema,
  attendanceStatusSchema,
  getAttendanceCanonicalKey,
} from "./attendance-record";

describe("attendanceRecordSchema", () => {
  it("accepts a canonical attendance fixture", () => {
    expect(attendanceRecordSchema.parse(attendanceRecordFixture)).toEqual(attendanceRecordFixture);
  });

  it("requires an excused note and normalizes blank optional notes to null", () => {
    expect(() =>
      attendanceRecordSchema.parse({
        ...attendanceRecordFixture,
        status: "excused",
        note: "   ",
      }),
    ).toThrow(/note/i);

    const parsed = attendanceRecordSchema.parse({
      ...attendanceRecordFixture,
      status: "present",
      note: "   ",
    });

    expect(parsed.note).toBeNull();
  });

  it("rejects invalid statuses and non-ISO attendance dates", () => {
    expect(() => attendanceStatusSchema.parse("late")).toThrow(/invalid enum/i);

    expect(() =>
      attendanceRecordSchema.parse({
        ...attendanceRecordFixture,
        attendanceDate: "05/01/2025",
      }),
    ).toThrow(/attendance date/i);
  });

  it("builds the uniqueness key from profile and attendance date", () => {
    expect(getAttendanceCanonicalKey(attendanceRecordFixture)).toBe("profile-001|2025-05-01");
  });
});
