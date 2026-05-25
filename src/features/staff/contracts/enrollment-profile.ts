import { z } from "zod";

const trimmedRequiredText = (label: string) => z.string().trim().min(1, `${label} is required`);

const nullableTrimmedText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable();

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export const schoolYearSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{4}$/, "School year must match YYYY-YYYY")
  .refine((value) => {
    const [startYear, endYear] = value.split("-").map(Number);
    return endYear === startYear + 1;
  }, "School year end must be the following year");

export const studentSexSchema = z.enum(["Female", "Male", "Not specified"]);

export const isoDateSchema = z
  .string()
  .trim()
  .refine((value) => isoDatePattern.test(value), "Date must use YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), "Date must be valid");

export const isoTimestampSchema = z
  .string()
  .trim()
  .refine((value) => isoTimestampPattern.test(value), "Timestamp must use ISO-8601 UTC format")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Timestamp must be valid");

export const enrollmentProfileSchema = z
  .object({
    id: trimmedRequiredText("ID"),
    recordNumber: z
      .string()
      .trim()
      .regex(/^DCC-\d{6}$/, "Record number must match DCC-000001")
      .nullable(),
    childFirstName: trimmedRequiredText("Child first name"),
    childMiddleName: nullableTrimmedText,
    childLastName: trimmedRequiredText("Child last name"),
    childSuffix: nullableTrimmedText,
    birthDate: isoDateSchema,
    sex: studentSexSchema,
    address: trimmedRequiredText("Address"),
    guardianFullName: trimmedRequiredText("Guardian full name"),
    guardianRelationship: trimmedRequiredText("Guardian relationship"),
    guardianContactNumber: trimmedRequiredText("Guardian contact number"),
    schoolYear: schoolYearSchema,
    enrollmentDate: isoDateSchema,
    revision: z.number().int().nonnegative(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .superRefine((profile, ctx) => {
    if (profile.birthDate > profile.enrollmentDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthDate"],
        message: "Birth date cannot be later than enrollment date",
      });
    }
  });

export type StudentSex = z.infer<typeof studentSexSchema>;
export type EnrollmentProfile = z.infer<typeof enrollmentProfileSchema>;

export function getEnrollmentDuplicateKey(
  profile: Pick<EnrollmentProfile, "childFirstName" | "childLastName" | "birthDate">,
) {
  return [
    profile.childFirstName.trim().toLowerCase(),
    profile.childLastName.trim().toLowerCase(),
    profile.birthDate,
  ].join("|");
}
