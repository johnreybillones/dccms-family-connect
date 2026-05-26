/**
 * src/features/staff/client/sync-client.ts
 *
 * Synchronization client — bridges the local encrypted offline store
 * and the POST /api/staff/sync endpoint.
 *
 * Lifecycle:
 *   1. bootstrapFromServer() — download all server-side records on first activation.
 *   2. syncToServer()        — drain the operation queue, upload, and merge replies.
 *   3. SyncStatus type tracks UI-visible states.
 */

import type { SyncStatus, SyncOperation } from "@/features/staff/contracts/sync";
import {
  loadAllQueuedOperations,
  dequeueOperation,
  saveProfile,
  saveAttendance,
  updateSyncMeta,
} from "./offline-vault";
import { getActivationMeta } from "./offline-vault";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";
import type { AttendanceRecord } from "@/features/staff/contracts/attendance-record";

export type { SyncStatus };

// ---------------------------------------------------------------------------
// Types for server sync response
// ---------------------------------------------------------------------------

type BootstrapResponse = {
  profiles: EnrollmentProfile[];
  attendanceRecords: AttendanceRecord[];
  syncedAt: string;
};

type SyncResponse = {
  acknowledgedOperationIds: string[];
  profiles: EnrollmentProfile[];
  attendanceRecords: AttendanceRecord[];
  syncedAt: string;
};

// ---------------------------------------------------------------------------
// Status subscribers (lightweight pub/sub for SyncStatus UI updates)
// ---------------------------------------------------------------------------

let _status: SyncStatus = "offline";
const _statusListeners = new Set<(s: SyncStatus) => void>();

export function getSyncStatus(): SyncStatus {
  return _status;
}

export function subscribeSyncStatus(fn: (s: SyncStatus) => void): () => void {
  _statusListeners.add(fn);
  return () => _statusListeners.delete(fn);
}

function setStatus(s: SyncStatus): void {
  _status = s;
  _statusListeners.forEach((fn) => fn(s));
}

// ---------------------------------------------------------------------------
// Bootstrap: initial data load from server
// ---------------------------------------------------------------------------

export async function bootstrapFromServer(): Promise<void> {
  const activation = await getActivationMeta();
  if (!activation) throw new Error("Device is not activated.");

  setStatus("syncing");
  try {
    const res = await fetch(
      `/api/staff/bootstrap?deviceId=${encodeURIComponent(activation.deviceId)}`,
      { credentials: "same-origin", cache: "no-store" },
    );

    if (res.status === 401) {
      setStatus("reauth_required");
      return;
    }

    if (res.status === 403) {
      // Clear local activation metadata so user is forced to re-activate the device
      const { activationStore } = await import("./staff-db");
      await activationStore.clear();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      return;
    }

    if (!res.ok) {
      setStatus("sync_failed");
      return;
    }

    const data: BootstrapResponse = await res.json();

    await Promise.all([
      ...data.profiles.map((p) => saveProfile(p)),
      ...data.attendanceRecords.map((a) => saveAttendance(a)),
    ]);

    await updateSyncMeta({ lastSyncedAt: data.syncedAt, pendingOperationCount: 0 });
    setStatus("synced");
  } catch {
    setStatus(navigator.onLine ? "sync_failed" : "offline");
  }
}

// ---------------------------------------------------------------------------
// Sync: drain queue and push to server
// ---------------------------------------------------------------------------

export async function syncToServer(): Promise<void> {
  const activation = await getActivationMeta();
  if (!activation) {
    setStatus("offline");
    return;
  }

  const ops: SyncOperation[] = await loadAllQueuedOperations();
  if (ops.length === 0) {
    setStatus("synced");
    return;
  }

  setStatus("syncing");
  try {
    const { lastSyncedAt } = (await import("./offline-vault").then((m) => m.getSyncMeta())) ?? {
      lastSyncedAt: null,
    };

    const res = await fetch("/api/staff/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        deviceId: activation.deviceId,
        operations: ops,
        lastSyncedAt,
      }),
    });

    if (res.status === 401) {
      setStatus("reauth_required");
      return;
    }
    if (res.status === 403) {
      // Clear local activation metadata so user is forced to re-activate the device
      const { activationStore } = await import("./staff-db");
      await activationStore.clear();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      return;
    }
    if (!res.ok) {
      setStatus("sync_failed");
      return;
    }

    const data: SyncResponse = await res.json();

    // Dequeue acknowledged operations
    await Promise.all(data.acknowledgedOperationIds.map((id) => dequeueOperation(id)));

    // Merge server-authoritative records back into local store
    await Promise.all([
      ...data.profiles.map((p) => saveProfile(p)),
      ...data.attendanceRecords.map((a) => saveAttendance(a)),
    ]);

    const remaining = ops.length - data.acknowledgedOperationIds.length;
    await updateSyncMeta({ lastSyncedAt: data.syncedAt, pendingOperationCount: remaining });
    setStatus(remaining > 0 ? "saved_locally" : "synced");
  } catch {
    setStatus(navigator.onLine ? "sync_failed" : "offline");
  }
}

// ---------------------------------------------------------------------------
// Online/offline detection — update status on network changes
// ---------------------------------------------------------------------------

export function startNetworkMonitor(): () => void {
  const onOnline = () => {
    if (_status === "offline" || _status === "sync_failed") {
      syncToServer().catch(() => setStatus("sync_failed"));
    }
  };
  const onOffline = () => setStatus("offline");

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  // Set initial status asynchronously to avoid showing confusing 'saved_locally' status
  if (!navigator.onLine) {
    setStatus("offline");
  } else {
    loadAllQueuedOperations()
      .then((ops) => {
        if (_status === "offline") return;
        setStatus(ops.length > 0 ? "saved_locally" : "synced");
      })
      .catch(() => {
        if (_status === "offline") return;
        setStatus(navigator.onLine ? "sync_failed" : "offline");
      });
  }

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
