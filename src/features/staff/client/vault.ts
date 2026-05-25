/**
 * src/features/staff/client/vault.ts
 *
 * Local-first AES-GCM encryption vault.
 *
 * Key hierarchy:
 *   PIN (6 digits) ──PBKDF2──▶ PIN-wrapping key
 *   Activation    ──random──▶ Data-Encryption Key (DEK)
 *   DEK is stored in IndexedDB ONLY in wrapped form (encrypted with PIN key).
 *
 * Personal data is never stored in plaintext. The raw PIN is never persisted.
 *
 * Usage lifecycle:
 *   1. activate()       — generate DEK, wrap with PIN key, store wrapped DEK.
 *   2. unlock(pin)      — unwrap the DEK; hold it in memory for the session.
 *   3. encrypt(data)    — encrypt with the in-memory DEK; returns ciphertext.
 *   4. decrypt(cipher)  — decrypt with the in-memory DEK; returns plaintext bytes.
 *   5. lock()           — clear DEK from memory.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EncryptedPayload = {
  /** base64-encoded IV (12 bytes for AES-GCM) */
  iv: string;
  /** base64-encoded ciphertext */
  ciphertext: string;
};

export type WrappedKey = {
  /** base64-encoded salt used for PBKDF2 key derivation */
  salt: string;
  /** base64-encoded IV used to wrap the DEK */
  wrapIv: string;
  /** base64-encoded wrapped (encrypted) DEK */
  wrappedDek: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const AES_KEY_LENGTH = 256;
const IV_BYTES = 12;
const SALT_BYTES = 16;

// ---------------------------------------------------------------------------
// Module-level in-memory DEK (cleared on lock/page unload)
// ---------------------------------------------------------------------------

let _dek: CryptoKey | null = null;

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function pinToBytes(pin: string): Uint8Array {
  return new TextEncoder().encode(pin);
}

// ---------------------------------------------------------------------------
// PBKDF2: derive a wrapping key from a PIN + salt
// ---------------------------------------------------------------------------

async function derivePinKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const pinMaterial = await crypto.subtle.importKey("raw", pinToBytes(pin), "PBKDF2", false, [
    "deriveKey",
  ]);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    pinMaterial,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

// ---------------------------------------------------------------------------
// Vault: activation — generate and wrap the DEK with the user's PIN
// ---------------------------------------------------------------------------

/**
 * Generate a fresh Data-Encryption Key (DEK) and wrap it with the
 * PIN-derived key.  Call this once when the user enrolls their offline PIN.
 *
 * Returns the WrappedKey to persist in IndexedDB (authorized_user_keys store).
 */
export async function wrapNewDek(pin: string): Promise<{ wrapped: WrappedKey; dek: CryptoKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const wrapIvBytes = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const pinKey = await derivePinKey(pin, salt);

  const dek = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    true, // extractable so it can be wrapped; we make it non-extractable after unwrap
    ["encrypt", "decrypt"],
  );

  const wrappedDekBuf = await crypto.subtle.wrapKey("raw", dek, pinKey, {
    name: "AES-GCM",
    iv: wrapIvBytes,
  });

  const wrapped: WrappedKey = {
    salt: toBase64(salt),
    wrapIv: toBase64(wrapIvBytes),
    wrappedDek: toBase64(wrappedDekBuf),
  };

  return { wrapped, dek };
}

// ---------------------------------------------------------------------------
// Vault: unlock — unwrap the DEK with the user's PIN
// ---------------------------------------------------------------------------

/**
 * Unlock the vault by unwrapping the stored DEK with the PIN-derived key.
 * Stores the DEK in memory for the current session.
 *
 * Returns `true` on success, `false` if the PIN is wrong.
 */
export async function unlock(pin: string, wrapped: WrappedKey): Promise<boolean> {
  try {
    const salt = fromBase64(wrapped.salt);
    const wrapIv = fromBase64(wrapped.wrapIv);
    const wrappedDekBytes = fromBase64(wrapped.wrappedDek);

    const pinKey = await derivePinKey(pin, salt);

    const dek = await crypto.subtle.unwrapKey(
      "raw",
      wrappedDekBytes,
      pinKey,
      { name: "AES-GCM", iv: wrapIv },
      { name: "AES-GCM", length: AES_KEY_LENGTH },
      false, // non-extractable in memory
      ["encrypt", "decrypt"],
    );

    _dek = dek;
    return true;
  } catch {
    // Wrong PIN or corrupted data — do not update _dek
    return false;
  }
}

// ---------------------------------------------------------------------------
// Vault: encrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt a plain ArrayBuffer (or TypedArray) with the in-memory DEK.
 * Throws if the vault is locked.
 */
export async function encrypt(plaintext: Uint8Array): Promise<EncryptedPayload> {
  if (!_dek) throw new Error("Vault is locked. Call unlock() first.");

  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertextBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, _dek, plaintext);

  return {
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertextBuf),
  };
}

// ---------------------------------------------------------------------------
// Vault: decrypt
// ---------------------------------------------------------------------------

/**
 * Decrypt an EncryptedPayload with the in-memory DEK.
 * Returns the original plaintext bytes.
 * Throws if the vault is locked or if decryption fails (tampered data).
 */
export async function decrypt(payload: EncryptedPayload): Promise<Uint8Array> {
  if (!_dek) throw new Error("Vault is locked. Call unlock() first.");

  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);

  const plaintextBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, _dek, ciphertext);

  return new Uint8Array(plaintextBuf);
}

// ---------------------------------------------------------------------------
// Vault: helpers for JSON data
// ---------------------------------------------------------------------------

/** Encrypt a JSON-serializable value. */
export async function encryptJson<T>(value: T): Promise<EncryptedPayload> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return encrypt(bytes);
}

/** Decrypt and parse a JSON-serializable value. */
export async function decryptJson<T>(payload: EncryptedPayload): Promise<T> {
  const bytes = await decrypt(payload);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

// ---------------------------------------------------------------------------
// Vault: lock / status
// ---------------------------------------------------------------------------

/** Clear the in-memory DEK — the vault is locked until unlock() is called again. */
export function lock(): void {
  _dek = null;
}

/** Whether the vault is currently unlocked and ready for crypto operations. */
export function isUnlocked(): boolean {
  return _dek !== null;
}
