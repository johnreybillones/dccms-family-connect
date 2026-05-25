// @vitest-environment node

import { describe, expect, it } from "vitest";

import { hashPassword } from "./password.server";
import { createSessionCookie, issueSession } from "./session.server";
import { MemoryD1Database } from "./test-support";
import { handleCreateStaffUserRequest } from "@/routes/api/admin/staff-users";
import { handleDeactivateStaffUserRequest } from "@/routes/api/admin/staff-users/$userId/deactivate";
import { handleAuditEventsRequest } from "@/routes/api/admin/audit-events";

describe("admin API", () => {
  it("allows only administrators to create staff users", async () => {
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

    const issued = await issueSession(database, { userId: "staff-1" });
    const response = await handleCreateStaffUserRequest({
      db: database,
      request: new Request("https://example.test/api/admin/staff-users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: createSessionCookie(issued.token),
          origin: "https://example.test",
        },
        body: JSON.stringify({
          username: "new-admin",
          displayName: "New Admin",
          role: "administrator",
          password: "Password!2026",
        }),
      }),
    });

    expect(response.status).toBe(403);
  });

  it("creates staff users and deactivation events for administrators", async () => {
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
    const createResponse = await handleCreateStaffUserRequest({
      db: database,
      request: new Request("https://example.test/api/admin/staff-users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: createSessionCookie(issued.token),
          origin: "https://example.test",
        },
        body: JSON.stringify({
          username: "new-staff",
          displayName: "New Staff",
          role: "staff",
          password: "Password!2026",
        }),
      }),
    });

    expect(createResponse.status).toBe(200);
    const body = await createResponse.json();
    expect(body.user).toEqual({
      id: expect.any(String),
      username: "new-staff",
      displayName: "New Staff",
      role: "staff",
    });

    const deactivateResponse = await handleDeactivateStaffUserRequest({
      db: database,
      request: new Request(
        "https://example.test/api/admin/staff-users/" + body.user.id + "/deactivate",
        {
          method: "POST",
          headers: {
            cookie: createSessionCookie(issued.token),
            origin: "https://example.test",
          },
        },
      ),
      params: { userId: body.user.id },
    });

    expect(deactivateResponse.status).toBe(204);
    expect(database.auditEvents.at(-1)?.eventType).toBe("admin.user.deactivated");
  });

  it("limits audit-event access to administrators", async () => {
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
    database.auditEvents.push({
      id: "audit-1",
      timestamp: "2026-05-25T08:30:00.000Z",
      actorId: "staff-1",
      eventType: "auth.login.succeeded",
      metadata: "{}",
    });

    const issued = await issueSession(database, { userId: "staff-1" });
    const response = await handleAuditEventsRequest({
      db: database,
      request: new Request("https://example.test/api/admin/audit-events", {
        headers: { cookie: createSessionCookie(issued.token) },
      }),
    });

    expect(response.status).toBe(403);
  });
});
