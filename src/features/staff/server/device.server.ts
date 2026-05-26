import type { DeviceActivation } from "../contracts/auth";
import type { D1DatabaseLike } from "./db.server";

type ActiveDeviceRow = {
  deviceId: string;
  deviceName: string;
  activatedByUserId: string;
  activatedAt: string;
};

type OfflinePinRow = {
  offlinePinHash: string | null;
};

export async function getActiveDevice(database: D1DatabaseLike): Promise<ActiveDeviceRow | null> {
  return database
    .prepare(
      "SELECT device_id AS deviceId, device_name AS deviceName, activated_by_user_id AS activatedByUserId, activated_at AS activatedAt FROM activated_devices WHERE deactivated_at IS NULL ORDER BY activated_at DESC LIMIT 1",
    )
    .first<ActiveDeviceRow>();
}

export async function getDeviceAuthDetails(
  database: D1DatabaseLike,
  userId: string,
): Promise<{
  device: DeviceActivation | null;
  hasActiveDevice: boolean;
  offlinePinEnrolled: boolean;
}> {
  const activeDevice = await getActiveDevice(database);
  if (!activeDevice) {
    return {
      device: null,
      hasActiveDevice: false,
      offlinePinEnrolled: false,
    };
  }

  const offlinePin = await database
    .prepare(
      "SELECT offline_pin_hash AS offlinePinHash FROM authorized_device_users WHERE device_id = ? AND user_id = ? LIMIT 1",
    )
    .bind(activeDevice.deviceId, userId)
    .first<OfflinePinRow>();

  return {
    device: {
      deviceId: activeDevice.deviceId,
      deviceName: activeDevice.deviceName,
      activatedAt: activeDevice.activatedAt,
    },
    hasActiveDevice: true,
    offlinePinEnrolled: Boolean(offlinePin?.offlinePinHash),
  };
}

export async function activateDevice(
  database: D1DatabaseLike,
  options: {
    deviceId: string;
    deviceName: string;
    activatedByUserId: string;
    now?: Date;
  },
): Promise<DeviceActivation> {
  const existing = await getActiveDevice(database);
  if (existing) {
    throw new Error("DEVICE_ALREADY_ACTIVE");
  }

  const now = options.now ?? new Date();
  await database
    .prepare(
      "INSERT INTO activated_devices (device_id, device_name, activated_by_user_id, activated_at, deactivated_at, deactivated_by_user_id) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      options.deviceId,
      options.deviceName,
      options.activatedByUserId,
      now.toISOString(),
      null,
      null,
    )
    .run();

  return {
    deviceId: options.deviceId,
    deviceName: options.deviceName,
    activatedAt: now.toISOString(),
  };
}

export async function deactivateDevice(
  database: D1DatabaseLike,
  options: {
    deviceId: string;
    deactivatedByUserId: string;
    now?: Date;
  },
): Promise<boolean> {
  const now = options.now ?? new Date();
  const result = await database
    .prepare(
      "UPDATE activated_devices SET deactivated_at = ?, deactivated_by_user_id = ? WHERE device_id = ? AND deactivated_at IS NULL",
    )
    .bind(now.toISOString(), options.deactivatedByUserId, options.deviceId)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}
