import {
  saveAttendance,
  loadAllAttendance,
  enqueueOperation,
} from "@/features/staff/client/offline-vault";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "@/features/staff/contracts/attendance-record";

function nowIso(): string {
  return new Date().toISOString();
}

function shouldQueueOfflineOperation(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export type SaveAttendanceInput = {
  id?: string;
  profileId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  note?: string | null;
  recordedByUserId: string;
};

export async function saveAttendanceRecord(input: SaveAttendanceInput): Promise<AttendanceRecord> {
  const existing = input.id
    ? await getAttendanceRecordById(input.id)
    : await getAttendanceRecordByProfileAndDate(input.profileId, input.attendanceDate);
  const timestamp = nowIso();

  const record: AttendanceRecord = existing
    ? {
        ...existing,
        status: input.status,
        note: input.note?.trim() || null,
        recordedByUserId: input.recordedByUserId,
        revision: existing.revision + 1,
        updatedAt: timestamp,
      }
    : {
        id: input.id ?? crypto.randomUUID(),
        profileId: input.profileId,
        attendanceDate: input.attendanceDate,
        status: input.status,
        note: input.note?.trim() || null,
        recordedByUserId: input.recordedByUserId,
        revision: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

  await saveAttendance(record);

  if (shouldQueueOfflineOperation()) {
    await enqueueOperation({
      operationId: crypto.randomUUID(),
      kind: "upsertAttendance",
      clientRecordedAt: timestamp,
      baseRevision: existing ? existing.revision : null,
      attendance: record,
    });
  }

  return record;
}

export async function getAttendanceRecordById(id: string): Promise<AttendanceRecord | null> {
  const records = await loadAllAttendance();
  return records.find((record) => record.id === id) ?? null;
}

export async function getAttendanceRecordByProfileAndDate(
  profileId: string,
  attendanceDate: string,
): Promise<AttendanceRecord | null> {
  const records = await loadAllAttendance();
  return (
    records.find(
      (record) => record.profileId === profileId && record.attendanceDate === attendanceDate,
    ) ?? null
  );
}

export async function listAttendanceRecords(): Promise<AttendanceRecord[]> {
  const records = await loadAllAttendance();
  return records.sort((left, right) => {
    const dateOrder = right.attendanceDate.localeCompare(left.attendanceDate);
    if (dateOrder !== 0) return dateOrder;
    return left.profileId.localeCompare(right.profileId);
  });
}

export async function listAttendanceRecordsByDate(
  attendanceDate: string,
): Promise<AttendanceRecord[]> {
  const records = await loadAllAttendance();
  return records
    .filter((record) => record.attendanceDate === attendanceDate)
    .sort((left, right) => left.profileId.localeCompare(right.profileId));
}
