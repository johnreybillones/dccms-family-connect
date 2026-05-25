import { z } from "zod";

import { attendanceRecordSchema } from "./attendance-record";
import { enrollmentProfileSchema, isoTimestampSchema } from "./enrollment-profile";
import { exportAuditRecordSchema } from "./reports";

const operationBaseSchema = {
  operationId: z.string().trim().min(1, "Operation ID is required"),
  clientRecordedAt: isoTimestampSchema,
};

const createProfileOperationSchema = z.object({
  ...operationBaseSchema,
  kind: z.literal("createProfile"),
  profile: enrollmentProfileSchema,
});

const updateProfileOperationSchema = z.object({
  ...operationBaseSchema,
  kind: z.literal("updateProfile"),
  baseRevision: z.number().int().nonnegative(),
  profile: enrollmentProfileSchema,
});

const upsertAttendanceOperationSchema = z.object({
  ...operationBaseSchema,
  kind: z.literal("upsertAttendance"),
  baseRevision: z.number().int().nonnegative().nullable(),
  attendance: attendanceRecordSchema,
});

const recordExportAuditOperationSchema = z.object({
  ...operationBaseSchema,
  kind: z.literal("recordExportAudit"),
  exportAudit: exportAuditRecordSchema,
});

export const syncOperationSchema = z.discriminatedUnion("kind", [
  createProfileOperationSchema,
  updateProfileOperationSchema,
  upsertAttendanceOperationSchema,
  recordExportAuditOperationSchema,
]);

export const syncStatusSchema = z.enum([
  "offline",
  "saved_locally",
  "syncing",
  "synced",
  "sync_failed",
  "reauth_required",
]);

export const syncPayloadSchema = z.object({
  deviceId: z.string().trim().min(1, "Device ID is required"),
  lastSyncedAt: isoTimestampSchema.nullable(),
  operations: z.array(syncOperationSchema).min(1, "Operations are required"),
});

export type CreateProfileOperation = z.infer<typeof createProfileOperationSchema>;
export type UpdateProfileOperation = z.infer<typeof updateProfileOperationSchema>;
export type UpsertAttendanceOperation = z.infer<typeof upsertAttendanceOperationSchema>;
export type RecordExportAuditOperation = z.infer<typeof recordExportAuditOperationSchema>;
export type SyncOperation = z.infer<typeof syncOperationSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type SyncPayload = z.infer<typeof syncPayloadSchema>;
