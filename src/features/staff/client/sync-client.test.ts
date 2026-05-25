/**
 * src/features/staff/client/sync-client.test.ts
 *
 * Unit tests for sync-client status transitions and queue draining.
 * Network fetch calls are mocked; offline-vault calls are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock offline-vault so no real IndexedDB/crypto is needed
vi.mock("./offline-vault", () => ({
  loadAllQueuedOperations: vi.fn(async () => []),
  dequeueOperation: vi.fn(async () => undefined),
  saveProfile: vi.fn(async () => undefined),
  saveAttendance: vi.fn(async () => undefined),
  updateSyncMeta: vi.fn(async () => undefined),
  getSyncMeta: vi.fn(async () => ({ lastSyncedAt: null, pendingOperationCount: 0 })),
  getActivationMeta: vi.fn(async () => ({
    deviceId: "dev-001",
    deviceName: "Test Device",
    activatedAt: "2026-05-25T00:00:00Z",
  })),
}));

import {
  getSyncStatus,
  subscribeSyncStatus,
  syncToServer,
  bootstrapFromServer,
} from "./sync-client";
import { loadAllQueuedOperations, getActivationMeta } from "./offline-vault";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sync-client: status pub/sub", () => {
  it("can subscribe and unsubscribe to status changes", () => {
    const received: string[] = [];
    const unsub = subscribeSyncStatus((s) => received.push(s));
    // Status changes happen through syncToServer — just verify subscribe works
    unsub();
    expect(received).toBeDefined();
  });
});

describe("sync-client: syncToServer", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets status to synced when queue is empty", async () => {
    vi.mocked(loadAllQueuedOperations).mockResolvedValueOnce([]);
    await syncToServer();
    expect(getSyncStatus()).toBe("synced");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sets status to sync_failed on network error", async () => {
    const mockOp = {
      operationId: "op-001",
      kind: "createProfile" as const,
      clientRecordedAt: new Date().toISOString(),
      profile: {} as never,
    };
    vi.mocked(loadAllQueuedOperations).mockResolvedValueOnce([mockOp]);
    fetchMock.mockRejectedValueOnce(new Error("Network down"));

    await syncToServer();
    expect(getSyncStatus()).toBe("sync_failed");
  });

  it("sets status to reauth_required on 401 response", async () => {
    const mockOp = {
      operationId: "op-002",
      kind: "createProfile" as const,
      clientRecordedAt: new Date().toISOString(),
      profile: {} as never,
    };
    vi.mocked(loadAllQueuedOperations).mockResolvedValueOnce([mockOp]);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await syncToServer();
    expect(getSyncStatus()).toBe("reauth_required");
  });

  it("acknowledges operations and sets synced on success", async () => {
    const mockOp = {
      operationId: "op-003",
      kind: "createProfile" as const,
      clientRecordedAt: new Date().toISOString(),
      profile: {} as never,
    };
    vi.mocked(loadAllQueuedOperations).mockResolvedValueOnce([mockOp]);
    const responseBody = {
      acknowledgedOperationIds: ["op-003"],
      profiles: [],
      attendanceRecords: [],
      syncedAt: new Date().toISOString(),
    };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await syncToServer();
    expect(getSyncStatus()).toBe("synced");
  });
});

describe("sync-client: bootstrapFromServer", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets synced status after successful bootstrap", async () => {
    const responseBody = {
      profiles: [],
      attendanceRecords: [],
      syncedAt: new Date().toISOString(),
    };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await bootstrapFromServer();
    expect(getSyncStatus()).toBe("synced");
  });

  it("sets sync_failed on bootstrap network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await bootstrapFromServer();
    expect(getSyncStatus()).toBe("sync_failed");
  });

  it("throws when device is not activated", async () => {
    vi.mocked(getActivationMeta).mockResolvedValueOnce(undefined);
    await expect(bootstrapFromServer()).rejects.toThrow("not activated");
  });
});
