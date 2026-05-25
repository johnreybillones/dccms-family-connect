/**
 * src/features/staff/client/profile-repository.ts
 *
 * High-level repository for EnrollmentProfile operations.
 * All writes save to the encrypted local IndexedDB store first, then
 * enqueue a SyncOperation in the outbox.  A separate sync pass will
 * drain the outbox and push to the server when connectivity returns.
 *
 * Read operations decrypt directly from the local store; they never
 * require a network round-trip.
 *
 * Duplicate detection: normalises first + last name + birth-date and
 * checks against all locally-known profiles.
 */

import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";
import { getEnrollmentDuplicateKey } from "@/features/staff/contracts/enrollment-profile";
import { saveProfile, loadProfile, loadAllProfiles, enqueueOperation } from "./offline-vault";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export type CreateProfileInput = Omit<
  EnrollmentProfile,
  "id" | "recordNumber" | "revision" | "createdAt" | "updatedAt"
>;

/**
 * Create a new EnrollmentProfile locally and enqueue a `createProfile`
 * operation for the next sync pass.
 *
 * The new profile is assigned a local UUID.  `recordNumber` is `null`
 * until the server acknowledges the operation and returns the canonical
 * `DCC-000001` number.
 */
export async function createProfile(input: CreateProfileInput): Promise<EnrollmentProfile> {
  const now = nowIso();
  const profile: EnrollmentProfile = {
    id: crypto.randomUUID(),
    recordNumber: null,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    ...input,
  };

  await saveProfile(profile);
  await enqueueOperation({
    operationId: crypto.randomUUID(),
    kind: "createProfile",
    clientRecordedAt: now,
    profile,
  });

  return profile;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export type UpdateProfileInput = Partial<
  Omit<EnrollmentProfile, "id" | "recordNumber" | "revision" | "createdAt" | "updatedAt">
>;

/**
 * Update an existing profile locally and enqueue an `updateProfile`
 * operation.
 *
 * Throws if the profile is not found in the local store.
 */
export async function updateProfile(
  id: string,
  changes: UpdateProfileInput,
): Promise<EnrollmentProfile> {
  const existing = await loadProfile(id);
  if (!existing) throw new Error(`Profile ${id} not found in local store.`);

  const now = nowIso();
  const updated: EnrollmentProfile = {
    ...existing,
    ...changes,
    updatedAt: now,
  };

  await saveProfile(updated);
  await enqueueOperation({
    operationId: crypto.randomUUID(),
    kind: "updateProfile",
    clientRecordedAt: now,
    baseRevision: existing.revision,
    profile: updated,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Load a single profile by ID from the encrypted local store. */
export async function getProfile(id: string): Promise<EnrollmentProfile | null> {
  return loadProfile(id);
}

/** Load all profiles from the encrypted local store. */
export async function listProfiles(): Promise<EnrollmentProfile[]> {
  return loadAllProfiles();
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

export type PossibleDuplicate = {
  profile: EnrollmentProfile;
  matchKey: string;
};

/**
 * Return locally-stored profiles whose normalized first + last name + birth
 * date match the supplied values.  Excludes `excludeId` (useful when editing
 * so the record being edited is not flagged as its own duplicate).
 */
export async function findPossibleDuplicates(
  firstName: string,
  lastName: string,
  birthDate: string,
  excludeId?: string,
): Promise<PossibleDuplicate[]> {
  const candidateKey = getEnrollmentDuplicateKey({
    childFirstName: firstName,
    childLastName: lastName,
    birthDate,
  });

  const all = await loadAllProfiles();
  return all
    .filter((p) => {
      if (excludeId && p.id === excludeId) return false;
      return getEnrollmentDuplicateKey(p) === candidateKey;
    })
    .map((profile) => ({ profile, matchKey: candidateKey }));
}

// ---------------------------------------------------------------------------
// Search / filter helpers (pure — no IO)
// ---------------------------------------------------------------------------

/**
 * Filter profiles by a search term (child name or record number).
 * Matching is case-insensitive and trims whitespace.
 */
export function filterProfiles(profiles: EnrollmentProfile[], query: string): EnrollmentProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return profiles;

  return profiles.filter((p) => {
    const fullName =
      `${p.childFirstName} ${p.childMiddleName ?? ""} ${p.childLastName}`.toLowerCase();
    const rn = (p.recordNumber ?? "").toLowerCase();
    return fullName.includes(q) || rn.includes(q);
  });
}
