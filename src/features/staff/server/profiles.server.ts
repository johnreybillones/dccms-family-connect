import type { EnrollmentProfile } from "../contracts/enrollment-profile";
import type { D1DatabaseLike } from "./db.server";

type ProfileRow = EnrollmentProfile;

export async function listEnrollmentProfiles(
  database: D1DatabaseLike,
): Promise<EnrollmentProfile[]> {
  const result = await database
    .prepare(
      "SELECT id, record_number AS recordNumber, child_first_name AS childFirstName, child_middle_name AS childMiddleName, child_last_name AS childLastName, child_suffix AS childSuffix, birth_date AS birthDate, sex, address, guardian_full_name AS guardianFullName, guardian_relationship AS guardianRelationship, guardian_contact_number AS guardianContactNumber, school_year AS schoolYear, enrollment_date AS enrollmentDate, revision, created_at AS createdAt, updated_at AS updatedAt FROM enrollment_profiles ORDER BY created_at ASC",
    )
    .all<ProfileRow>();

  return result.results;
}

export async function findEnrollmentProfileById(
  database: D1DatabaseLike,
  profileId: string,
): Promise<EnrollmentProfile | null> {
  return database
    .prepare(
      "SELECT id, record_number AS recordNumber, child_first_name AS childFirstName, child_middle_name AS childMiddleName, child_last_name AS childLastName, child_suffix AS childSuffix, birth_date AS birthDate, sex, address, guardian_full_name AS guardianFullName, guardian_relationship AS guardianRelationship, guardian_contact_number AS guardianContactNumber, school_year AS schoolYear, enrollment_date AS enrollmentDate, revision, created_at AS createdAt, updated_at AS updatedAt FROM enrollment_profiles WHERE id = ? LIMIT 1",
    )
    .bind(profileId)
    .first<ProfileRow>();
}

export async function getNextProfileRecordNumber(database: D1DatabaseLike): Promise<string> {
  const row = await database
    .prepare(
      "SELECT record_number AS recordNumber FROM enrollment_profiles WHERE record_number IS NOT NULL ORDER BY record_number DESC LIMIT 1",
    )
    .first<{ recordNumber: string | null }>();

  const nextNumber = row?.recordNumber ? Number.parseInt(row.recordNumber.slice(4), 10) + 1 : 1;
  return `DCC-${String(nextNumber).padStart(6, "0")}`;
}

export async function insertEnrollmentProfile(
  database: D1DatabaseLike,
  profile: EnrollmentProfile,
): Promise<void> {
  await database
    .prepare(
      "INSERT INTO enrollment_profiles (id, record_number, child_first_name, child_middle_name, child_last_name, child_suffix, birth_date, sex, address, guardian_full_name, guardian_relationship, guardian_contact_number, school_year, enrollment_date, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      profile.id,
      profile.recordNumber,
      profile.childFirstName,
      profile.childMiddleName,
      profile.childLastName,
      profile.childSuffix,
      profile.birthDate,
      profile.sex,
      profile.address,
      profile.guardianFullName,
      profile.guardianRelationship,
      profile.guardianContactNumber,
      profile.schoolYear,
      profile.enrollmentDate,
      profile.revision,
      profile.createdAt,
      profile.updatedAt,
    )
    .run();
}

export async function updateEnrollmentProfile(
  database: D1DatabaseLike,
  profile: EnrollmentProfile,
): Promise<void> {
  await database
    .prepare(
      "UPDATE enrollment_profiles SET record_number = ?, child_first_name = ?, child_middle_name = ?, child_last_name = ?, child_suffix = ?, birth_date = ?, sex = ?, address = ?, guardian_full_name = ?, guardian_relationship = ?, guardian_contact_number = ?, school_year = ?, enrollment_date = ?, revision = ?, updated_at = ? WHERE id = ?",
    )
    .bind(
      profile.recordNumber,
      profile.childFirstName,
      profile.childMiddleName,
      profile.childLastName,
      profile.childSuffix,
      profile.birthDate,
      profile.sex,
      profile.address,
      profile.guardianFullName,
      profile.guardianRelationship,
      profile.guardianContactNumber,
      profile.schoolYear,
      profile.enrollmentDate,
      profile.revision,
      profile.updatedAt,
      profile.id,
    )
    .run();
}
