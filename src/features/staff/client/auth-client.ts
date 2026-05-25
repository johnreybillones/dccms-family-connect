/**
 * Auth API client — thin wrappers around the committed auth endpoints.
 *
 * All calls are fetch-based and return typed results or throw.
 * The session cookie is managed by the browser automatically (same-origin,
 * `SameSite=Strict`).
 */

import { authDetailsSchema, sessionUserSchema } from "@/features/staff/contracts/auth";
import type { AuthDetails, SessionUser } from "@/features/staff/contracts/auth";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true; user: SessionUser; hasActiveDevice: boolean; offlinePinEnrolled: boolean }
  | { ok: false; code: "INVALID_CREDENTIALS" | "NETWORK_ERROR" | "UNKNOWN" };

export async function loginWithCredentials(
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 401) {
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }

    if (!res.ok) {
      return { ok: false, code: "UNKNOWN" };
    }

    const raw = await res.json();
    const parsed = authDetailsSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, code: "UNKNOWN" };
    }

    const { user, hasActiveDevice, offlinePinEnrolled } = parsed.data;
    return { ok: true, user, hasActiveDevice, offlinePinEnrolled };
  } catch {
    return { ok: false, code: "NETWORK_ERROR" };
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    // Swallow network errors — the server session cookie will expire anyway.
  }
}

// ---------------------------------------------------------------------------
// Session check
// ---------------------------------------------------------------------------

export type SessionResult =
  | { authenticated: true; details: AuthDetails }
  | { authenticated: false };

export async function fetchSession(): Promise<SessionResult> {
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "same-origin",
    });

    if (res.status === 401) {
      return { authenticated: false };
    }

    if (!res.ok) {
      return { authenticated: false };
    }

    const raw = await res.json();
    const parsed = authDetailsSchema.safeParse(raw);

    if (!parsed.success) {
      return { authenticated: false };
    }

    return { authenticated: true, details: parsed.data };
  } catch {
    return { authenticated: false };
  }
}

// ---------------------------------------------------------------------------
// Typed helper for session user only
// ---------------------------------------------------------------------------

export async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "same-origin" });
    if (!res.ok) return null;
    const raw = await res.json();
    const parsed = sessionUserSchema.safeParse(raw?.user);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
