const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 32;
const PBKDF2_ITERATIONS = 600_000;

type ParsedPasswordHash = {
  salt: Uint8Array;
  hash: Uint8Array;
  iterations: number;
};

export async function hashPassword(password: string): Promise<string> {
  assertPasswordIsPresent(password);

  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const hash = await derivePasswordHash(password, salt, PBKDF2_ITERATIONS);

  return [
    "v1",
    "pbkdf2-sha256",
    `i=${PBKDF2_ITERATIONS}`,
    toBase64Url(salt),
    toBase64Url(hash),
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

  const computed = await derivePasswordHash(password, parsed.salt, parsed.iterations);
  return timingSafeEqual(parsed.hash, computed);
}

function assertPasswordIsPresent(password: string) {
  if (!password) {
    throw new Error("Password is required");
  }
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const imported = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
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

  return new Uint8Array(bits);
}

function parseStoredPasswordHash(storedHash: string): ParsedPasswordHash | null {
  const parts = storedHash.split("$");
  if (parts.length !== 5 || parts[0] !== "v1" || parts[1] !== "pbkdf2-sha256") {
    return null;
  }

  const match = /^i=(\d+)$/.exec(parts[2]);
  const salt = fromBase64Url(parts[3]);
  const hash = fromBase64Url(parts[4]);
  if (!match || !salt || !hash) {
    return null;
  }

  return {
    salt,
    hash,
    iterations: Number(match[1]),
  };
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
