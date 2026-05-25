// @vitest-environment node

import { describe, expect, it } from "vitest";

import { hashPassword } from "./password.server";
import { createStaffUser, deactivateStaffUser, findUserByUsername } from "./users.server";
import { issueSession, readSession, createSessionCookie } from "./session.server";
import { MemoryD1Database } from "./test-support";

describe("users.server", () => {
  it("creates a user with normalized username and returns the public shape", async () => {
    const database = new MemoryD1Database();
    const now = new Date("2026-05-25T10:00:00.000Z");

    const created = await createStaffUser(database, {
      username: "  Admin.User ",
      displayName: "Admin User",
      role: "administrator",
      password: "Secret!2026",
      now,
    });

    expect(created).toMatchObject({
      username: "Admin.User",
      displayName: "Admin User",
      role: "administrator",
    });

    const stored = await findUserByUsername(database, "admin.user");
    expect(stored?.usernameNormalized).toBe("admin.user");
    expect(stored?.passwordHash).not.toBe("Secret!2026");
  });

  it("deactivates a user and invalidates existing sessions", async () => {
    const database = new MemoryD1Database();
    const passwordHash = await hashPassword("Secret!2026");
    database.users.set("user-1", {
      id: "user-1",
      username: "staff",
      usernameNormalized: "staff",
      displayName: "Staff User",
      role: "staff",
      passwordHash,
      isActive: 1,
      createdAt: "2026-05-25T09:00:00.000Z",
      updatedAt: "2026-05-25T09:00:00.000Z",
      deactivatedAt: null,
    });

    const sessionNow = new Date("2026-05-25T10:00:00.000Z");
    const issued = await issueSession(database, { userId: "user-1", now: sessionNow });

    await expect(
      deactivateStaffUser(database, {
        userId: "user-1",
        now: new Date("2026-05-25T11:00:00.000Z"),
      }),
    ).resolves.toBe(true);

    const request = new Request("https://example.test/staff", {
      headers: { cookie: createSessionCookie(issued.token) },
    });

    await expect(readSession(database, request, sessionNow)).resolves.toBeNull();
  });
});
