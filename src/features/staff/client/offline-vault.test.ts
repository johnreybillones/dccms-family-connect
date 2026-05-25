/**
 * src/features/staff/client/offline-vault.test.ts
 *
 * Unit tests for the offline-vault orchestrator.
 * Uses jsdom + vitest; Web Crypto is shimmed by the @peculiar/webcrypto polyfill
 * (available in Node via globalThis.crypto in Node 18+).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the staff-db module so tests do not open a real IndexedDB
vi.mock("./staff-db", () => {
  const store: Record<string, unknown> = {};
  const makeStore = (prefix: string) => ({
    get: async (id: string) => store[`${prefix}:${id}`],
    put: async (id: string, val: unknown) => {
      store[`${prefix}:${id}`] = val;
    },
    delete: async (id: string) => {
      delete store[`${prefix}:${id}`];
    },
    getAll: async () =>
      Object.entries(store)
        .filter(([k]) => k.startsWith(`${prefix}:`))
        .map(([k, v]) => ({ key: k.slice(prefix.length + 1), value: v })),
    clear: async () => {
      Object.keys(store)
        .filter((k) => k.startsWith(`${prefix}:`))
        .forEach((k) => delete store[k]);
    },
  });

  const enqueueStore = makeStore("opQueue");
  return {
    profileStore: makeStore("profile"),
    attendanceStore: makeStore("attendance"),
    operationQueueStore: {
      ...enqueueStore,
      enqueue: enqueueStore.put,
      dequeue: enqueueStore.delete,
    },
    userKeyStore: makeStore("userKey"),
    activationStore: {
      get: async () => store["activation"],
      set: async (v: unknown) => {
        store["activation"] = v;
      },
      clear: async () => {
        delete store["activation"];
      },
    },
    syncMetaStore: {
      get: async () => store["sync"],
      set: async (v: unknown) => {
        store["sync"] = v;
      },
    },
    resetLocalDatabase: async () => Object.keys(store).forEach((k) => delete store[k]),
  };
});

import {
  enrollPin,
  unlockVault,
  lockVault,
  isVaultUnlocked,
  saveProfile,
  loadProfile,
  getPinLockStatus,
  MAX_PIN_ATTEMPTS,
  resetAndWipeLocalData,
  saveActivationMeta,
  getActivationMeta,
} from "./offline-vault";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_USER_ID = "user-001";
const CORRECT_PIN = "123456";
const WRONG_PIN = "000000";

const SAMPLE_PROFILE: EnrollmentProfile = {
  id: "p-001",
  recordNumber: null,
  childFirstName: "Maria",
  childMiddleName: null,
  childLastName: "Santos",
  childSuffix: null,
  birthDate: "2020-06-15",
  sex: "Female",
  address: "123 Sampaguita St.",
  guardianFullName: "Juan Santos",
  guardianRelationship: "Father",
  guardianContactNumber: "09171234567",
  schoolYear: "2025-2026",
  enrollmentDate: "2025-06-01",
  revision: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("offline-vault: PIN enroll and unlock", () => {
  beforeEach(async () => {
    lockVault();
  });

  it("enrolls a PIN and unlocks the vault successfully", async () => {
    await enrollPin(TEST_USER_ID, CORRECT_PIN);
    expect(isVaultUnlocked()).toBe(false);

    const result = await unlockVault(TEST_USER_ID, CORRECT_PIN);
    expect(result.ok).toBe(true);
    expect(isVaultUnlocked()).toBe(true);
  });

  it("returns wrong_pin for an incorrect PIN", async () => {
    await enrollPin(TEST_USER_ID, CORRECT_PIN);

    const result = await unlockVault(TEST_USER_ID, WRONG_PIN);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("wrong_pin");
    expect(isVaultUnlocked()).toBe(false);
  });

  it("returns no_wrapped_key when user has not enrolled", async () => {
    const result = await unlockVault("unknown-user", CORRECT_PIN);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_wrapped_key");
  });

  it("locks the vault on lockVault()", async () => {
    await enrollPin(TEST_USER_ID, CORRECT_PIN);
    await unlockVault(TEST_USER_ID, CORRECT_PIN);
    expect(isVaultUnlocked()).toBe(true);

    lockVault();
    expect(isVaultUnlocked()).toBe(false);
  });
});

describe("offline-vault: encrypted profile CRUD", () => {
  beforeEach(async () => {
    lockVault();
    await enrollPin(TEST_USER_ID, CORRECT_PIN);
    await unlockVault(TEST_USER_ID, CORRECT_PIN);
  });

  it("saves and loads a profile round-trip", async () => {
    await saveProfile(SAMPLE_PROFILE);
    const loaded = await loadProfile(SAMPLE_PROFILE.id);
    expect(loaded).toMatchObject({
      id: SAMPLE_PROFILE.id,
      childFirstName: "Maria",
      childLastName: "Santos",
    });
  });

  it("throws when vault is locked", async () => {
    lockVault();
    await expect(saveProfile(SAMPLE_PROFILE)).rejects.toThrow("Vault is locked");
  });
});

describe("offline-vault: PIN lock delay", () => {
  beforeEach(() => {
    lockVault();
  });

  it("starts with no lock", () => {
    const { locked, attempts } = getPinLockStatus();
    expect(locked).toBe(false);
    expect(attempts).toBe(0);
  });
});

describe("offline-vault: activation metadata", () => {
  it("saves and retrieves activation metadata", async () => {
    await saveActivationMeta({
      deviceId: "dev-001",
      deviceName: "Office Desktop",
      activatedAt: "2026-05-25T00:00:00Z",
    });
    const meta = await getActivationMeta();
    expect(meta?.deviceId).toBe("dev-001");
  });
});

describe("offline-vault: reset", () => {
  it("wipes vault and data on reset", async () => {
    await enrollPin(TEST_USER_ID, CORRECT_PIN);
    await unlockVault(TEST_USER_ID, CORRECT_PIN);
    await saveProfile(SAMPLE_PROFILE);

    await resetAndWipeLocalData();

    expect(isVaultUnlocked()).toBe(false);
    // After reset, user key is gone — unlock should fail with no_wrapped_key
    const result = await unlockVault(TEST_USER_ID, CORRECT_PIN);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_wrapped_key");
  });
});
