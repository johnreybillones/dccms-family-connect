// @vitest-environment node

import { describe, expect, it } from "vitest";

import { hashPassword } from "./password.server";
import { createSessionCookie, issueSession } from "./session.server";
import { MemoryD1Database } from "./test-support";
import { handleDeviceActivateRequest } from "@/routes/api/staff/device/activate";
import { handleDeviceDeactivateRequest } from "@/routes/api/staff/device/deactivate";

describe("device API", () => {
  it("activates a device for an administrator", async () => {
    const database = new MemoryD1Database();
    database.users.set("admin-1", {
      id: "admin-1",
      username: "admin",
      usernameNormalized: "admin",
      displayName: "Administrator",
      role: "administrator",
      passwordHash: await hashPassword("AdminPassword!2026"),
      isActive: 1,
      createdAt: "2026-05-25T08:00:00.000Z",
      updatedAt: "2026-05-25T08:00:00.000Z",
      deactivatedAt: null,
    });

    const issued = await issueSession(database, { userId: "admin-1" });
    const response = await handleDeviceActivateRequest({
      db: database,
      request: new Request("https://example.test/api/staff/device/activate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: createSessionCookie(issued.token),
          origin: "https://example.test",
        },
        body: JSON.stringify({ deviceId: "device-001", deviceName: "Office Desktop" }),
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      device: {
        deviceId: "device-001",
        deviceName: "Office Desktop",
        activatedAt: expect.any(String),
      },
      bootstrapRequired: true,
    });
    expect(database.auditEvents.at(-1)?.eventType).toBe("device.activation");
  });

  it("rejects a second active device", async () => {
    const database = new MemoryD1Database();
    database.users.set("admin-1", {
      id: "admin-1",
      username: "admin",
      usernameNormalized: "admin",
      displayName: "Administrator",
      role: "administrator",
      passwordHash: await hashPassword("AdminPassword!2026"),
      isActive: 1,
      createdAt: "2026-05-25T08:00:00.000Z",
      updatedAt: "2026-05-25T08:00:00.000Z",
      deactivatedAt: null,
    });
    database.devices.set("device-001", {
      deviceId: "device-001",
      deviceName: "Office Desktop",
      activatedByUserId: "admin-1",
      activatedAt: "2026-05-25T08:30:00.000Z",
      deactivatedAt: null,
      deactivatedByUserId: null,
    });

    const issued = await issueSession(database, { userId: "admin-1" });
    const response = await handleDeviceActivateRequest({
      db: database,
      request: new Request("https://example.test/api/staff/device/activate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: createSessionCookie(issued.token),
          origin: "https://example.test",
        },
        body: JSON.stringify({ deviceId: "device-002", deviceName: "Laptop" }),
      }),
    });

    expect(response.status).toBe(409);
  });

  it("deactivates the active device", async () => {
    const database = new MemoryD1Database();
    database.users.set("admin-1", {
      id: "admin-1",
      username: "admin",
      usernameNormalized: "admin",
      displayName: "Administrator",
      role: "administrator",
      passwordHash: await hashPassword("AdminPassword!2026"),
      isActive: 1,
      createdAt: "2026-05-25T08:00:00.000Z",
      updatedAt: "2026-05-25T08:00:00.000Z",
      deactivatedAt: null,
    });
    database.devices.set("device-001", {
      deviceId: "device-001",
      deviceName: "Office Desktop",
      activatedByUserId: "admin-1",
      activatedAt: "2026-05-25T08:30:00.000Z",
      deactivatedAt: null,
      deactivatedByUserId: null,
    });

    const issued = await issueSession(database, { userId: "admin-1" });
    const response = await handleDeviceDeactivateRequest({
      db: database,
      request: new Request("https://example.test/api/staff/device/deactivate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: createSessionCookie(issued.token),
          origin: "https://example.test",
        },
        body: JSON.stringify({ deviceId: "device-001" }),
      }),
    });

    expect(response.status).toBe(204);
    expect(database.devices.get("device-001")?.deactivatedAt).not.toBeNull();
    expect(database.auditEvents.at(-1)?.eventType).toBe("device.deactivation");
  });
});
