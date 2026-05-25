import type { SessionRole, SessionUser } from "../contracts/auth";
import type { D1DatabaseLike } from "./db.server";

const SESSION_TOKEN_BYTES = 32;
const SESSION_MAX_AGE_SECONDS = 2_592_000;
const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000;

export const SESSION_COOKIE_NAME = "__Host-dccms_session";
export const SESSION_COOKIE_TEMPLATE =
  "__Host-dccms_session=<token>; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000";

type SessionRow = {
  sessionId: string;
  userId: string;
  username: string;
  displayName: string;
  role: SessionRole;
  expiresAt: string;
};

type IssueSessionOptions = {
  userId: string;
  now?: Date;
};

export type SessionReadResult = {
  session: {
    id: string;
    expiresAt: string;
  };
  user: SessionUser;
};

export function createSessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=2592000`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function getSessionTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

export async function issueSession(
  database: D1DatabaseLike,
  options: IssueSessionOptions,
): Promise<{ sessionId: string; token: string; expiresAt: Date }> {
  const now = options.now ?? new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const sessionId = crypto.randomUUID();
  const token = toBase64Url(randomBytes(SESSION_TOKEN_BYTES));
  const tokenHash = await sha256Base64Url(token);

  await database
    .prepare(
      "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(sessionId, options.userId, tokenHash, now.toISOString(), expiresAt.toISOString())
    .run();

  return { sessionId, token, expiresAt };
}

export async function readSession(
  database: D1DatabaseLike,
  request: Request,
  now: Date = new Date(),
): Promise<SessionReadResult | null> {
  const token = getSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) {
    return null;
  }

  const tokenHash = await sha256Base64Url(token);
  const row = await database
    .prepare(
      "SELECT sessions.id AS sessionId, staff_users.id AS userId, staff_users.username AS username, staff_users.display_name AS displayName, staff_users.role AS role, sessions.expires_at AS expiresAt FROM sessions JOIN staff_users ON staff_users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.invalidated_at IS NULL AND sessions.expires_at > ? AND staff_users.is_active = 1 LIMIT 1",
    )
    .bind(tokenHash, now.toISOString())
    .first<SessionRow>();

  if (!row) {
    return null;
  }

  return {
    session: {
      id: row.sessionId,
      expiresAt: row.expiresAt,
    },
    user: {
      id: row.userId,
      username: row.username,
      displayName: row.displayName,
      role: row.role,
    },
  };
}

export async function invalidateSession(
  database: D1DatabaseLike,
  request: Request,
  now: Date = new Date(),
): Promise<boolean> {
  const token = getSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) {
    return false;
  }

  const tokenHash = await sha256Base64Url(token);
  const result = await database
    .prepare(
      "UPDATE sessions SET invalidated_at = ? WHERE token_hash = ? AND invalidated_at IS NULL",
    )
    .bind(now.toISOString(), tokenHash)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export function assertSessionRole<TUser extends SessionUser>(
  user: TUser,
  allowedRoles: readonly SessionRole[],
): TUser {
  if (allowedRoles.includes(user.role)) {
    return user;
  }

  throw new Error("FORBIDDEN");
}

export function assertSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new Error("FORBIDDEN");
  }
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
