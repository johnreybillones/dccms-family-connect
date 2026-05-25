/**
 * src/features/staff/client/device-activation.ts
 *
 * Client-side device activation workflow.
 *
 * Coordinates POST /api/staff/device/activate, PIN enrolment via offline-vault,
 * and persisting activation metadata locally.
 */

import { enrollPin, saveActivationMeta, getActivationMeta } from "./offline-vault";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivationRequest = {
  deviceId: string;
  deviceName: string;
};

export type ActivationResult =
  | { ok: true }
  | { ok: false; reason: "DEVICE_ALREADY_ACTIVE" | "NETWORK_ERROR" | "UNKNOWN" };

// ---------------------------------------------------------------------------
// Activate device via server API
// ---------------------------------------------------------------------------

export async function activateDevice(req: ActivationRequest): Promise<ActivationResult> {
  try {
    const res = await fetch("/api/staff/device/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(req),
    });

    if (res.status === 409) return { ok: false, reason: "DEVICE_ALREADY_ACTIVE" };
    if (!res.ok) return { ok: false, reason: "UNKNOWN" };

    return { ok: true };
  } catch {
    return { ok: false, reason: "NETWORK_ERROR" };
  }
}

// ---------------------------------------------------------------------------
// Enroll PIN (called after successful online activation)
// ---------------------------------------------------------------------------

export async function enrollOfflinePin(userId: string, pin: string): Promise<void> {
  await enrollPin(userId, pin);
}

// ---------------------------------------------------------------------------
// Save and read activation metadata
// ---------------------------------------------------------------------------

export async function recordActivation(deviceId: string, deviceName: string): Promise<void> {
  await saveActivationMeta({ deviceId, deviceName, activatedAt: new Date().toISOString() });
}

export async function isDeviceActivated(): Promise<boolean> {
  const meta = await getActivationMeta();
  return meta !== undefined;
}

// ---------------------------------------------------------------------------
// Bootstrap: load initial data from server into local encrypted store
// Placeholder — full implementation lives in sync-client.ts bootstrapFromServer()
// ---------------------------------------------------------------------------

export async function fetchBootstrap(deviceId: string): Promise<Response> {
  return fetch(`/api/staff/bootstrap?deviceId=${encodeURIComponent(deviceId)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
}
