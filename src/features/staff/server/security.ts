import type { SessionRole, SessionUser } from "../contracts/auth";

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 32;
const SESSION_TOKEN_BYTES = 32;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const ARGON2_MEMORY_KIB = 19 * 1024;
const ARGON2_PASSES = 2;
const ARGON2_PARALLELISM = 1;
const PBKDF2_ITERATIONS = 600_000;

export const SESSION_COOKIE_NAME = "__Host-dccms_session";

type D1RunResult = {
  meta?: {
    changes?: number;
  };
};

type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  first: <T>() => Promise<T | null>;
  run: () => Promise<D1RunResult>;
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatementLike;
};

type PasswordAlgorithm = "argon2id" | "pbkdf2-sha256";

type ParsedPasswordHash =
  | {
      algorithm: "argon2id";
      salt: Uint8Array;
      hash: Uint8Array;
      memory: number;
      passes: number;
      parallelism: number;
    }
  | {
      algorithm: "pbkdf2-sha256";
      salt: Uint8Array;
      hash: Uint8Array;
      iterations: number;
    };

type SessionRow = {
  sessionId: string;
  userId: string;
  username: string;
  displayName: string;
  role: SessionRole;
  expiresAt: string;
};

type SessionReadResult = {
  session: {
    id: string;
    expiresAt: string;
  };
  user: SessionUser;
};

type IssueSessionOptions = {
  userId: string;
  now?: Date;
  ttlMs?: number;
};

type SubtleCryptoConstructorWithSupports = {
  supports?: (operation: string, algorithm: unknown) => boolean;
};

export async function hashPassword(password: string): Promise<string> {
  assertPasswordIsPresent(password);

  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const derived = await derivePasswordHash(password, salt, preferredPasswordAlgorithm());

  if (derived.algorithm === "argon2id") {
    return [
      "v1",
      "argon2id",
      `m=${derived.memory},t=${derived.passes},p=${derived.parallelism}`,
      toBase64Url(salt),
      toBase64Url(derived.hash),
    ].join("$");
  }

  return [
    "v1",
    "pbkdf2-sha256",
    `i=${derived.iterations}`,
    toBase64Url(salt),
    toBase64Url(derived.hash),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) {
    return false;
  }

  const parsed = parseStoredPasswordHash(storedHash);
  if (!parsed) {
    return false;
  }

  const computed = await derivePasswordHash(password, parsed.salt, parsed.algorithm, parsed);
  return timingSafeEqual(parsed.hash, computed.hash);
}

export function createSessionCookie(token: string, expiresAt: Date): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Expires=${expiresAt.toUTCString()}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

export function clearSessionCookie(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
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
  const expiresAt = new Date(now.getTime() + (options.ttlMs ?? SESSION_TTL_MS));
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
      [
        "SELECT",
        "  sessions.id AS sessionId,",
        "  staff_users.id AS userId,",
        "  staff_users.username AS username,",
        "  staff_users.display_name AS displayName,",
        "  staff_users.role AS role,",
        "  sessions.expires_at AS expiresAt",
        "FROM sessions",
        "JOIN staff_users ON staff_users.id = sessions.user_id",
        "WHERE sessions.token_hash = ?",
        "  AND sessions.invalidated_at IS NULL",
        "  AND sessions.expires_at > ?",
        "  AND staff_users.is_active = 1",
        "LIMIT 1",
      ].join(" "),
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

function assertPasswordIsPresent(password: string) {
  if (!password) {
    throw new Error("Password is required");
  }
}

function preferredPasswordAlgorithm(): PasswordAlgorithm {
  return supportsArgon2id() ? "argon2id" : "pbkdf2-sha256";
}

function supportsArgon2id(): boolean {
  const subtleConstructor = globalThis.SubtleCrypto as
    | SubtleCryptoConstructorWithSupports
    | undefined;
  return subtleConstructor?.supports?.("importKey", "Argon2id") ?? false;
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  algorithm: PasswordAlgorithm,
  existing?: ParsedPasswordHash,
): Promise<
  | {
      algorithm: "argon2id";
      hash: Uint8Array;
      memory: number;
      passes: number;
      parallelism: number;
    }
  | {
      algorithm: "pbkdf2-sha256";
      hash: Uint8Array;
      iterations: number;
    }
> {
  const passwordBytes = new TextEncoder().encode(password);

  if (algorithm === "argon2id") {
    const memory = existing?.algorithm === "argon2id" ? existing.memory : ARGON2_MEMORY_KIB;
    const passes = existing?.algorithm === "argon2id" ? existing.passes : ARGON2_PASSES;
    const parallelism =
      existing?.algorithm === "argon2id" ? existing.parallelism : ARGON2_PARALLELISM;

    const imported = await crypto.subtle.importKey(
      "raw-secret" as KeyFormat,
      passwordBytes,
      "Argon2id",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "Argon2id",
        nonce: salt,
        memory,
        passes,
        parallelism,
      },
      imported,
      PASSWORD_HASH_BYTES * 8,
    );

    return {
      algorithm: "argon2id",
      hash: new Uint8Array(bits),
      memory,
      passes,
      parallelism,
    };
  }

  const iterations =
    existing?.algorithm === "pbkdf2-sha256" ? existing.iterations : PBKDF2_ITERATIONS;
  const imported = await crypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    imported,
    PASSWORD_HASH_BYTES * 8,
  );

  return {
    algorithm: "pbkdf2-sha256",
    hash: new Uint8Array(bits),
    iterations,
  };
}

function parseStoredPasswordHash(storedHash: string): ParsedPasswordHash | null {
  const parts = storedHash.split("$");
  if (parts.length !== 5 || parts[0] !== "v1") {
    return null;
  }

  const salt = fromBase64Url(parts[3]);
  const hash = fromBase64Url(parts[4]);
  if (!salt || !hash) {
    return null;
  }

  if (parts[1] === "argon2id") {
    const match = /^m=(\d+),t=(\d+),p=(\d+)$/.exec(parts[2]);
    if (!match) {
      return null;
    }

    return {
      algorithm: "argon2id",
      salt,
      hash,
      memory: Number(match[1]),
      passes: Number(match[2]),
      parallelism: Number(match[3]),
    };
  }

  if (parts[1] === "pbkdf2-sha256") {
    const match = /^i=(\d+)$/.exec(parts[2]);
    if (!match) {
      return null;
    }

    return {
      algorithm: "pbkdf2-sha256",
      salt,
      hash,
      iterations: Number(match[1]),
    };
  }

  return null;
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }

  return mismatch === 0;
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}
