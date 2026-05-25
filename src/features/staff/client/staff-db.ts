/**
 * src/features/staff/client/staff-db.ts
 *
 * IndexedDB schema for the encrypted staff offline store.
 *
 * Stores:
 *  - encrypted_profiles        : profileId → EncryptedPayload
 *  - encrypted_attendance      : attendanceId → EncryptedPayload
 *  - operation_queue           : operationId → EncryptedPayload (queued sync ops)
 *  - authorized_user_keys      : userId → WrappedKey (PIN-wrapped DEK per user)
 *  - activation_metadata       : "activation" → ActivationMeta (device info)
 *  - sync_metadata             : "sync" → SyncMeta (last synced timestamps)
 *
 * All personal data is stored encrypted. Non-personal metadata (deviceId,
 * syncedAt) is stored in plaintext for operational correctness.
 */

import type { EncryptedPayload, WrappedKey } from "./vault";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_NAME = "dccms-staff";
const DB_VERSION = 1;

// Store names
export const STORES = {
  ENCRYPTED_PROFILES: "encrypted_profiles",
  ENCRYPTED_ATTENDANCE: "encrypted_attendance",
  OPERATION_QUEUE: "operation_queue",
  AUTHORIZED_USER_KEYS: "authorized_user_keys",
  ACTIVATION_METADATA: "activation_metadata",
  SYNC_METADATA: "sync_metadata",
} as const;

// ---------------------------------------------------------------------------
// Metadata types (stored in plaintext — no personal data)
// ---------------------------------------------------------------------------

export type ActivationMeta = {
  deviceId: string;
  deviceName: string;
  activatedAt: string;
};

export type SyncMeta = {
  lastSyncedAt: string | null;
  pendingOperationCount: number;
};

// ---------------------------------------------------------------------------
// DB initialization
// ---------------------------------------------------------------------------

let _dbPromise: Promise<IDBDatabase> | null = null;

export function openStaffDb(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Encrypted data stores — key is the record ID
      if (!db.objectStoreNames.contains(STORES.ENCRYPTED_PROFILES)) {
        db.createObjectStore(STORES.ENCRYPTED_PROFILES); // keyPath not used; key per put()
      }
      if (!db.objectStoreNames.contains(STORES.ENCRYPTED_ATTENDANCE)) {
        db.createObjectStore(STORES.ENCRYPTED_ATTENDANCE);
      }
      if (!db.objectStoreNames.contains(STORES.OPERATION_QUEUE)) {
        db.createObjectStore(STORES.OPERATION_QUEUE);
      }

      // Per-user wrapped key store — key is userId
      if (!db.objectStoreNames.contains(STORES.AUTHORIZED_USER_KEYS)) {
        db.createObjectStore(STORES.AUTHORIZED_USER_KEYS);
      }

      // Singleton metadata stores — key is a fixed string constant
      if (!db.objectStoreNames.contains(STORES.ACTIVATION_METADATA)) {
        db.createObjectStore(STORES.ACTIVATION_METADATA);
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
        db.createObjectStore(STORES.SYNC_METADATA);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return _dbPromise;
}

// ---------------------------------------------------------------------------
// Generic IDB helpers
// ---------------------------------------------------------------------------

async function idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openStaffDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut<T>(storeName: string, key: IDBValidKey, value: T): Promise<void> {
  const db = await openStaffDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openStaffDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll<T>(storeName: string): Promise<{ key: IDBValidKey; value: T }[]> {
  const db = await openStaffDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const results: { key: IDBValidKey; value: T }[] = [];

    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result;
      const valuesReq = store.getAll();
      valuesReq.onsuccess = () => {
        const values = valuesReq.result as T[];
        keys.forEach((k, i) => results.push({ key: k, value: values[i] }));
        resolve(results);
      };
      valuesReq.onerror = () => reject(valuesReq.error);
    };
    keysReq.onerror = () => reject(keysReq.error);
  });
}

async function idbClear(storeName: string): Promise<void> {
  const db = await openStaffDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Encrypted profile store
// ---------------------------------------------------------------------------

export const profileStore = {
  get: (id: string) => idbGet<EncryptedPayload>(STORES.ENCRYPTED_PROFILES, id),
  put: (id: string, payload: EncryptedPayload) => idbPut(STORES.ENCRYPTED_PROFILES, id, payload),
  delete: (id: string) => idbDelete(STORES.ENCRYPTED_PROFILES, id),
  getAll: () => idbGetAll<EncryptedPayload>(STORES.ENCRYPTED_PROFILES),
  clear: () => idbClear(STORES.ENCRYPTED_PROFILES),
};

// ---------------------------------------------------------------------------
// Encrypted attendance store
// ---------------------------------------------------------------------------

export const attendanceStore = {
  get: (id: string) => idbGet<EncryptedPayload>(STORES.ENCRYPTED_ATTENDANCE, id),
  put: (id: string, payload: EncryptedPayload) => idbPut(STORES.ENCRYPTED_ATTENDANCE, id, payload),
  delete: (id: string) => idbDelete(STORES.ENCRYPTED_ATTENDANCE, id),
  getAll: () => idbGetAll<EncryptedPayload>(STORES.ENCRYPTED_ATTENDANCE),
  clear: () => idbClear(STORES.ENCRYPTED_ATTENDANCE),
};

// ---------------------------------------------------------------------------
// Operation queue store (outbox for pending sync operations)
// ---------------------------------------------------------------------------

export const operationQueueStore = {
  get: (operationId: string) => idbGet<EncryptedPayload>(STORES.OPERATION_QUEUE, operationId),
  enqueue: (operationId: string, payload: EncryptedPayload) =>
    idbPut(STORES.OPERATION_QUEUE, operationId, payload),
  dequeue: (operationId: string) => idbDelete(STORES.OPERATION_QUEUE, operationId),
  getAll: () => idbGetAll<EncryptedPayload>(STORES.OPERATION_QUEUE),
  clear: () => idbClear(STORES.OPERATION_QUEUE),
};

// ---------------------------------------------------------------------------
// Authorized user keys store (per-user wrapped DEK)
// ---------------------------------------------------------------------------

export const userKeyStore = {
  get: (userId: string) => idbGet<WrappedKey>(STORES.AUTHORIZED_USER_KEYS, userId),
  put: (userId: string, wrappedKey: WrappedKey) =>
    idbPut(STORES.AUTHORIZED_USER_KEYS, userId, wrappedKey),
  delete: (userId: string) => idbDelete(STORES.AUTHORIZED_USER_KEYS, userId),
  getAll: () => idbGetAll<WrappedKey>(STORES.AUTHORIZED_USER_KEYS),
};

// ---------------------------------------------------------------------------
// Activation metadata store
// ---------------------------------------------------------------------------

const ACTIVATION_KEY = "activation";

export const activationStore = {
  get: () => idbGet<ActivationMeta>(STORES.ACTIVATION_METADATA, ACTIVATION_KEY),
  set: (meta: ActivationMeta) => idbPut(STORES.ACTIVATION_METADATA, ACTIVATION_KEY, meta),
  clear: () => idbDelete(STORES.ACTIVATION_METADATA, ACTIVATION_KEY),
};

// ---------------------------------------------------------------------------
// Sync metadata store
// ---------------------------------------------------------------------------

const SYNC_KEY = "sync";

export const syncMetaStore = {
  get: () => idbGet<SyncMeta>(STORES.SYNC_METADATA, SYNC_KEY),
  set: (meta: SyncMeta) => idbPut(STORES.SYNC_METADATA, SYNC_KEY, meta),
};

// ---------------------------------------------------------------------------
// Full local reset (with warning: unsynced data will be unrecoverable)
// ---------------------------------------------------------------------------

/**
 * Wipe all local data stores — profiles, attendance, queue, keys.
 *
 * ⚠️  WARN THE USER BEFORE CALLING THIS.
 * Unsynced local changes cannot be recovered after reset.
 * Activation metadata and sync timestamps are also cleared.
 */
export async function resetLocalDatabase(): Promise<void> {
  await Promise.all([
    profileStore.clear(),
    attendanceStore.clear(),
    operationQueueStore.clear(),
    idbClear(STORES.AUTHORIZED_USER_KEYS),
    activationStore.clear(),
  ]);
}
