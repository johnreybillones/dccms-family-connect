/**
 * Lightweight reactive session store for the authenticated staff user.
 *
 * Does NOT persist across hard reloads — session state is authoritative on
 * the server (cookie). On every app boot the root loader should call
 * `GET /api/auth/session` and call `setSession` with the result.
 *
 * Usage:
 *   import { getSession, setSession, clearSession, subscribeSession } from "@/features/staff/client/session-store";
 */

import type { SessionUser } from "@/features/staff/contracts/auth";

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY = "dccms-session-user";

let _session: SessionUser | null = (() => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  return null;
})();

const _listeners = new Set<() => void>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Read the current in-memory session user. */
export function getSession(): SessionUser | null {
  return _session;
}

/**
 * Replace the stored session user and notify all subscribers.
 * Pass `null` to clear (equivalent to `clearSession`).
 */
export function setSession(user: SessionUser | null): void {
  _session = user;
  if (typeof window !== "undefined") {
    try {
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to cache session locally", e);
    }
  }
  _listeners.forEach((fn) => fn());
}

/** Convenience alias for `setSession(null)`. */
export function clearSession(): void {
  setSession(null);
}

/**
 * Subscribe to session changes.
 * Returns an unsubscribe function.
 *
 * @example
 * const unsub = subscribeSession(() => setUser(getSession()));
 * return () => unsub();
 */
export function subscribeSession(listener: () => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// React hook helper
// ---------------------------------------------------------------------------

/**
 * Minimal React hook that tracks the session store.
 * Import from here so components never subscribe manually.
 */
import { useEffect, useState } from "react";

export function useSession(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(() => getSession());

  useEffect(() => {
    // Sync in case state changed between render and effect
    setUser(getSession());
    return subscribeSession(() => setUser(getSession()));
  }, []);

  return user;
}
