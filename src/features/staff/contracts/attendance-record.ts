import { z } from "zod";

import { isoTimestampSchema } from "./enrollment-profile";

const trimmedRequiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

const nullableTrimmedText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable();

const attendanceDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const attendanceDateSchema = z
  .string()
  .trim()
  .refine((value) => attendanceDatePattern.test(value), "Attendance date must use YYYY-MM-DD")
  .refine(
    (value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)),
    "Attendance date must be valid",
  );

export const attendanceStatusSchema = z.enum(["present", "absent", "excused"]);

export const attendanceRecordSchema = z
  .object({
    id: trimmedRequiredText("ID"),
    profileId: trimmedRequiredText("Profile ID"),
    attendanceDate: attendanceDateSchema,
    status: attendanceStatusSchema,
    note: nullableTrimmedText,
    recordedByUserId: trimmedRequiredText("Recorded by user ID"),
    revision: z.number().int().nonnegative(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .superRefine((record, ctx) => {
    if (record.status === "excused" && !record.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "Note is required when the attendance status is excused",
      });
    }
  });

export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

export function getAttendanceCanonicalKey(
  record: Pick<AttendanceRecord, "profileId" | "attendanceDate">,
) {
  return `${record.profileId}|${record.attendanceDate}`;
}
