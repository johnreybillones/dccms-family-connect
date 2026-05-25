import type { AttendanceRecord } from "./attendance-record";
import type { EnrollmentProfile } from "./enrollment-profile";
import type { ExportAuditRecord } from "./reports";
import type {
  CreateProfileOperation,
  RecordExportAuditOperation,
  UpsertAttendanceOperation,
} from "./sync";

export const syncedEnrollmentProfileFixture: EnrollmentProfile = {
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
  revision: 3,
  createdAt: "2025-05-01T08:00:00.000Z",
  updatedAt: "2025-05-20T09:30:00.000Z",
};

export const attendanceRecordFixture: AttendanceRecord = {
  id: "attendance-001",
  profileId: "profile-001",
  attendanceDate: "2025-05-01",
  status: "present",
  note: null,
  recordedByUserId: "user-001",
  revision: 1,
  createdAt: "2025-05-01T09:00:00.000Z",
  updatedAt: "2025-05-01T09:00:00.000Z",
};

export const unsyncedCreateProfileOperationFixture: CreateProfileOperation = {
  operationId: "op-create-profile-001",
  kind: "createProfile",
  clientRecordedAt: "2025-05-01T08:05:00.000Z",
  profile: {
    ...syncedEnrollmentProfileFixture,
    id: "profile-local-001",
    recordNumber: null,
    revision: 0,
    createdAt: "2025-05-01T08:05:00.000Z",
    updatedAt: "2025-05-01T08:05:00.000Z",
  },
};

export const unsyncedAttendanceUpdateOperationFixture: UpsertAttendanceOperation = {
  operationId: "op-attendance-001",
  kind: "upsertAttendance",
  clientRecordedAt: "2025-05-02T09:15:00.000Z",
  baseRevision: 1,
  attendance: {
    ...attendanceRecordFixture,
    status: "excused",
    note: "Clinic visit",
    updatedAt: "2025-05-02T09:15:00.000Z",
    revision: 2,
  },
};

const exportAuditFixture: ExportAuditRecord = {
  id: "audit-001",
  reportType: "attendance_register_summary",
  reportFormat: "pdf",
  generatedByUserId: "user-001",
  generatedAt: "2025-05-03T10:45:00.000Z",
  schoolYear: "2025-2026",
  dateFrom: "2025-05-01",
  dateTo: "2025-05-31",
  includedUnsyncedChanges: true,
};

export const exportAuditOperationFixture: RecordExportAuditOperation = {
  operationId: "op-export-audit-001",
  kind: "recordExportAudit",
  clientRecordedAt: "2025-05-03T10:45:00.000Z",
  exportAudit: exportAuditFixture,
};
