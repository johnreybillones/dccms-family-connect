import { describe, expect, it } from "vitest";

import { syncedEnrollmentProfileFixture } from "./fixtures";
import { enrollmentProfileSchema, getEnrollmentDuplicateKey } from "./enrollment-profile";

describe("enrollmentProfileSchema", () => {
  it("accepts a synchronized enrollment profile fixture", () => {
    expect(enrollmentProfileSchema.parse(syncedEnrollmentProfileFixture)).toEqual(
      syncedEnrollmentProfileFixture,
    );
  });

  it("trims required text, normalizes optional blanks to null, and preserves nullable recordNumber", () => {
    const parsed = enrollmentProfileSchema.parse({
      ...syncedEnrollmentProfileFixture,
      childFirstName: "  Ana  ",
      childMiddleName: "   ",
      childSuffix: "",
      address: "  Purok 1, San Antonio  ",
      guardianFullName: "  Maria Santos ",
      guardianRelationship: "  Mother ",
      guardianContactNumber: "  09171234567  ",
      recordNumber: null,
    });

    expect(parsed.childFirstName).toBe("Ana");
    expect(parsed.childMiddleName).toBeNull();
    expect(parsed.childSuffix).toBeNull();
    expect(parsed.address).toBe("Purok 1, San Antonio");
    expect(parsed.guardianFullName).toBe("Maria Santos");
    expect(parsed.guardianRelationship).toBe("Mother");
    expect(parsed.guardianContactNumber).toBe("09171234567");
    expect(parsed.recordNumber).toBeNull();
  });

  it("rejects invalid school year, invalid record number format, and birth dates after enrollment", () => {
    expect(() =>
      enrollmentProfileSchema.parse({
        ...syncedEnrollmentProfileFixture,
        schoolYear: "2024-2026",
      }),
    ).toThrow(/school year/i);

    expect(() =>
      enrollmentProfileSchema.parse({
        ...syncedEnrollmentProfileFixture,
        recordNumber: "DCC-12",
      }),
    ).toThrow(/record number/i);

    expect(() =>
      enrollmentProfileSchema.parse({
        ...syncedEnrollmentProfileFixture,
        birthDate: "2025-06-01",
        enrollmentDate: "2025-05-01",
      }),
    ).toThrow(/birth date/i);
  });

  it("builds a duplicate warning key from normalized child names and birth date", () => {
    expect(
      getEnrollmentDuplicateKey({
        ...syncedEnrollmentProfileFixture,
        childFirstName: "  Ana  ",
        childLastName: "  DELA CRUZ ",
        birthDate: "2020-01-15",
      }),
    ).toBe("ana|dela cruz|2020-01-15");
  });
});
