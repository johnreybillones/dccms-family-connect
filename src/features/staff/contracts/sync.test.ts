import { describe, expect, it } from "vitest";

import {
  exportAuditOperationFixture,
  unsyncedAttendanceUpdateOperationFixture,
  unsyncedCreateProfileOperationFixture,
} from "./fixtures";
import { syncPayloadSchema, syncStatusSchema } from "./sync";

describe("sync contracts", () => {
  it("accepts create, attendance upsert, and export audit operation variants", () => {
    const payload = syncPayloadSchema.parse({
      deviceId: "device-001",
      lastSyncedAt: null,
      operations: [
        unsyncedCreateProfileOperationFixture,
        unsyncedAttendanceUpdateOperationFixture,
        exportAuditOperationFixture,
      ],
    });

    expect(payload.operations).toHaveLength(3);
    expect(payload.operations[0]?.kind).toBe("createProfile");
    expect(payload.operations[1]?.kind).toBe("upsertAttendance");
    expect(payload.operations[2]?.kind).toBe("recordExportAudit");
  });

  it("parses all supported sync statuses", () => {
    expect(syncStatusSchema.parse("offline")).toBe("offline");
    expect(syncStatusSchema.parse("saved_locally")).toBe("saved_locally");
    expect(syncStatusSchema.parse("syncing")).toBe("syncing");
    expect(syncStatusSchema.parse("synced")).toBe("synced");
    expect(syncStatusSchema.parse("sync_failed")).toBe("sync_failed");
    expect(syncStatusSchema.parse("reauth_required")).toBe("reauth_required");
  });

  it("rejects sync payloads without operations", () => {
    expect(() =>
      syncPayloadSchema.parse({
        deviceId: "device-001",
        lastSyncedAt: null,
        operations: [],
      }),
    ).toThrow(/operations/i);
  });
});
