import { describe, expect, it, vi } from "vitest";

import type { AttendanceRecord } from "@/features/staff/contracts/attendance-record";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";
import type { SessionUser } from "@/features/staff/contracts/auth";

import { generateOfflineReport } from "./reports-client";

const sessionUserFixture: SessionUser = {
  id: "user-001",
  username: "teacher_anna",
  displayName: "Teacher Anna",
  role: "administrator",
};

const profileFixture: EnrollmentProfile = {
  id: "profile-001",
  recordNumber: "DCC-000001",
  childFirstName: "Ana",
  childMiddleName: "Lopez",
  childLastName: "Dela Cruz",
  childSuffix: null,
  birthDate: "2020-01-15",
  sex: "Female",
  address: "Purok 1, San Antonio, Dasmarinas City, Cavite",
  guardianFullName: "Maria Dela Cruz",
  guardianRelationship: "Mother",
  guardianContactNumber: "09171234567",
  schoolYear: "2025-2026",
  enrollmentDate: "2025-05-01",
  revision: 2,
  createdAt: "2025-05-01T08:00:00.000Z",
  updatedAt: "2025-05-20T09:30:00.000Z",
};

const attendanceFixture: AttendanceRecord = {
  id: "attendance-001",
  profileId: "profile-001",
  attendanceDate: "2025-05-10",
  status: "present",
  note: null,
  recordedByUserId: "user-001",
  revision: 0,
  createdAt: "2025-05-10T08:00:00.000Z",
  updatedAt: "2025-05-10T08:00:00.000Z",
};

describe("generateOfflineReport", () => {
  it("detects unsynced changes and enqueues an export audit entry", async () => {
    const exportToPdf = vi.fn().mockResolvedValue(undefined);
    const enqueueOperation = vi.fn().mockResolvedValue(undefined);

    const result = await generateOfflineReport(
      {
        type: "student_masterlist",
        format: "pdf",
        schoolYear: "2025-2026",
      },
      {
        listProfiles: async () => [profileFixture],
        listAttendanceSheets: async () => [],
        getPendingQueueEntries: async () => [{ key: "queued-op", value: {} as IDBValidKey }],
        getSessionUser: () => sessionUserFixture,
        enqueueOperation,
        exportToPdf,
        exportToXlsx: vi.fn(),
        now: () => new Date("2026-05-26T01:02:03.000Z"),
      },
    );

    expect(result.hasUnsynced).toBe(true);
    expect(exportToPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "student_masterlist",
        hasUnsynced: true,
        generatedBy: sessionUserFixture.displayName,
        studentRows: [
          expect.objectContaining({
            name: "Ana Lopez Dela Cruz",
            guardianName: "Maria Dela Cruz",
          }),
        ],
      }),
    );
    expect(enqueueOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "recordExportAudit",
        exportAudit: expect.objectContaining({
          generatedByUserId: "user-001",
          includedUnsyncedChanges: true,
          schoolYear: "2025-2026",
        }),
      }),
    );
  });

  it("builds attendance-register data for xlsx export", async () => {
    const exportToXlsx = vi.fn().mockResolvedValue(undefined);

    await generateOfflineReport(
      {
        type: "attendance_register_summary",
        format: "xlsx",
        dateFrom: "2025-05-01",
        dateTo: "2025-05-31",
      },
      {
        listProfiles: async () => [profileFixture],
        listAttendanceSheets: async () => [
          {
            attendanceDate: "2025-05-10",
            records: [attendanceFixture],
          },
        ],
        getPendingQueueEntries: async () => [],
        getSessionUser: () => sessionUserFixture,
        enqueueOperation: vi.fn().mockResolvedValue(undefined),
        exportToPdf: vi.fn(),
        exportToXlsx,
        now: () => new Date("2026-05-26T01:02:03.000Z"),
      },
    );

    expect(exportToXlsx).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "attendance_register_summary",
        attendanceDates: ["2025-05-10"],
        attendanceRows: [
          expect.objectContaining({
            studentName: "Ana Lopez Dela Cruz",
            totals: { present: 1, absent: 0, excused: 0 },
          }),
        ],
      }),
    );
  });

  it("does not drop attendance rows when a non-masterlist export receives a different school year", async () => {
    const exportToXlsx = vi.fn().mockResolvedValue(undefined);

    await generateOfflineReport(
      {
        type: "attendance_register_summary",
        format: "xlsx",
        schoolYear: "2026-2027",
        dateFrom: "2025-05-01",
        dateTo: "2025-05-31",
      },
      {
        listProfiles: async () => [profileFixture],
        listAttendanceSheets: async () => [
          {
            attendanceDate: "2025-05-10",
            records: [attendanceFixture],
          },
        ],
        getPendingQueueEntries: async () => [],
        getSessionUser: () => sessionUserFixture,
        enqueueOperation: vi.fn().mockResolvedValue(undefined),
        exportToPdf: vi.fn(),
        exportToXlsx,
        now: () => new Date("2026-05-26T01:02:03.000Z"),
      },
    );

    expect(exportToXlsx).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "attendance_register_summary",
        attendanceDates: ["2025-05-10"],
        attendanceRows: [
          expect.objectContaining({
            studentName: "Ana Lopez Dela Cruz",
            totals: { present: 1, absent: 0, excused: 0 },
          }),
        ],
      }),
    );
  });
});
