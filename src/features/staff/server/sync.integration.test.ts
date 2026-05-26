// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  attendanceRecordFixture,
  exportAuditOperationFixture,
  syncedEnrollmentProfileFixture,
  unsyncedAttendanceUpdateOperationFixture,
  unsyncedCreateProfileOperationFixture,
} from "../contracts/fixtures";
import { hashPassword } from "./password.server";
import { createSessionCookie, issueSession } from "./session.server";
import { MemoryD1Database } from "./test-support";
import { handleStaffBootstrapRequest } from "@/routes/api/staff/bootstrap";
import { handleStaffSyncRequest } from "@/routes/api/staff/sync";

describe("staff bootstrap and sync API", () => {
  it("bootstraps profiles and attendance for the active device", async () => {
    const { database, cookie } = await createAuthenticatedDeviceContext();

    database.profiles.set(syncedEnrollmentProfileFixture.id, {
      ...syncedEnrollmentProfileFixture,
      childMiddleName: syncedEnrollmentProfileFixture.childMiddleName,
      childSuffix: syncedEnrollmentProfileFixture.childSuffix,
      recordNumber: syncedEnrollmentProfileFixture.recordNumber,
    });
    database.attendanceRecords.set(attendanceRecordFixture.id, {
      ...attendanceRecordFixture,
      note: attendanceRecordFixture.note,
    });
    database.deviceSyncStatus.set("device-001", {
      deviceId: "device-001",
      revision: 2,
      lastSyncedAt: "2026-05-25T09:00:00.000Z",
    });

    const response = await handleStaffBootstrapRequest({
      db: database,
      request: new Request("https://example.test/api/staff/bootstrap?deviceId=device-001", {
        headers: { cookie },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      profiles: [syncedEnrollmentProfileFixture],
      attendanceRecords: [attendanceRecordFixture],
      syncedAt: "2026-05-25T09:00:00.000Z",
    });
  });

  it("rejects bootstrap when the requested device is not active", async () => {
    const { database, cookie } = await createAuthenticatedDeviceContext();

    const response = await handleStaffBootstrapRequest({
      db: database,
      request: new Request("https://example.test/api/staff/bootstrap?deviceId=device-999", {
        headers: { cookie },
      }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "DEVICE_NOT_ACTIVE" });
  });

  it("synchronizes profile creation, attendance upsert, export audit, and replays idempotently", async () => {
    const { database, cookie } = await createAuthenticatedDeviceContext();

    database.profiles.set(syncedEnrollmentProfileFixture.id, {
      ...syncedEnrollmentProfileFixture,
      childMiddleName: syncedEnrollmentProfileFixture.childMiddleName,
      childSuffix: syncedEnrollmentProfileFixture.childSuffix,
      recordNumber: syncedEnrollmentProfileFixture.recordNumber,
    });
    database.deviceSyncStatus.set("device-001", {
      deviceId: "device-001",
      revision: 1,
      lastSyncedAt: "2026-05-25T08:30:00.000Z",
    });

    const operations = [
      unsyncedCreateProfileOperationFixture,
      {
        ...unsyncedAttendanceUpdateOperationFixture,
        attendance: {
          ...unsyncedAttendanceUpdateOperationFixture.attendance,
          profileId: unsyncedCreateProfileOperationFixture.profile.id,
          recordedByUserId: "staff-1",
        },
        baseRevision: null,
      },
      exportAuditOperationFixture,
    ];

    const response = await handleStaffSyncRequest({
      db: database,
      request: new Request("https://example.test/api/staff/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          origin: "https://example.test",
        },
        body: JSON.stringify({
          deviceId: "device-001",
          lastSyncedAt: "2026-05-25T08:30:00.000Z",
          operations,
        }),
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.acknowledgedOperationIds).toEqual(
      operations.map((operation) => operation.operationId),
    );
    expect(body.profiles).toHaveLength(2);
    expect(
      body.profiles.find((profile: { id: string }) => profile.id === "profile-local-001"),
    ).toMatchObject({
      recordNumber: "DCC-000002",
      revision: 1,
    });
    expect(body.attendanceRecords).toContainEqual(
      expect.objectContaining({
        id: unsyncedAttendanceUpdateOperationFixture.attendance.id,
        revision: 1,
      }),
    );
    expect(database.syncOperations).toHaveLength(3);
    expect(database.syncOperations[0]).toMatchObject({
      deviceId: "device-001",
      userId: "staff-1",
      operationId: operations[0].operationId,
      processedAt: expect.any(String),
    });
    expect(JSON.parse(database.syncOperations[0].payloadJson)).toEqual(operations[0]);
    expect(database.auditEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "staff.profile.created",
        "staff.attendance.upserted",
        "staff.export-audit.recorded",
        "staff.sync.succeeded",
      ]),
    );

    const replay = await handleStaffSyncRequest({
      db: database,
      request: new Request("https://example.test/api/staff/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          origin: "https://example.test",
        },
        body: JSON.stringify({
          deviceId: "device-001",
          lastSyncedAt: body.syncedAt,
          operations,
        }),
      }),
    });

    expect(replay.status).toBe(200);
    const replayBody = await replay.json();
    expect(replayBody.acknowledgedOperationIds).toEqual(
      operations.map((operation) => operation.operationId),
    );
    expect(database.syncOperations).toHaveLength(3);
    expect(
      database.auditEvents.filter((event) => event.eventType === "staff.profile.created"),
    ).toHaveLength(1);
  });

  it("returns REFRESH_REQUIRED when a profile revision mismatches", async () => {
    const { database, cookie } = await createAuthenticatedDeviceContext();

    database.profiles.set(syncedEnrollmentProfileFixture.id, {
      ...syncedEnrollmentProfileFixture,
      childMiddleName: syncedEnrollmentProfileFixture.childMiddleName,
      childSuffix: syncedEnrollmentProfileFixture.childSuffix,
      recordNumber: syncedEnrollmentProfileFixture.recordNumber,
    });
    database.deviceSyncStatus.set("device-001", {
      deviceId: "device-001",
      revision: 3,
      lastSyncedAt: "2026-05-25T09:15:00.000Z",
    });

    const response = await handleStaffSyncRequest({
      db: database,
      request: new Request("https://example.test/api/staff/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          origin: "https://example.test",
        },
        body: JSON.stringify({
          deviceId: "device-001",
          lastSyncedAt: "2026-05-25T09:15:00.000Z",
          operations: [
            {
              operationId: "op-update-profile-conflict",
              kind: "updateProfile",
              clientRecordedAt: "2026-05-25T09:16:00.000Z",
              baseRevision: 1,
              profile: {
                ...syncedEnrollmentProfileFixture,
                childFirstName: "Updated Ana",
                updatedAt: "2026-05-25T09:16:00.000Z",
                revision: 1,
              },
            },
          ],
        }),
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: "REFRESH_REQUIRED",
      acknowledgedOperationIds: [],
      profiles: [syncedEnrollmentProfileFixture],
      attendanceRecords: [],
      syncedAt: "2026-05-25T09:15:00.000Z",
    });
    expect(database.syncOperations).toHaveLength(0);
    expect(
      database.auditEvents.filter((event) => event.eventType === "staff.sync.conflict"),
    ).toHaveLength(1);
  });
});

async function createAuthenticatedDeviceContext() {
  const database = new MemoryD1Database();
  database.users.set("staff-1", {
    id: "staff-1",
    username: "staff",
    usernameNormalized: "staff",
    displayName: "Staff User",
    role: "staff",
    passwordHash: await hashPassword("StaffPassword!2026"),
    isActive: 1,
    createdAt: "2026-05-25T08:00:00.000Z",
    updatedAt: "2026-05-25T08:00:00.000Z",
    deactivatedAt: null,
  });
  database.devices.set("device-001", {
    deviceId: "device-001",
    deviceName: "Office Desktop",
    activatedByUserId: "staff-1",
    activatedAt: "2026-05-25T08:15:00.000Z",
    deactivatedAt: null,
    deactivatedByUserId: null,
  });

  const issued = await issueSession(database, { userId: "staff-1" });

  return {
    database,
    cookie: createSessionCookie(issued.token),
  };
}
