// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  SESSION_COOKIE_NAME,
  assertSessionRole,
  clearSessionCookie,
  createSessionCookie,
  getSessionTokenFromCookieHeader,
  invalidateSession,
  issueSession,
  readSession,
} from "./session.server";
import { MemoryD1Database } from "./test-support";

describe("session.server", () => {
  it("creates the exact required session cookie", () => {
    expect(createSessionCookie("plain-session-token")).toBe(
      "__Host-dccms_session=plain-session-token; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000",
    );
  });

  it("clears the session cookie", () => {
    expect(clearSessionCookie()).toBe(
      "__Host-dccms_session=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0",
    );
  });

  it("extracts the session token from the cookie header", () => {
    const header = `theme=light; ${SESSION_COOKIE_NAME}=token-123; locale=en-US`;

    expect(getSessionTokenFromCookieHeader(header)).toBe("token-123");
    expect(getSessionTokenFromCookieHeader("theme=light")).toBeNull();
  });

  it("stores only the hashed session token and resolves the active session from a request", async () => {
    const database = new MemoryD1Database();
    database.users.set("user-1", {
      id: "user-1",
      username: "admin",
      usernameNormalized: "admin",
      displayName: "Administrator",
      role: "administrator",
      passwordHash: "hash",
      isActive: 1,
      createdAt: "2026-05-25T12:00:00.000Z",
      updatedAt: "2026-05-25T12:00:00.000Z",
      deactivatedAt: null,
    });

    const now = new Date("2026-05-25T12:00:00.000Z");
    const issued = await issueSession(database, { userId: "user-1", now });

    expect(database.sessions.size).toBe(1);
    expect([...database.sessions.keys()][0]).not.toBe(issued.token);

    const request = new Request("https://example.test/staff", {
      headers: {
        cookie: createSessionCookie(issued.token),
      },
    });

    await expect(readSession(database, request, now)).resolves.toEqual({
      session: {
        id: issued.sessionId,
        expiresAt: issued.expiresAt.toISOString(),
      },
      user: {
        id: "user-1",
        username: "admin",
        displayName: "Administrator",
        role: "administrator",
      },
    });
  });

  it("invalidates the session token and blocks further reads", async () => {
    const database = new MemoryD1Database();
    database.users.set("user-2", {
      id: "user-2",
      username: "staff",
      usernameNormalized: "staff",
      displayName: "Staff Member",
      role: "staff",
      passwordHash: "hash",
      isActive: 1,
      createdAt: "2026-05-25T13:00:00.000Z",
      updatedAt: "2026-05-25T13:00:00.000Z",
      deactivatedAt: null,
    });

    const now = new Date("2026-05-25T13:00:00.000Z");
    const issued = await issueSession(database, { userId: "user-2", now });
    const request = new Request("https://example.test/staff", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${issued.token}`,
      },
    });

    await expect(invalidateSession(database, request, now)).resolves.toBe(true);
    await expect(readSession(database, request, now)).resolves.toBeNull();
  });

  it("allows accepted roles and rejects forbidden roles", () => {
    const adminUser = {
      id: "user-1",
      username: "admin",
      displayName: "Administrator",
      role: "administrator" as const,
    };

    expect(assertSessionRole(adminUser, ["administrator"])).toEqual(adminUser);
    expect(() => assertSessionRole(adminUser, ["staff"])).toThrow("FORBIDDEN");
  });
});
