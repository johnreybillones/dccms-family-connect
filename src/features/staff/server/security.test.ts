// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  SESSION_COOKIE_NAME,
  assertSessionRole,
  clearSessionCookie,
  createSessionCookie,
  getSessionTokenFromCookieHeader,
  hashPassword,
  invalidateSession,
  issueSession,
  readSession,
  verifyPassword,
} from "./security";

type StoredUser = {
  id: string;
  username: string;
  displayName: string;
  role: "administrator" | "staff";
  isActive: number;
};

type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  invalidatedAt: string | null;
};

class FakeD1Database {
  public readonly users = new Map<string, StoredUser>();
  public readonly sessions = new Map<string, StoredSession>();

  prepare(query: string) {
    return new FakeD1Statement(this, query);
  }
}

class FakeD1Statement {
  private params: unknown[] = [];

  constructor(
    private readonly database: FakeD1Database,
    private readonly query: string,
  ) {}

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async run() {
    if (this.query.startsWith("INSERT INTO sessions")) {
      const [id, userId, tokenHash, createdAt, expiresAt] = this.params as [
        string,
        string,
        string,
        string,
        string,
      ];

      this.database.sessions.set(tokenHash, {
        id,
        userId,
        tokenHash,
        createdAt,
        expiresAt,
        invalidatedAt: null,
      });

      return { success: true };
    }

    if (this.query.startsWith("UPDATE sessions")) {
      const [invalidatedAt, tokenHash] = this.params as [string, string];
      const existing = this.database.sessions.get(tokenHash);

      if (existing && existing.invalidatedAt === null) {
        existing.invalidatedAt = invalidatedAt;
        return { success: true, meta: { changes: 1 } };
      }

      return { success: true, meta: { changes: 0 } };
    }

    throw new Error(`Unsupported run query: ${this.query}`);
  }

  async first<T>() {
    if (this.query.includes("FROM sessions")) {
      const [tokenHash, nowIso] = this.params as [string, string];
      const session = this.database.sessions.get(tokenHash);

      if (!session || session.invalidatedAt !== null || session.expiresAt <= nowIso) {
        return null as T | null;
      }

      const user = this.database.users.get(session.userId);
      if (!user || user.isActive !== 1) {
        return null as T | null;
      }

      return {
        sessionId: session.id,
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        expiresAt: session.expiresAt,
      } as T;
    }

    throw new Error(`Unsupported first query: ${this.query}`);
  }
}

describe("password hashing", () => {
  it("hashes with a random salt and verifies the original password", async () => {
    const password = "CorrectHorseBatteryStaple!2026";

    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    expect(firstHash).not.toBe(secondHash);
    await expect(verifyPassword(password, firstHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", firstHash)).resolves.toBe(false);
  });
});

describe("session cookies", () => {
  it("creates and clears a __Host- session cookie with strict attributes", () => {
    const expiresAt = new Date("2026-05-26T00:00:00.000Z");

    const setCookie = createSessionCookie("plain-session-token", expiresAt);
    const clearCookie = clearSessionCookie();

    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=plain-session-token`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain(`Expires=${expiresAt.toUTCString()}`);
    expect(setCookie).not.toContain("Domain=");

    expect(clearCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(clearCookie).toContain("Max-Age=0");
  });

  it("extracts the session token from the cookie header", () => {
    const header = `theme=light; ${SESSION_COOKIE_NAME}=token-123; locale=en-US`;

    expect(getSessionTokenFromCookieHeader(header)).toBe("token-123");
    expect(getSessionTokenFromCookieHeader("theme=light")).toBeNull();
  });
});

describe("session persistence", () => {
  it("stores only the hashed session token and resolves the active session from a request", async () => {
    const database = new FakeD1Database();
    database.users.set("user-1", {
      id: "user-1",
      username: "admin",
      displayName: "Administrator",
      role: "administrator",
      isActive: 1,
    });

    const now = new Date("2026-05-25T12:00:00.000Z");
    const issued = await issueSession(database, { userId: "user-1", now });

    expect(database.sessions.size).toBe(1);
    expect([...database.sessions.keys()][0]).not.toBe(issued.token);

    const request = new Request("https://example.test/staff", {
      headers: {
        cookie: createSessionCookie(issued.token, issued.expiresAt),
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
    const database = new FakeD1Database();
    database.users.set("user-2", {
      id: "user-2",
      username: "staff",
      displayName: "Staff Member",
      role: "staff",
      isActive: 1,
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
});

describe("role enforcement", () => {
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
