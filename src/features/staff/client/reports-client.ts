import {
  reportDefinitionSchema,
  type ReportDefinition,
  type ReportType,
} from "@/features/staff/contracts/reports";
import type { SessionUser } from "@/features/staff/contracts/auth";
import type { AttendanceRecord } from "@/features/staff/contracts/attendance-record";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";
import type { SyncOperation } from "@/features/staff/contracts/sync";

import { listAttendanceRecords } from "./attendance-repository";
import { exportReportToPdf } from "./pdf-export";
import { listProfiles } from "./profile-repository";
import { operationQueueStore } from "./staff-db";
import { getSession } from "./session-store";
import { exportReportToXlsx } from "./xlsx-export";
import { enqueueOperation } from "./offline-vault";

export type AttendanceSheet = {
  attendanceDate: string;
  records: AttendanceRecord[];
};

export type StudentMasterlistRow = {
  name: string;
  gender: EnrollmentProfile["sex"];
  birthDate: string;
  guardianName: string;
  contact: string;
  status: string;
};

export type AttendanceRegisterRow = {
  studentName: string;
  gender: EnrollmentProfile["sex"];
  guardianName: string;
  statusesByDate: Record<string, string>;
  totals: {
    present: number;
    absent: number;
    excused: number;
  };
};

export type AccomplishmentSummaryStats = {
  totalEnrolled: number;
  averageDailyAttendanceRate: number;
  activeRecordCount: number;
  coveredDays: number;
};

type ReportExportBase = {
  type: ReportType;
  fileName: string;
  generatedAt: string;
  generatedBy: string;
  hasUnsynced: boolean;
  schoolYear: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

export type StudentMasterlistPayload = ReportExportBase & {
  type: "student_masterlist";
  studentRows: StudentMasterlistRow[];
};

export type AttendanceRegisterPayload = ReportExportBase & {
  type: "attendance_register_summary";
  attendanceDates: string[];
  attendanceRows: AttendanceRegisterRow[];
};

export type AccomplishmentSummaryPayload = ReportExportBase & {
  type: "accomplishment_summary";
  summary: AccomplishmentSummaryStats;
};

export type OfflineReportPayload =
  | StudentMasterlistPayload
  | AttendanceRegisterPayload
  | AccomplishmentSummaryPayload;

type ReportsClientDeps = {
  listProfiles: () => Promise<EnrollmentProfile[]>;
  listAttendanceSheets: () => Promise<AttendanceSheet[]>;
  getPendingQueueEntries: () => Promise<Array<{ key: IDBValidKey; value: unknown }>>;
  getSessionUser: () => SessionUser | null;
  enqueueOperation: (operation: SyncOperation) => Promise<void>;
  exportToPdf: (payload: OfflineReportPayload) => Promise<void>;
  exportToXlsx: (payload: OfflineReportPayload) => Promise<void>;
  now: () => Date;
};

const DEFAULT_REPORTS_DEPS: ReportsClientDeps = {
  listProfiles,
  listAttendanceSheets,
  getPendingQueueEntries: () => operationQueueStore.getAll(),
  getSessionUser: () => getSession(),
  enqueueOperation,
  exportToPdf: exportReportToPdf,
  exportToXlsx: exportReportToXlsx,
  now: () => new Date(),
};

const FALLBACK_SESSION_USER: SessionUser = {
  id: "usr_preview",
  username: "teacher_preview",
  displayName: "Teacher Preview",
  role: "staff",
};

function formatIsoDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildStudentName(profile: EnrollmentProfile) {
  return [
    profile.childFirstName,
    profile.childMiddleName,
    profile.childLastName,
    profile.childSuffix,
  ]
    .filter(Boolean)
    .join(" ");
}

function getStudentStatus(profile: EnrollmentProfile) {
  return profile.recordNumber ? "Synced" : "Offline pending";
}

function getReportFileName(type: ReportType, format: ReportDefinition["format"], stamp: string) {
  const reportLabel = {
    student_masterlist: "student-masterlist",
    attendance_register_summary: "attendance-register",
    accomplishment_summary: "accomplishment-summary",
  }[type];

  return `${reportLabel}-${stamp}.${format}`;
}

function clampPercentage(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function sortProfiles(profiles: EnrollmentProfile[]) {
  return [...profiles].sort((left, right) => {
    const lastNameOrder = left.childLastName.localeCompare(right.childLastName);
    if (lastNameOrder !== 0) return lastNameOrder;
    return left.childFirstName.localeCompare(right.childFirstName);
  });
}

export function getCurrentSchoolYear(now = new Date()) {
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 5 ? currentYear : currentYear - 1;
  return `${startYear}-${startYear + 1}`;
}

export async function listAttendanceSheets(): Promise<AttendanceSheet[]> {
  const records = await listAttendanceRecords();
  const grouped = new Map<string, AttendanceRecord[]>();

  for (const record of records) {
    const current = grouped.get(record.attendanceDate) ?? [];
    current.push(record);
    grouped.set(record.attendanceDate, current);
  }

  return [...grouped.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([attendanceDate, sheetRecords]) => ({
      attendanceDate,
      records: sheetRecords.sort((left, right) => left.profileId.localeCompare(right.profileId)),
    }));
}

export async function getHasPendingUnsyncedChanges() {
  const queueEntries = await operationQueueStore.getAll();
  return queueEntries.length > 0;
}

function buildStudentMasterlistPayload(
  definition: ReportDefinition,
  profiles: EnrollmentProfile[],
  context: Omit<ReportExportBase, "type" | "fileName"> & { fileName: string },
): StudentMasterlistPayload {
  const filteredProfiles = sortProfiles(
    profiles.filter((profile) => profile.schoolYear === definition.schoolYear),
  );

  return {
    type: "student_masterlist",
    ...context,
    studentRows: filteredProfiles.map((profile) => ({
      name: buildStudentName(profile),
      gender: profile.sex,
      birthDate: profile.birthDate,
      guardianName: profile.guardianFullName,
      contact: profile.guardianContactNumber,
      status: getStudentStatus(profile),
    })),
  };
}

function buildAttendanceRegisterPayload(
  definition: ReportDefinition,
  profiles: EnrollmentProfile[],
  attendanceSheets: AttendanceSheet[],
  context: Omit<ReportExportBase, "type" | "fileName"> & { fileName: string },
): AttendanceRegisterPayload {
  const relevantSheets = attendanceSheets.filter(
    (sheet) =>
      sheet.attendanceDate >= definition.dateFrom! && sheet.attendanceDate <= definition.dateTo!,
  );
  const attendanceDates = relevantSheets.map((sheet) => sheet.attendanceDate);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const attendanceRows = sortProfiles(profiles).map((profile) => {
    const statusesByDate: Record<string, string> = {};
    const totals = { present: 0, absent: 0, excused: 0 };

    for (const sheet of relevantSheets) {
      const matchedRecord = sheet.records.find((record) => record.profileId === profile.id);
      const normalizedStatus = matchedRecord ? matchedRecord.status.toUpperCase() : "N/A";
      statusesByDate[sheet.attendanceDate] = normalizedStatus;

      if (matchedRecord) {
        totals[matchedRecord.status] += 1;
      }
    }

    return {
      studentName: buildStudentName(profileMap.get(profile.id) ?? profile),
      gender: profile.sex,
      guardianName: profile.guardianFullName,
      statusesByDate,
      totals,
    };
  });

  return {
    type: "attendance_register_summary",
    ...context,
    attendanceDates,
    attendanceRows,
  };
}

function buildAccomplishmentSummaryPayload(
  definition: ReportDefinition,
  profiles: EnrollmentProfile[],
  attendanceSheets: AttendanceSheet[],
  context: Omit<ReportExportBase, "type" | "fileName"> & { fileName: string },
): AccomplishmentSummaryPayload {
  const relevantSheets = attendanceSheets.filter(
    (sheet) =>
      sheet.attendanceDate >= definition.dateFrom! && sheet.attendanceDate <= definition.dateTo!,
  );
  const relevantRecords = relevantSheets.flatMap((sheet) => sheet.records);
  const presentCount = relevantRecords.filter((record) => record.status === "present").length;
  const attendanceRate =
    relevantRecords.length === 0
      ? 0
      : clampPercentage((presentCount / relevantRecords.length) * 100);

  return {
    type: "accomplishment_summary",
    ...context,
    summary: {
      totalEnrolled: profiles.length,
      averageDailyAttendanceRate: attendanceRate,
      activeRecordCount: relevantRecords.length,
      coveredDays: relevantSheets.length,
    },
  };
}

export async function generateOfflineReport(
  definition: ReportDefinition,
  overrides: Partial<ReportsClientDeps> = {},
) {
  const parsedDefinition = reportDefinitionSchema.parse(definition);
  const isStudentMasterlist = parsedDefinition.type === "student_masterlist";
  const deps: ReportsClientDeps = { ...DEFAULT_REPORTS_DEPS, ...overrides };
  const [profiles, attendanceSheets, queueEntries] = await Promise.all([
    deps.listProfiles(),
    deps.listAttendanceSheets(),
    deps.getPendingQueueEntries(),
  ]);
  const sessionUser = deps.getSessionUser() ?? FALLBACK_SESSION_USER;
  const hasUnsynced = queueEntries.length > 0;
  const generatedAtDate = deps.now();
  const generatedAt = generatedAtDate.toISOString();
  const fileStamp = generatedAt.slice(0, 10);
  const baseContext = {
    fileName: getReportFileName(parsedDefinition.type, parsedDefinition.format, fileStamp),
    generatedAt,
    generatedBy: sessionUser.displayName,
    hasUnsynced,
    schoolYear: isStudentMasterlist ? (parsedDefinition.schoolYear ?? null) : null,
    dateFrom: parsedDefinition.dateFrom ?? null,
    dateTo: parsedDefinition.dateTo ?? null,
  };

  const filteredProfiles =
    isStudentMasterlist && parsedDefinition.schoolYear
      ? profiles.filter((profile) => profile.schoolYear === parsedDefinition.schoolYear)
      : profiles;

  const payload =
    parsedDefinition.type === "student_masterlist"
      ? buildStudentMasterlistPayload(parsedDefinition, filteredProfiles, baseContext)
      : parsedDefinition.type === "attendance_register_summary"
        ? buildAttendanceRegisterPayload(
            parsedDefinition,
            filteredProfiles,
            attendanceSheets,
            baseContext,
          )
        : buildAccomplishmentSummaryPayload(
            parsedDefinition,
            filteredProfiles,
            attendanceSheets,
            baseContext,
          );

  if (parsedDefinition.format === "pdf") {
    await deps.exportToPdf(payload);
  } else {
    await deps.exportToXlsx(payload);
  }

  await deps.enqueueOperation({
    operationId: crypto.randomUUID(),
    kind: "recordExportAudit",
    clientRecordedAt: generatedAt,
    exportAudit: {
      id: crypto.randomUUID(),
      reportType: parsedDefinition.type,
      reportFormat: parsedDefinition.format,
      generatedByUserId: sessionUser.id,
      generatedAt,
      schoolYear: parsedDefinition.schoolYear ?? null,
      dateFrom: parsedDefinition.dateFrom ?? null,
      dateTo: parsedDefinition.dateTo ?? null,
      includedUnsyncedChanges: hasUnsynced,
    },
  });

  return {
    fileName: payload.fileName,
    hasUnsynced,
    generatedAt,
  };
}

export { formatIsoDateLabel };
