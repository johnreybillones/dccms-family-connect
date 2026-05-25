// @vitest-environment node

import { describe, expect, it } from "vitest";

import { hashPassword } from "./password.server";
import { MemoryD1Database } from "./test-support";
import { handleLoginRequest } from "@/routes/api/auth/login";
import { handleLogoutRequest } from "@/routes/api/auth/logout";
import { handleSessionRequest } from "@/routes/api/auth/session";
import { createSessionCookie, issueSession } from "./session.server";

describe("auth API", () => {
  it("rejects invalid credentials and records an audit event", async () => {
    const database = new MemoryD1Database();
    database.users.set("admin-1", {
      id: "admin-1",
      username: "admin",
      usernameNormalized: "admin",
      displayName: "Administrator",
      role: "administrator",
      passwordHash: await hashPassword("CorrectPassword!2026"),
      isActive: 1,
      createdAt: "2026-05-25T08:00:00.000Z",
      updatedAt: "2026-05-25T08:00:00.000Z",
      deactivatedAt: null,
    });

    const response = await handleLoginRequest({
      db: database,
      request: new Request("https://example.test/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://example.test",
        },
        body: JSON.stringify({ username: "admin", password: "wrong" }),
      }),
    });

    expect(response.status).toBe(401);
    expect(database.auditEvents.at(-1)?.eventType).toBe("auth.login.failed");
  });

  it("issues a session cookie for valid credentials and returns public auth details", async () => {
    const database = new MemoryD1Database();
    database.users.set("admin-1", {
      id: "admin-1",
      username: "admin",
      usernameNormalized: "admin",
      displayName: "Administrator",
      role: "administrator",
      passwordHash: await hashPassword("CorrectPassword!2026"),
      isActive: 1,
      createdAt: "2026-05-25T08:00:00.000Z",
      updatedAt: "2026-05-25T08:00:00.000Z",
      deactivatedAt: null,
    });

    const response = await handleLoginRequest({
      db: database,
      request: new Request("https://example.test/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://example.test",
        },
        body: JSON.stringify({ username: "admin", password: "CorrectPassword!2026" }),
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(
      /^__Host-dccms_session=[^;]+; Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000$/,
    );

    const body = await response.json();
    expect(body).toEqual({
      user: {
        id: "admin-1",
        username: "admin",
        role: "administrator",
        displayName: "Administrator",
      },
      device: null,
      hasActiveDevice: false,
      offlinePinEnrolled: false,
    });
    expect(JSON.stringify(body)).not.toContain("passwordHash");
    expect(database.auditEvents.at(-1)?.eventType).toBe("auth.login.succeeded");
  });

  it("returns the active session and supports logout invalidation", async () => {
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

    const issued = await issueSession(database, {
      userId: "staff-1",
      now: new Date("2026-05-25T12:00:00.000Z"),
    });
    const cookie = createSessionCookie(issued.token);

    const sessionResponse = await handleSessionRequest({
      db: database,
      request: new Request("https://example.test/api/auth/session", {
        headers: { cookie },
      }),
    });

    expect(sessionResponse.status).toBe(200);

    const logoutResponse = await handleLogoutRequest({
      db: database,
      request: new Request("https://example.test/api/auth/logout", {
        method: "POST",
        headers: {
          cookie,
          origin: "https://example.test",
        },
      }),
    });

    expect(logoutResponse.status).toBe(204);
    expect(logoutResponse.headers.get("set-cookie")).toBe(
      "__Host-dccms_session=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0",
    );
    expect(database.auditEvents.at(-1)?.eventType).toBe("auth.logout");

    const unauthenticated = await handleSessionRequest({
      db: database,
      request: new Request("https://example.test/api/auth/session", {
        headers: { cookie },
      }),
    });

    expect(unauthenticated.status).toBe(401);
  });
});
