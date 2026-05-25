/**
 * src/features/staff/client/offline-vault.ts
 *
 * High-level offline vault orchestrator.
 * Combines vault.ts (Web Crypto) and staff-db.ts (IndexedDB).
 */

import * as vault from "./vault";
import type { WrappedKey } from "./vault";
import {
  profileStore,
  attendanceStore,
  operationQueueStore,
  userKeyStore,
  activationStore,
  syncMetaStore,
  resetLocalDatabase,
} from "./staff-db";
import type { ActivationMeta, SyncMeta } from "./staff-db";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";
import type { AttendanceRecord } from "@/features/staff/contracts/attendance-record";
import type { SyncOperation } from "@/features/staff/contracts/sync";

// ---------------------------------------------------------------------------
// Failed-PIN delay (in-memory, resets on page reload)
// ---------------------------------------------------------------------------

const MAX_PIN_ATTEMPTS = 5;
const BASE_DELAY_MS = 1_000;

let _failedPinAttempts = 0;
let _pinLockUntil = 0;

export function getPinLockStatus(): { locked: boolean; remainingMs: number; attempts: number } {
  const now = Date.now();
  const remainingMs = Math.max(0, _pinLockUntil - now);
  return { locked: remainingMs > 0, remainingMs, attempts: _failedPinAttempts };
}

// Exported for tests
export { MAX_PIN_ATTEMPTS };

function recordFailedPin(): void {
  _failedPinAttempts++;
  const delayMs = BASE_DELAY_MS * Math.pow(2, Math.min(_failedPinAttempts - 1, 6));
  _pinLockUntil = Date.now() + delayMs;
}

function resetPinAttempts(): void {
  _failedPinAttempts = 0;
  _pinLockUntil = 0;
}

// ---------------------------------------------------------------------------
// Activation / enroll
// ---------------------------------------------------------------------------

export async function enrollPin(userId: string, pin: string): Promise<void> {
  const { wrapped } = await vault.wrapNewDek(pin);
  await userKeyStore.put(userId, wrapped);
}

export async function saveActivationMeta(meta: ActivationMeta): Promise<void> {
  await activationStore.set(meta);
}

export async function getActivationMeta(): Promise<ActivationMeta | undefined> {
  return activationStore.get();
}

// ---------------------------------------------------------------------------
// Unlock / lock
// ---------------------------------------------------------------------------

export type UnlockResult =
  | { ok: true }
  | { ok: false; reason: "wrong_pin" | "pin_locked" | "not_enrolled" | "no_wrapped_key" };

export async function unlockVault(userId: string, pin: string): Promise<UnlockResult> {
  const { locked } = getPinLockStatus();
  if (locked) return { ok: false, reason: "pin_locked" };

  const wrapped: WrappedKey | undefined = await userKeyStore.get(userId);
  if (!wrapped) return { ok: false, reason: "no_wrapped_key" };

  const success = await vault.unlock(pin, wrapped);
  if (!success) {
    recordFailedPin();
    return { ok: false, reason: "wrong_pin" };
  }

  resetPinAttempts();
  return { ok: true };
}

export function lockVault(): void {
  vault.lock();
}

export function isVaultUnlocked(): boolean {
  return vault.isUnlocked();
}

// ---------------------------------------------------------------------------
// Profiles (encrypted)
// ---------------------------------------------------------------------------

export async function saveProfile(profile: EnrollmentProfile): Promise<void> {
  const payload = await vault.encryptJson(profile);
  await profileStore.put(profile.id, payload);
}

export async function loadProfile(id: string): Promise<EnrollmentProfile | null> {
  const payload = await profileStore.get(id);
  if (!payload) return null;
  return vault.decryptJson<EnrollmentProfile>(payload);
}

export async function loadAllProfiles(): Promise<EnrollmentProfile[]> {
  const entries = await profileStore.getAll();
  return Promise.all(entries.map(({ value }) => vault.decryptJson<EnrollmentProfile>(value)));
}

export async function deleteProfile(id: string): Promise<void> {
  await profileStore.delete(id);
}

// ---------------------------------------------------------------------------
// Attendance (encrypted)
// ---------------------------------------------------------------------------

export async function saveAttendance(record: AttendanceRecord): Promise<void> {
  const payload = await vault.encryptJson(record);
  await attendanceStore.put(record.id, payload);
}

export async function loadAttendance(id: string): Promise<AttendanceRecord | null> {
  const payload = await attendanceStore.get(id);
  if (!payload) return null;
  return vault.decryptJson<AttendanceRecord>(payload);
}

export async function loadAllAttendance(): Promise<AttendanceRecord[]> {
  const entries = await attendanceStore.getAll();
  return Promise.all(entries.map(({ value }) => vault.decryptJson<AttendanceRecord>(value)));
}

// ---------------------------------------------------------------------------
// Operation queue (outbox)
// ---------------------------------------------------------------------------

export async function enqueueOperation(op: SyncOperation): Promise<void> {
  const payload = await vault.encryptJson(op);
  await operationQueueStore.enqueue(op.operationId, payload);
  const current = (await syncMetaStore.get()) ?? { lastSyncedAt: null, pendingOperationCount: 0 };
  await syncMetaStore.set({ ...current, pendingOperationCount: current.pendingOperationCount + 1 });
}

export async function dequeueOperation(operationId: string): Promise<void> {
  await operationQueueStore.dequeue(operationId);
  const current = await syncMetaStore.get();
  if (current) {
    await syncMetaStore.set({
      ...current,
      pendingOperationCount: Math.max(0, current.pendingOperationCount - 1),
    });
  }
}

export async function loadAllQueuedOperations(): Promise<SyncOperation[]> {
  const entries = await operationQueueStore.getAll();
  return Promise.all(entries.map(({ value }) => vault.decryptJson<SyncOperation>(value)));
}

// ---------------------------------------------------------------------------
// Sync metadata
// ---------------------------------------------------------------------------

export async function getSyncMeta(): Promise<SyncMeta | null> {
  return (await syncMetaStore.get()) ?? null;
}

export async function updateSyncMeta(meta: Partial<SyncMeta>): Promise<void> {
  const current = (await syncMetaStore.get()) ?? { lastSyncedAt: null, pendingOperationCount: 0 };
  await syncMetaStore.set({ ...current, ...meta });
}

// ---------------------------------------------------------------------------
// Full local reset — DESTRUCTIVE, caller must confirm with user first
// ---------------------------------------------------------------------------

export async function resetAndWipeLocalData(): Promise<void> {
  vault.lock();
  await resetLocalDatabase();
  resetPinAttempts();
}
