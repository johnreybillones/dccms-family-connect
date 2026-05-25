import type { AttendanceRecord } from "../contracts/attendance-record";
import type { D1DatabaseLike } from "./db.server";

type AttendanceRow = AttendanceRecord;

export async function listAttendanceRecords(database: D1DatabaseLike): Promise<AttendanceRecord[]> {
  const result = await database
    .prepare(
      "SELECT id, profile_id AS profileId, attendance_date AS attendanceDate, status, note, recorded_by_user_id AS recordedByUserId, revision, created_at AS createdAt, updated_at AS updatedAt FROM attendance_records ORDER BY attendance_date ASC, created_at ASC",
    )
    .all<AttendanceRow>();

  return result.results;
}

export async function findAttendanceRecordById(
  database: D1DatabaseLike,
  attendanceId: string,
): Promise<AttendanceRecord | null> {
  return database
    .prepare(
      "SELECT id, profile_id AS profileId, attendance_date AS attendanceDate, status, note, recorded_by_user_id AS recordedByUserId, revision, created_at AS createdAt, updated_at AS updatedAt FROM attendance_records WHERE id = ? LIMIT 1",
    )
    .bind(attendanceId)
    .first<AttendanceRow>();
}

export async function findAttendanceRecordByProfileAndDate(
  database: D1DatabaseLike,
  profileId: string,
  attendanceDate: string,
): Promise<AttendanceRecord | null> {
  return database
    .prepare(
      "SELECT id, profile_id AS profileId, attendance_date AS attendanceDate, status, note, recorded_by_user_id AS recordedByUserId, revision, created_at AS createdAt, updated_at AS updatedAt FROM attendance_records WHERE profile_id = ? AND attendance_date = ? LIMIT 1",
    )
    .bind(profileId, attendanceDate)
    .first<AttendanceRow>();
}

export async function insertAttendanceRecord(
  database: D1DatabaseLike,
  record: AttendanceRecord,
): Promise<void> {
  await database
    .prepare(
      "INSERT INTO attendance_records (id, profile_id, attendance_date, status, note, recorded_by_user_id, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      record.id,
      record.profileId,
      record.attendanceDate,
      record.status,
      record.note,
      record.recordedByUserId,
      record.revision,
      record.createdAt,
      record.updatedAt,
    )
    .run();
}

export async function updateAttendanceRecord(
  database: D1DatabaseLike,
  record: AttendanceRecord,
): Promise<void> {
  await database
    .prepare(
      "UPDATE attendance_records SET profile_id = ?, attendance_date = ?, status = ?, note = ?, recorded_by_user_id = ?, revision = ?, updated_at = ? WHERE id = ?",
    )
    .bind(
      record.profileId,
      record.attendanceDate,
      record.status,
      record.note,
      record.recordedByUserId,
      record.revision,
      record.updatedAt,
      record.id,
    )
    .run();
}
